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

try {
  $table = tableName($recurso);
  if (!$codigos || !is_array($codigos)) throw new Exception('Lista de códigos vazia');

  $pdo->beginTransaction();

  // 1) Troca estado se disponível e sem manutenção
  $sqlUpd = "UPDATE `$table` SET status='ocupado', updated_at=NOW()
             WHERE codigo=? AND status='disponivel' AND manutencao=0";
  $upd = $pdo->prepare($sqlUpd);

  $ok = []; $ocupado = []; $manut = []; $inexistente = [];
  foreach ($codigos as $codigo) {
    $sel = $pdo->prepare("SELECT status, manutencao FROM `$table` WHERE codigo=?");
    $sel->execute([$codigo]);
    $row = $sel->fetch();
    if (!$row) { $inexistente[] = $codigo; continue; }
    if ((int)$row['manutencao'] === 1) { $manut[] = $codigo; continue; }
    if ($row['status'] !== 'disponivel') { $ocupado[] = $codigo; continue; }

    $upd->execute([$codigo]);
    if ($upd->rowCount() === 1) $ok[] = $codigo;
    else $ocupado[] = $codigo;
  }

  // 2) Loga empréstimo com dados do solicitante (um registro por item) e MESMO req_id
  if ($ok) {
    $req_id = uuidv4();
    $categoria   = $form['categoria']   ?? null;
    $nome        = $form['nome']        ?? null;
    $turma       = $form['turma']       ?? null;
    $disciplina  = $form['disciplina']  ?? null;
    $atividade   = $form['atividade']   ?? null;
    $cargo_setor = $form['cargoSetor']  ?? null;
    $email       = $form['email']       ?? null;
    $obs         = $form['obs']         ?? null;

    $payload = json_encode($form, JSON_UNESCAPED_UNICODE);

    $ins = $pdo->prepare("
      INSERT INTO movimentos
        (recurso, codigo, tipo, req_id, categoria, nome, turma, disciplina, atividade, cargo_setor, email, obs, payload, retirada_at)
      VALUES
        (?, ?, 'emprestimo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    foreach ($ok as $codigo) {
      $ins->execute([$recurso, $codigo, $req_id, $categoria, $nome, $turma, $disciplina, $atividade, $cargo_setor, $email, $obs, $payload]);
    }
  }

  $pdo->commit();
  echo json_encode(['ok'=>true,'emprestados'=>$ok,'ocupados'=>$ocupado,'manutencao'=>$manut,'inexistentes'=>$inexistente], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
