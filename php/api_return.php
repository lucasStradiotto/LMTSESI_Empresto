<?php
require __DIR__.'/config.php';
header('Content-Type: application/json; charset=utf-8');

$input   = json_decode(file_get_contents('php://input'), true);
$recurso = $input['recurso'] ?? '';
$codigos = $input['codigos'] ?? [];

try {
  $table = tableName($recurso);
  if (!$codigos || !is_array($codigos)) throw new Exception('Lista de códigos vazia');

  $pdo->beginTransaction();

  $sql = "UPDATE `$table` SET status='disponivel', updated_at=NOW()
          WHERE codigo=? AND status='ocupado'";
  $upd = $pdo->prepare($sql);

  $ok = []; $jaLivre = []; $inexistente = [];
  foreach ($codigos as $codigo) {
    $sel = $pdo->prepare("SELECT status FROM `$table` WHERE codigo=?");
    $sel->execute([$codigo]);
    $row = $sel->fetch();
    if (!$row) { $inexistente[] = $codigo; continue; }
    if ($row['status'] !== 'ocupado') { $jaLivre[] = $codigo; continue; }

    $upd->execute([$codigo]);
    if ($upd->rowCount() === 1) {
      $ok[] = $codigo;

      // copia o req_id do último empréstimo (se houver) para amarrar a devolução
      $selReq = $pdo->prepare("SELECT req_id FROM movimentos WHERE recurso=? AND codigo=? AND tipo='emprestimo' ORDER BY created_at DESC LIMIT 1");
      $selReq->execute([$recurso, $codigo]);
      $req_id = $selReq->fetchColumn() ?: null;

      $pdo->prepare("INSERT INTO movimentos (recurso, codigo, tipo, req_id, devolucao_at) VALUES (?, ?, 'devolucao', ?, NOW())")
          ->execute([$recurso, $codigo, $req_id]);
    }
  }

  $pdo->commit();
  echo json_encode(['ok'=>true,'devolvidos'=>$ok,'ja_livres'=>$jaLivre,'inexistentes'=>$inexistente], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
