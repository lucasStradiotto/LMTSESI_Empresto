<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

// === blindagem de saída ===
if (function_exists('ob_get_level') && ob_get_level()) { @ob_end_clean(); }
@ini_set('display_errors', '0');
@ini_set('html_errors', '0');

header('Content-Type: application/json; charset=utf-8');

try {
  // Contagens por recurso
  $counts = [];

  // Notebooks
  $row = $pdo->query("
    SELECT
      SUM(CASE WHEN status='disponivel' THEN 1 ELSE 0 END) AS livres,
      SUM(CASE WHEN status='ocupado'    THEN 1 ELSE 0 END) AS ocupados,
      SUM(CASE WHEN manutencao=1        THEN 1 ELSE 0 END) AS manutencao,
      COUNT(*) AS total
    FROM notebook
  ")->fetch();
  $counts['notebooks'] = [
    'livres'      => (int)($row['livres'] ?? 0),
    'ocupados'    => (int)($row['ocupados'] ?? 0),
    'manutencao'  => (int)($row['manutencao'] ?? 0),
    'total'       => (int)($row['total'] ?? 0)
  ];

  // Celulares
  $row = $pdo->query("
    SELECT
      SUM(CASE WHEN status='disponivel' THEN 1 ELSE 0 END) AS livres,
      SUM(CASE WHEN status='ocupado'    THEN 1 ELSE 0 END) AS ocupados,
      SUM(CASE WHEN manutencao=1        THEN 1 ELSE 0 END) AS manutencao,
      COUNT(*) AS total
    FROM celular
  ")->fetch();
  $counts['celulares'] = [
    'livres'      => (int)($row['livres'] ?? 0),
    'ocupados'    => (int)($row['ocupados'] ?? 0),
    'manutencao'  => (int)($row['manutencao'] ?? 0),
    'total'       => (int)($row['total'] ?? 0)
  ];

  // Câmeras
  $row = $pdo->query("
    SELECT
      SUM(CASE WHEN status='disponivel' THEN 1 ELSE 0 END) AS livres,
      SUM(CASE WHEN status='ocupado'    THEN 1 ELSE 0 END) AS ocupados,
      SUM(CASE WHEN manutencao=1        THEN 1 ELSE 0 END) AS manutencao,
      COUNT(*) AS total
    FROM camera
  ")->fetch();
  $counts['cameras'] = [
    'livres'      => (int)($row['livres'] ?? 0),
    'ocupados'    => (int)($row['ocupados'] ?? 0),
    'manutencao'  => (int)($row['manutencao'] ?? 0),
    'total'       => (int)($row['total'] ?? 0)
  ];

  // Listas dos itens (para preencher selects/grades no front)
  $items = [
    'notebooks' => [],
    'celulares' => [],
    'cameras'   => [],
  ];

  $stmt = $pdo->query("SELECT id, codigo, patrimonio, status, manutencao, updated_at FROM notebook ORDER BY codigo ASC");
  while ($r = $stmt->fetch()) {
    $items['notebooks'][] = [
      'id'          => (int)$r['id'],
      'codigo'      => (int)$r['codigo'],
      'patrimonio'  => $r['patrimonio'],
      'status'      => $r['status'],
      'manutencao'  => (int)$r['manutencao'],
      'updated_at'  => $r['updated_at'],
    ];
  }

  $stmt = $pdo->query("SELECT id, codigo, patrimonio, status, manutencao, updated_at FROM celular ORDER BY codigo ASC");
  while ($r = $stmt->fetch()) {
    $items['celulares'][] = [
      'id'          => (int)$r['id'],
      'codigo'      => (int)$r['codigo'],
      'patrimonio'  => $r['patrimonio'],
      'status'      => $r['status'],
      'manutencao'  => (int)$r['manutencao'],
      'updated_at'  => $r['updated_at'],
    ];
  }

  $stmt = $pdo->query("SELECT id, codigo, patrimonio, status, manutencao, updated_at FROM camera ORDER BY codigo ASC");
  while ($r = $stmt->fetch()) {
    $items['cameras'][] = [
      'id'          => (int)$r['id'],
      'codigo'      => (int)$r['codigo'],
      'patrimonio'  => $r['patrimonio'],
      'status'      => $r['status'],
      'manutencao'  => (int)$r['manutencao'],
      'updated_at'  => $r['updated_at'],
    ];
  }

  echo json_encode(
    ['ok' => true, 'counts' => $counts, 'items' => $items],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
  );
  exit;

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false, 'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
  exit;
}
