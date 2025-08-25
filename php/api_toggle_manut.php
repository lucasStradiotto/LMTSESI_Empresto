<?php
require __DIR__.'/config.php';
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
$recurso = $input['recurso'] ?? '';
$codigo  = intval($input['codigo'] ?? 0);
$ativo   = intval($input['ativo'] ?? 0) ? 1 : 0; // 1 liga, 0 desliga

try {
  $table = tableName($recurso);
  if ($codigo <= 0) throw new Exception('Código inválido');

  $pdo->beginTransaction();

  if ($ativo) {
    // liga manutenção e deixa como 'disponivel' (não emprestável por causa do flag)
    $sql = "UPDATE `$table` SET manutencao=1, status='disponivel', updated_at=NOW() WHERE codigo=?";
    $tipoMov = 'manut_on';
  } else {
    $sql = "UPDATE `$table` SET manutencao=0, updated_at=NOW() WHERE codigo=?";
    $tipoMov = 'manut_off';
  }
  $upd = $pdo->prepare($sql);
  $upd->execute([$codigo]);

  if ($upd->rowCount() !== 1) throw new Exception('Item não encontrado');

  $pdo->prepare("INSERT INTO movimentos (recurso, codigo, tipo) VALUES (?, ?, ?)")
      ->execute([$recurso, $codigo, $tipoMov]);

  $pdo->commit();
  echo json_encode(['ok'=>true], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(400);
  echo json_encode(['ok'=>false, 'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
