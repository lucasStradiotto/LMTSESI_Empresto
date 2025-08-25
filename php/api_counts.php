<?php
require __DIR__.'/config.php';
header('Content-Type: application/json; charset=utf-8');

function counts(PDO $pdo, string $table){
  $sql = "SELECT 
            SUM(status='disponivel' AND manutencao=0) as livres,
            SUM(status='ocupado') as ocupados,
            SUM(manutencao=1) as manutencao,
            COUNT(*) as total
          FROM `$table`";
  return $pdo->query($sql)->fetch();
}

echo json_encode([
  'ok'=>true,
  'notebooks'=>counts($pdo,'notebook'),
  'celulares'=>counts($pdo,'celular'),
  'cameras'=>counts($pdo,'camera'),
], JSON_UNESCAPED_UNICODE);
