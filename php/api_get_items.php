<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

/*
  Endpoint: api_get_items.php?recurso=notebooks|celulares|cameras

  Retorna:
  {
    "ok": true,
    "data": [
      { "id": 1, "codigo": 1, "patrimonio": "NB0001", "status": "disponivel", "manutencao": 0, "updated_at": "2025-11-03 13:35:13" },
      ...
    ]
  }
*/

// --- Blindagem de saída ---
if (function_exists('ob_get_level') && ob_get_level()) { @ob_end_clean(); }
@ini_set('display_errors', '0');
@ini_set('html_errors', '0');
header('Content-Type: application/json; charset=utf-8');

try {
  // valida/resolve recurso -> tabela
  if (empty($_GET['recurso'])) {
    throw new InvalidArgumentException('Parâmetro "recurso" é obrigatório.');
  }
  $recurso = $_GET['recurso'];
  // Usa tableName do config.php (sem redeclarar!)
  $table = tableName($recurso);

  // busca itens
  $sql = "SELECT id, codigo, patrimonio, status, manutencao, updated_at FROM `$table` ORDER BY codigo ASC";
  $stmt = $pdo->query($sql);

  $data = [];
  while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $data[] = [
      'id'          => (int)$r['id'],
      'codigo'      => (int)$r['codigo'],
      'patrimonio'  => $r['patrimonio'],
      'status'      => $r['status'],
      'manutencao'  => (int)$r['manutencao'],
      'updated_at'  => $r['updated_at'],
    ];
  }

  echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;

} catch (Throwable $e) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
  exit;
}
