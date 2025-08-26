<?php
require __DIR__.'/config.php';

$tipo   = $_GET['tipo']   ?? 'snapshot';  // snapshot | movimentos
$format = $_GET['format'] ?? 'csv';       // csv | json
$rec    = $_GET['recurso']?? '';          // notebooks|celulares|cameras (opcional)

function out_csv($filename, $header, $rows){
  header('Content-Type: text/csv; charset=utf-8');
  header('Content-Disposition: attachment; filename="'.$filename.'"');
  echo "\xEF\xBB\xBF"; // BOM
  $f = fopen('php://output','w');
  fputcsv($f, $header, ';');
  foreach($rows as $r){ fputcsv($f, $r, ';'); }
  fclose($f); exit;
}
function filterTable($recurso){
  if (!$recurso) return null;
  return tableName($recurso);
}

try{
  if ($tipo==='snapshot'){
    $tables = ['notebooks'=>'notebook','celulares'=>'celular','cameras'=>'camera'];
    if ($rec){ $tables = [$rec => filterTable($rec)]; }
    $rows=[];
    foreach($tables as $key=>$table){
      $stmt = $pdo->query("SELECT codigo, patrimonio, status, manutencao, updated_at FROM `$table` ORDER BY codigo ASC");
      while($r=$stmt->fetch()){
        $rows[] = [$key,$r['codigo'],$r['patrimonio'],$r['status'],(int)$r['manutencao'],$r['updated_at']];
      }
    }
    if ($format==='json'){
      header('Content-Type: application/json; charset=utf-8');
      echo json_encode(['ok'=>true,'tipo'=>'snapshot','data'=>$rows], JSON_UNESCAPED_UNICODE); exit;
    }
    out_csv('relatorio_snapshot_'.date('Y-m-d_H-i').'.csv', ['recurso','codigo','patrimonio','status','manutencao','updated_at'], $rows);
  }

  if ($tipo==='movimentos'){
    $sql = "SELECT recurso,codigo,tipo,created_at,payload FROM movimentos";
    $params=[];
    if ($rec){ $sql.=" WHERE recurso=?"; $params[]=$rec; }
    $sql.=" ORDER BY created_at DESC";
    $stmt=$pdo->prepare($sql); $stmt->execute($params);
    $rows=[];
    while($m=$stmt->fetch()){
      $rows[] = [$m['recurso'],$m['codigo'],$m['tipo'],$m['created_at'],$m['payload']];
    }
    if ($format==='json'){
      header('Content-Type: application/json; charset=utf-8');
      echo json_encode(['ok'=>true,'tipo'=>'movimentos','data'=>$rows], JSON_UNESCAPED_UNICODE); exit;
    }
    out_csv('relatorio_movimentos_'.date('Y-m-d_H-i').'.csv', ['recurso','codigo','tipo','created_at','payload'], $rows);
  }
}catch(Throwable $e){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
