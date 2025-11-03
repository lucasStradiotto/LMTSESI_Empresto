<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

// Liga erros do PDO (se já não estiver no config)
try {
  if ($pdo instanceof PDO) {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  }
} catch (Throwable $e) {
  // segue o baile; config.php já deve ter setado isso
}

// ===== util =====
function uuidv4(): string {
  $data = random_bytes(16);
  $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
  $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// NADA de tableName() aqui — ela já vem do config.php

// log simples para debug emergencial
function log_debug(string $msg): void {
  @file_put_contents(__DIR__ . '/_loan_debug.log', '['.date('c')."] ".$msg."\n", FILE_APPEND);
}

// ===== input =====
$raw = file_get_contents('php://input') ?: '';
$input = json_decode($raw, true);
if (!$input || !is_array($input)) {
  // fallback: talvez veio como form-encoded
  if (!empty($_POST)) {
    $input = $_POST;
  }
}

$recurso = $input['recurso'] ?? '';
$codigos = $input['codigos'] ?? [];
$form    = $input['form']    ?? [];

try {
  if (!$recurso) throw new Exception('recurso não informado');
  if (!$codigos || !is_array($codigos)) throw new Exception('Lista de códigos vazia/ inválida');

  // usa a tableName() do config.php
  $table = tableName($recurso);

  // Normaliza campos do formulário
  $categoria   = $form['categoria']   ?? null;
  $nome        = $form['nome']        ?? null;
  $turma       = $form['turma']       ?? null;
  $disciplina  = $form['disciplina']  ?? null;
  $atividade   = $form['atividade']   ?? null;
  $cargo_setor = $form['cargoSetor']  ?? ($form['cargo_setor'] ?? null);
  $email       = $form['email']       ?? null;
  $obs         = $form['obs']         ?? null;

  // Validação rápida
  if (!$categoria || !$nome) {
    throw new Exception('Campos obrigatórios ausentes (categoria/nome).');
  }

  // Checa disponibilidade atual (anti-stale)
  $codigos = array_values(array_map('intval', $codigos));
  $place = implode(',', array_fill(0, count($codigos), '?'));
  $stmt  = $pdo->prepare("SELECT codigo, status, manutencao FROM `$table` WHERE codigo IN ($place)");
  $stmt->execute($codigos);
  $map = [];
  while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $map[(int)$r['codigo']] = $r;
  }

  $ok = []; $ocupado = []; $manut = []; $inexistente = [];
  foreach ($codigos as $codigo) {
    if (!isset($map[$codigo])) { $inexistente[] = $codigo; continue; }
    if ((int)$map[$codigo]['manutencao'] === 1) { $manut[] = $codigo; continue; }
    if ($map[$codigo]['status'] !== 'disponivel') { $ocupado[] = $codigo; continue; }
    $ok[] = $codigo;
  }

  if (!$ok) {
    echo json_encode([
      'ok'           => true,
      'emprestados'  => [],
      'ocupados'     => array_map('intval', $ocupado),
      'manutencao'   => array_map('intval', $manut),
      'inexistentes' => array_map('intval', $inexistente)
    ], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $pdo->beginTransaction();

  // 1) cria cabeçalho do empréstimo (um por operação, não por item)
  $req_id = uuidv4();
  $insCab = $pdo->prepare("
    INSERT INTO emprestimos_ativos
      (req_id, categoria, nome, turma, disciplina, atividade, cargo_setor, email, obs, recurso, retirada_at, payload)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
  ");
  $payload = json_encode($form, JSON_UNESCAPED_UNICODE);
  $insCab->execute([
    $req_id, $categoria, $nome, $turma, $disciplina, $atividade, $cargo_setor, $email, $obs, $recurso, $payload
  ]);
  $emprestimo_id = (int)$pdo->lastInsertId();

  // 2) marca itens como ocupados
  $upd = $pdo->prepare("UPDATE `$table` SET status='ocupado', updated_at=NOW() WHERE codigo=? AND status='disponivel' AND manutencao=0");
  foreach ($ok as $codigo) {
    $upd->execute([$codigo]);
    if ($upd->rowCount() !== 1) {
      // alguém pegou no meio do caminho — vai para ocupado (e sai de ok)
      $ocupado[] = $codigo;
    }
  }
  // remove da lista final os que falharam aqui
  $ok = array_values(array_diff($ok, $ocupado));

  // 3) itens do empréstimo + log em movimentos
  if ($ok) {
    $insItem = $pdo->prepare("
      INSERT INTO emprestimo_itens (emprestimo_id, recurso, codigo, patrimonio)
      SELECT ?, ?, n.codigo, n.patrimonio FROM `$table` n WHERE n.codigo=?
    ");
    $insMov  = $pdo->prepare("
      INSERT INTO movimentos
        (recurso, codigo, tipo, req_id, categoria, nome, turma, disciplina, atividade, cargo_setor, email, obs, payload, retirada_at)
      VALUES
        (?, ?, 'emprestimo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    foreach ($ok as $codigo) {
      // item row
      $insItem->execute([$emprestimo_id, $recurso, $codigo]);
      // log
      $insMov->execute([$recurso, $codigo, $req_id, $categoria, $nome, $turma, $disciplina, $atividade, $cargo_setor, $email, $obs, $payload]);
    }
  }

  // 4) Se por algum motivo nenhum item foi ok, apaga cabeçalho
  if (!$ok) {
    $pdo->prepare("DELETE FROM emprestimos_ativos WHERE id=?")->execute([$emprestimo_id]);
  }

  $pdo->commit();

  echo json_encode([
    'ok'            => true,
    'req_id'        => $req_id,
    'emprestimo_id' => $emprestimo_id,
    'emprestados'   => array_map('intval', $ok),
    'ocupados'      => array_map('intval', $ocupado),
    'manutencao'    => array_map('intval', $manut),
    'inexistentes'  => array_map('intval', $inexistente)
  ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  if ($pdo instanceof PDO && $pdo->inTransaction()) {
    $pdo->rollBack();
  }
  log_debug('ERRO: '.$e->getMessage().' | RAW='.$raw);
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
