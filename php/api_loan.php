<?php
require __DIR__.'/config.php';
header('Content-Type: application/json; charset=utf-8');

/** Gera UUID v4 em texto */
function uuidv4(): string {
  $data = random_bytes(16);
  $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
  $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

$input   = json_decode(file_get_contents('php://input'), true);
$recurso = $input['recurso'] ?? '';
$codigos = $input['codigos'] ?? [];
$form    = $input['form']    ?? [];

// Opcional: submission_id para anti-duplo-envio (se o front enviar)
$submissionId = $form['submission_id'] ?? null;

try {
  $table = tableName($recurso);
  if (!$codigos || !is_array($codigos)) {
    throw new Exception('Lista de códigos vazia');
  }

  $pdo->beginTransaction();

  // --- (A) DEDUPLICAÇÃO POR submission_id (janela de 60s) -------------------
  // Só funciona se o front enviar submission_id
  if ($submissionId) {
    try {
      $stmt = $pdo->prepare("
        SELECT ea.req_id
        FROM emprestimos_ativos ea
        WHERE ea.submission_id = ?
          AND ea.created_at >= (NOW() - INTERVAL 60 SECOND)
        ORDER BY ea.id DESC
        LIMIT 1
      ");
      $stmt->execute([$submissionId]);
      $dup = $stmt->fetch(PDO::FETCH_ASSOC);
      if ($dup) {
        // Já processado recentemente — evita duplicar.
        $pdo->commit();
        echo json_encode([
          'ok'          => true,
          'duplicado'   => true,
          'req_id'      => $dup['req_id'],
          'emprestados' => [],
          'ocupados'    => [],
          'manutencao'  => [],
          'inexistentes'=> []
        ], JSON_UNESCAPED_UNICODE);
        exit;
      }
    } catch (\Throwable $e) {
      // Se as tabelas de ativos ainda não existem, apenas segue o fluxo sem dedupe por submission_id
      // (não quebra funcionamento atual)
    }
  }

  // --- (B) TROCA DE ESTADO ITEM A ITEM --------------------------------------
  $sqlUpd = "UPDATE `$table` SET status='ocupado', updated_at=NOW()
             WHERE codigo=? AND status='disponivel' AND manutencao=0";
  $upd = $pdo->prepare($sqlUpd);

  $ok = []; $ocupado = []; $manut = []; $inexistente = [];
  foreach ($codigos as $codigo) {
    $sel = $pdo->prepare("SELECT status, manutencao FROM `$table` WHERE codigo=?");
    $sel->execute([$codigo]);
    $row = $sel->fetch(PDO::FETCH_ASSOC);
    if (!$row) { $inexistente[] = (int)$codigo; continue; }
    if ((int)$row['manutencao'] === 1) { $manut[] = (int)$codigo; continue; }
    if ($row['status'] !== 'disponivel') { $ocupado[] = (int)$codigo; continue; }

    $upd->execute([$codigo]);
    if ($upd->rowCount() === 1) $ok[] = (int)$codigo;
    else $ocupado[] = (int)$codigo;
  }

  // --- (C) LOG EM MOVIMENTOS + ATIVOS (se houve sucesso) --------------------
  $req_id = null;

  if ($ok) {
    $req_id = uuidv4();

    // Campos do formulário (mantidos como já funcionava)
    $categoria   = $form['categoria']   ?? null;
    $nome        = $form['nome']        ?? null;
    $turma       = $form['turma']       ?? null;
    $disciplina  = $form['disciplina']  ?? null;
    $atividade   = $form['atividade']   ?? null;
    $cargo_setor = $form['cargoSetor']  ?? null; // mantido como você já usa
    $email       = $form['email']       ?? null;
    $obs         = $form['obs']         ?? null;

    $payload = json_encode($form, JSON_UNESCAPED_UNICODE);

    // 1 registro por item em "movimentos" (mantém comportamento atual)
    $insMov = $pdo->prepare("
      INSERT INTO movimentos
        (recurso, codigo, tipo, req_id, categoria, nome, turma, disciplina, atividade, cargo_setor, email, obs, payload, retirada_at)
      VALUES
        (?, ?, 'emprestimo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    foreach ($ok as $codigo) {
      $insMov->execute([
        $recurso, $codigo,
        $req_id,
        $categoria, $nome, $turma, $disciplina, $atividade, $cargo_setor, $email, $obs,
        $payload
      ]);
    }

    // --- (C.1) Persistência também em TABELAS DE ATIVOS ---------------------
    // Isso alimenta a Home sem depender de "movimentos" (evita cards fantasma).
    // Se as tabelas ainda não existirem, ignoramos e seguimos (sem quebrar nada).
    try {
      // Cabeçalho do empréstimo ativo
      $insHead = $pdo->prepare("
        INSERT INTO emprestimos_ativos
          (req_id, submission_id, categoria, nome, turma, disciplina, atividade, cargo_setor, email, obs)
        VALUES (?,?,?,?,?,?,?,?,?,?)
      ");
      $insHead->execute([
        $req_id,
        $submissionId, // pode ser null
        $categoria, $nome, $turma, $disciplina, $atividade, $cargo_setor, $email, $obs
      ]);
      $emprestimo_id = (int)$pdo->lastInsertId();

      // Itens ativos (UNIQUE uq_item_ativo (recurso,codigo) impede duplicar)
      $insItem = $pdo->prepare("
        INSERT INTO emprestimo_itens (emprestimo_id, recurso, codigo)
        VALUES (?,?,?)
      ");
      foreach ($ok as $codigo) {
        try {
          $insItem->execute([$emprestimo_id, $recurso, $codigo]);
        } catch (\Throwable $e) {
          // Se já existia ativo (duplicado), ignoramos este item aqui
          // (status do item já foi marcado como ocupado logo acima)
        }
      }
    } catch (\Throwable $e) {
      // Tabelas de ativos inexistentes? Sem problemas. Mantemos o fluxo antigo.
      // Você pode logar isso se quiser: error_log($e->getMessage());
    }
  }

  $pdo->commit();

  // Resposta mantém o formato antigo + agora inclui req_id quando houver
  $resp = [
    'ok'           => true,
    'emprestados'  => $ok,
    'ocupados'     => $ocupado,
    'manutencao'   => $manut,
    'inexistentes' => $inexistente,
  ];
  if ($req_id) $resp['req_id'] = $req_id;

  echo json_encode($resp, JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
