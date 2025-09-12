<?php
require_once __DIR__ . '/config.php';
// Se o seu config.php inicializa $pdo e tem helpers como tableName(), ótimo.
// Este arquivo não precisa de libs de PDF no servidor.

// -------------- 1) Modo JSON: devolve URL ABSOLUTA (p/ QR) ---------------
if (isset($_GET['format']) && $_GET['format'] === 'json') {
    $params = $_GET;
    unset($params['format']);
    $qs = http_build_query($params);

    // Aponte para ESTE endpoint (que vai redirecionar pro viewer) — URL ABSOLUTA
    $absUrl = rtrim(PUBLIC_BASE_URL, '/') . '/php/api_relatorio.php?' . $qs;

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['url' => $absUrl], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ---------------- 2) Router simples por "tipo" ---------------------------
$tipo   = $_GET['tipo']    ?? '';
$rec    = $_GET['rec']     ?? ($_GET['recurso'] ?? ''); // aceita "rec" ou "recurso"

// a) Para recibos (empréstimo/devolução) => REDIRECT para viewer HTML
if ($tipo === 'emprestimo' || $tipo === 'devolucao') {
    // Redireciona para /views/relatorio.html mantendo TODOS os parâmetros
    $qs = http_build_query($_GET);
    $viewer = rtrim(PUBLIC_BASE_URL, '/') . '/views/relatorio.html?' . $qs;
    header('Location: ' . $viewer, true, 302);
    exit;
}

// b) Relatórios antigos: snapshot / movimentos (CSV ou JSON)
$format = $_GET['format'] ?? 'csv'; // csv|json
function out_csv($filename, $header, $rows){
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="'.$filename.'"');
    echo "\xEF\xBB\xBF"; // BOM
    $f = fopen('php://output','w');
    fputcsv($f, $header, ';');
    foreach($rows as $r){ fputcsv($f, $r, ';'); }
    fclose($f);
    exit;
}
function filterTable($recurso){
    if (!$recurso) return null;
    if (function_exists('tableName')) return tableName($recurso);
    // fallback simples
    $map = ['notebooks'=>'notebook','celulares'=>'celular','cameras'=>'camera'];
    return $map[$recurso] ?? null;
}

try {
    if ($tipo === 'snapshot') {
        $tables = ['notebooks'=>'notebook','celulares'=>'celular','cameras'=>'camera'];
        if ($rec){ $tables = [$rec => filterTable($rec)]; }
        $rows=[];
        // $pdo deve vir do seu config.php
        foreach($tables as $key=>$table){
            if (!$table) continue;
            $stmt = $pdo->query("SELECT codigo, patrimonio, status, manutencao, updated_at FROM `$table` ORDER BY codigo ASC");
            while($r=$stmt->fetch()){
                $rows[] = [$key,$r['codigo'],$r['patrimonio'],$r['status'],(int)$r['manutencao'],$r['updated_at']];
            }
        }
        if ($format==='json'){
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ok'=>true,'tipo'=>'snapshot','data'=>$rows], JSON_UNESCAPED_UNICODE);
            exit;
        }
        out_csv('relatorio_snapshot_'.date('Y-m-d_H-i').'.csv', ['recurso','codigo','patrimonio','status','manutencao','updated_at'], $rows);
    }

    if ($tipo === 'movimentos') {
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
            echo json_encode(['ok'=>true,'tipo'=>'movimentos','data'=>$rows], JSON_UNESCAPED_UNICODE);
            exit;
        }
        out_csv('relatorio_movimentos_'.date('Y-m-d_H-i').'.csv', ['recurso','codigo','tipo','created_at','payload'], $rows);
    }

    // Se cair aqui sem "tipo" conhecido:
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok'=>false,'error'=>'Parâmetros inválidos.'], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
