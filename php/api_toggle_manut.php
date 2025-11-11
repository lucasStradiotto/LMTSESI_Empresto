<?php
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

try {
  // Lê JSON; fallback para POST form
  $raw = file_get_contents('php://input');
  $in = json_decode($raw, true);
  if (!$in) $in = $_POST;

  $recurso = $in['recurso'] ?? '';
  $codigo  = isset($in['codigo']) ? (int)$in['codigo'] : 0;
  $ativo   = isset($in['ativo'])  ? (int)$in['ativo']  : null; // 1 liga manutenção, 0 desliga

  if (!$recurso || !$codigo || ($ativo !== 0 && $ativo !== 1)) {
    throw new Exception('Parâmetros inválidos');
  }

  // Usa tableName do config.php (já definida lá)
  $table = tableName($recurso);

  // Verifica estado atual
  $sel = $pdo->prepare("SELECT status, manutencao FROM `$table` WHERE codigo=?");
  $sel->execute([$codigo]);
  $row = $sel->fetch();
  if (!$row) throw new Exception('Item inexistente');

  // Regra de negócio: se for ativar manutenção e item estiver ocupado → bloqueia
  if ($ativo === 1 && $row['status'] === 'ocupado') {
    throw new Exception('Item está ocupado. Devolva antes de colocar em manutenção.');
  }

  // Atualiza manutenção
  $upd = $pdo->prepare("UPDATE `$table` SET manutencao=?, updated_at=NOW() WHERE codigo=?");
  $upd->execute([$ativo, $codigo]);

  if ($upd->rowCount() < 1) {
    // Sem mudança efetiva; ainda assim seguimos, mas sinalizamos ok
  }

  // Retorna counts atualizados para já atualizar os badges no front
  // (mesma lógica do api_counts.php)
  $counts = [];

  foreach (['notebooks'=>'notebook', 'celulares'=>'celular', 'cameras'=>'camera'] as $rec => $tbl) {
    // total
    $total = (int)$pdo->query("SELECT COUNT(*) AS n FROM `$tbl`")->fetch()['n'];

    // livres = disponivel e manutencao = 0
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
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
