<?php
require __DIR__.'/config.php';
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
$recurso = $input['recurso'] ?? '';
$codigos = $input['codigos'] ?? [];
$form    = $input['form']    ?? [];

try {
  $table = tableName($recurso);
  if (!$codigos || !is_array($codigos)) throw new Exception('Lista de códigos vazia');

  $pdo->beginTransaction();

  // UPDATE atômico por item: só troca se disponível e sem manutenção
  $sqlUpd = "UPDATE `$table`
             SET status='ocupado', updated_at=NOW()
             WHERE codigo=? AND status='disponivel' AND manutencao=0";
  $upd = $pdo->prepare($sqlUpd);

  $ok = []; $ocupado = []; $manut = []; $inexistente = [];
  foreach ($codigos as $codigo) {
    // checagem de estado atual para feedback granular
    $sel = $pdo->prepare("SELECT status, manutencao FROM `$table` WHERE codigo=?");
    $sel->execute([$codigo]);
    $row = $sel->fetch();
    if (!$row) { $inexistente[] = $codigo; continue; }
    if ((int)$row['manutencao'] === 1) { $manut[] = $codigo; continue; }
    if ($row['status'] !== 'disponivel') { $ocupado[] = $codigo; continue; }

    $upd->execute([$codigo]);
    if ($upd->rowCount() === 1) $ok[] = $codigo;
    else $ocupado[] = $codigo; // corrida: alguém pegou no meio do caminho
  }

  // loga no histórico
  if ($ok) {
    $payload = json_encode($form, JSON_UNESCAPED_UNICODE);
    $ins = $pdo->prepare("INSERT INTO movimentos (recurso, codigo, tipo, payload) VALUES (?, ?, 'emprestimo', ?)");
    foreach ($ok as $codigo) $ins->execute([$recurso, $codigo, $payload]);
  }

  $pdo->commit();

  echo json_encode(['ok'=>true, 'emprestados'=>$ok, 'ocupados'=>$ocupado, 'manutencao'=>$manut, 'inexistentes'=>$inexistente], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(400);
  echo json_encode(['ok'=>false, 'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
