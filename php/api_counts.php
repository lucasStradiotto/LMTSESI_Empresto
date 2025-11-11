<?php
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

try {
  $counts = [];

  foreach (['notebooks'=>'notebook', 'celulares'=>'celular', 'cameras'=>'camera'] as $rec => $tbl) {
    // total
    $total = (int)$pdo->query("SELECT COUNT(*) AS n FROM `$tbl`")->fetch()['n'];

    // livres = disponivel e sem manutenção
    $livres = (int)$pdo->query("SELECT COUNT(*) AS n FROM `$tbl` WHERE status='disponivel' AND manutencao=0")->fetch()['n'];

    // ocupados
    $ocup = (int)$pdo->query("SELECT COUNT(*) AS n FROM `$tbl` WHERE status='ocupado'")->fetch()['n'];

    // manutencao
    $manu = (int)$pdo->query("SELECT COUNT(*) AS n FROM `$tbl` WHERE manutencao=1")->fetch()['n'];

    $counts[$rec] = [
      'livres'     => $livres,
      'ocupados'   => $ocup,
      'manutencao' => $manu,
      'total'      => $total
    ];
  }

  echo json_encode(['ok'=>true, 'counts'=>$counts], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(400);
  echo json_encode(['ok'=>false, 'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
