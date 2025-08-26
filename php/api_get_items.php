<?php
require __DIR__.'/config.php';

$recurso = $_GET['recurso'] ?? '';
try{
  $table = tableName($recurso);
  $stmt = $pdo->query("SELECT id,codigo,patrimonio,status,manutencao,updated_at FROM `$table` ORDER BY codigo ASC");
  echo json_encode(['ok'=>true,'data'=>$stmt->fetchAll()], JSON_UNESCAPED_UNICODE);
}catch(Throwable $e){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
