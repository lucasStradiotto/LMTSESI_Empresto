<?php
require __DIR__.'/config.php';

function counts(PDO $pdo, string $table){
  $sql = "SELECT 
            SUM(status='disponivel' AND manutencao=0) as livres,
            SUM(status='ocupado') as ocupados,
            SUM(manutencao=1) as manutencao,
            COUNT(*) as total
          FROM `$table`";
  return $pdo->query($sql)->fetch();
}
function items(PDO $pdo, string $table){
  $stmt = $pdo->query("SELECT id,codigo,patrimonio,status,manutencao,updated_at FROM `$table` ORDER BY codigo ASC");
  return $stmt->fetchAll();
}

try{
  echo json_encode([
    'ok'=>true,
    'counts'=>[
      'notebooks'=>counts($pdo,'notebook'),
      'celulares'=>counts($pdo,'celular'),
      'cameras'  =>counts($pdo,'camera'),
    ],
    'items'=>[
      'notebooks'=>items($pdo,'notebook'),
      'celulares'=>items($pdo,'celular'),
      'cameras'  =>items($pdo,'camera'),
    ],
  ], JSON_UNESCAPED_UNICODE);
}catch(Throwable $e){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
