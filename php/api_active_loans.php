<?php
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

/**
 * Mapeia o recurso lógico para a tabela física.
 * Se você já tiver tableName($recurso) no config.php, pode remover este bloco.
 */
if (!function_exists('tableName')) {
  function tableName(string $recurso): string {
    return match ($recurso) {
      'notebooks' => 'notebook',
      'celulares' => 'celular',
      'cameras'   => 'camera',
      default     => throw new Exception('Recurso inválido')
    };
  }
}

/**
 * Busca os empréstimos ativos para um recurso específico, agrupando por emprestimo_id/req_id
 * e incluindo apenas itens que seguem ocupados (filtro anti-fantasma).
 */
function fetchAtivosPorRecurso(PDO $pdo, string $recurso): array {
  $tbl = tableName($recurso);

  // Puxamos cabeçalho + itens + patrimônio, e filtramos itens que permanecem 'ocupado'
  $sql = "
    SELECT
      ea.id                    AS emprestimo_id,
      ea.req_id                AS req_id,
      ea.categoria             AS categoria,
      ea.nome                  AS nome,
      ea.turma                 AS turma,
      ea.disciplina            AS disciplina,
      ea.atividade             AS atividade,
      ea.cargo_setor           AS cargo_setor,
      ea.email                 AS email,
      ea.obs                   AS obs,
      ea.created_at            AS retirada_at,
      ei.codigo                AS codigo,
      t.patrimonio             AS patrimonio
    FROM emprestimos_ativos ea
    JOIN emprestimo_itens ei
      ON ei.emprestimo_id = ea.id
     AND ei.recurso       = :recurso
    JOIN `$tbl` t
      ON t.codigo = ei.codigo
     AND t.status = 'ocupado'           -- só itens ainda ocupados
    ORDER BY ea.created_at DESC, ei.codigo ASC
  ";
  $st = $pdo->prepare($sql);
  $st->execute([':recurso' => $recurso]);

  $grupos = []; // key por emprestimo_id
  while ($r = $st->fetch(PDO::FETCH_ASSOC)) {
    $empId = (int)$r['emprestimo_id'];
    if (!isset($grupos[$empId])) {
      $grupos[$empId] = [
        'req_id'      => $r['req_id'],
        'recurso'     => $recurso,
        'nome'        => $r['nome'],
        'categoria'   => $r['categoria'],
        'turma'       => $r['turma'],
        'disciplina'  => $r['disciplina'],
        'atividade'   => $r['atividade'],
        'cargo_setor' => $r['cargo_setor'],
        'email'       => $r['email'],
        'obs'         => $r['obs'],
        'retirada_at' => $r['retirada_at'],
        'itens'       => [],
        'quantidade'  => 0,
      ];
    }

    $grupos[$empId]['itens'][] = [
      'codigo'     => (int)$r['codigo'],
      'patrimonio' => $r['patrimonio'],
    ];
    $grupos[$empId]['quantidade']++;
  }

  // retorno como array indexado
  return array_values($grupos);
}

try {
  // Monta payload no formato esperado pelo front
  $ativos = [
    'notebooks' => fetchAtivosPorRecurso($pdo, 'notebooks'),
    'celulares' => fetchAtivosPorRecurso($pdo, 'celulares'),
    'cameras'   => fetchAtivosPorRecurso($pdo, 'cameras'),
  ];

  echo json_encode(['ok' => true, 'ativos' => $ativos], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
