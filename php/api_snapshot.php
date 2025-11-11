<?php
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

try {
  $out = [
    'ok' => true,
    'counts' => [],
    'items' => []
  ];

  $map = ['notebooks'=>'notebook', 'celulares'=>'celular', 'cameras'=>'camera'];

  foreach ($map as $rec => $tbl) {
    // counts
    $total = (int)$pdo->query("SELECT COUNT(*) AS n FROM `$tbl`")->fetch()['n'];
    $livres = (int)$pdo->query("SELECT COUNT(*) AS n FROM `$tbl` WHERE status='disponivel' AND manutencao=0")->fetch()['n'];
    $ocup   = (int)$pdo->query("SELECT COUNT(*) AS n FROM `$tbl` WHERE status='ocupado'")->fetch()['n'];
    $manu   = (int)$pdo->query("SELECT COUNT(*) AS n FROM `$tbl` WHERE manutencao=1")->fetch()['n'];

    $out['counts'][$rec] = [
      'livres'     => $livres,
      'ocupados'   => $ocup,
      'manutencao' => $manu,
      'total'      => $total
    ];

    // items (usado para grids)
    $stmt = $pdo->query("SELECT id, codigo, patrimonio, status, manutencao, updated_at FROM `$tbl` ORDER BY codigo ASC");
    $out['items'][$rec] = $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  echo json_encode($out, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
