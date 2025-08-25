<?php
require __DIR__.'/config.php';

$recurso = $_GET['recurso'] ?? ''; // notebooks | celulares | cameras
$table = tableName($recurso);

$stmt = $pdo->query("SELECT id, codigo, patrimonio, status, manutencao FROM `$table` ORDER BY codigo ASC");
echo json_encode([
  'ok' => true,
  'data' => $stmt->fetchAll()
], JSON_UNESCAPED_UNICODE);
