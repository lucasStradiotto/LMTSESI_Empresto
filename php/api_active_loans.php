<?php
require __DIR__.'/config.php';
header('Content-Type: application/json; charset=utf-8');

/*
 Retorna grupos de empréstimos ativos agregados por (req_id, recurso):
 - Cada grupo traz dados do solicitante + lista de itens [{codigo, patrimonio}]
 - Facilita mostrar um card por pedido (com contagem) no front
*/

try{
  // 1) Carrega o mapa de patrimônios de cada tabela (1 query por recurso)
  $mapPat = [
    'notebooks' => [],
    'celulares' => [],
    'cameras'   => []
  ];
  foreach (['notebooks'=>'notebook','celulares'=>'celular','cameras'=>'camera'] as $rec => $table) {
    $stmt = $pdo->query("SELECT codigo, patrimonio FROM `$table`");
    while ($r = $stmt->fetch()) {
      $mapPat[$rec][(int)$r['codigo']] = $r['patrimonio'];
    }
  }

  // 2) Busca os empréstimos ativos (por item) a partir da VIEW
  $sql = "SELECT recurso, codigo, req_id, categoria, nome, turma, disciplina, atividade, cargo_setor, email, obs, retirada_at
          FROM vw_emprestimos_ativos
          ORDER BY recurso, req_id, codigo";
  $rows = $pdo->query($sql)->fetchAll();

  // 3) Agrega por (recurso, req_id)
  $groups = []; // [recurso][] = group
  $byKey   = []; // "recurso|req_id" => &group

  foreach ($rows as $r) {
    $recurso = $r['recurso'];
    $reqId   = $r['req_id'];
    $key     = $recurso.'|'.$reqId;

    if (!isset($byKey[$key])) {
      $group = [
        'req_id'     => $reqId,
        'recurso'    => $recurso,
        'categoria'  => $r['categoria'],
        'nome'       => $r['nome'],
        'turma'      => $r['turma'],
        'disciplina' => $r['disciplina'],
        'atividade'  => $r['atividade'],
        'cargo_setor'=> $r['cargo_setor'],
        'email'      => $r['email'],
        'obs'        => $r['obs'],
        'retirada_at'=> $r['retirada_at'],
        'itens'      => []
      ];
      $groups[$recurso][] = $group;
      // aponta para a última referência do array (acabamos de inserir)
      $byKey[$key] = &$groups[$recurso][count($groups[$recurso]) - 1];
    }

    $codigo = (int)$r['codigo'];
    $byKey[$key]['itens'][] = [
      'codigo'     => $codigo,
      'patrimonio' => $mapPat[$recurso][$codigo] ?? null
    ];
  }

  // 4) Adiciona 'quantidade'
  foreach ($groups as $rec => &$arr) {
    foreach ($arr as &$g) {
      $g['quantidade'] = count($g['itens']);
    }
  }

  // Garante chaves mesmo vazias
  $out = [
    'notebooks' => $groups['notebooks'] ?? [],
    'celulares' => $groups['celulares'] ?? [],
    'cameras'   => $groups['cameras']   ?? [],
  ];

  echo json_encode(['ok'=>true,'ativos'=>$out], JSON_UNESCAPED_UNICODE);

}catch(Throwable $e){
  http_response_code(400);
  echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
