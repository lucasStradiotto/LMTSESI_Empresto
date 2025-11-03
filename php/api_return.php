<?php
require __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

/**
 * Map do recurso textual para a tabela física
 * Reutiliza a mesma função se você já tem tableName($recurso) no config.php
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

try {
  $input   = json_decode(file_get_contents('php://input'), true);
  $recurso = $input['recurso'] ?? '';
  $codigos = $input['codigos'] ?? [];

  if (!$recurso) throw new Exception('Recurso não informado');
  if (!$codigos || !is_array($codigos)) throw new Exception('Lista de códigos vazia');

  $table = tableName($recurso);

  $pdo->beginTransaction();

  // Preparados
  $selItem   = $pdo->prepare("SELECT status FROM `$table` WHERE codigo=?");
  $updLivre  = $pdo->prepare("UPDATE `$table` SET status='disponivel', updated_at=NOW() WHERE codigo=? AND status='ocupado'");

  // Para achar o emprestimo_id/req_id de cada item ativo
  $selEmpItem = $pdo->prepare("
    SELECT ei.emprestimo_id, ea.req_id
    FROM emprestimo_itens ei
    JOIN emprestimos_ativos ea ON ea.id = ei.emprestimo_id
    WHERE ei.recurso=? AND ei.codigo=?
    LIMIT 1
  ");

  // Metadados do cabeçalho (para log no movimentos)
  $selHeaderById = $pdo->prepare("
    SELECT req_id, categoria, nome, turma, disciplina, atividade, cargo_setor, email, obs, created_at
    FROM emprestimos_ativos
    WHERE id=?
    LIMIT 1
  ");

  // DELETE item do ativo
  $delEmpItem = $pdo->prepare("
    DELETE FROM emprestimo_itens
    WHERE emprestimo_id=? AND recurso=? AND codigo=?
  ");

  // Verificar remanescente dos itens no cabeçalho
  $countRestantes = $pdo->prepare("
    SELECT COUNT(*) AS n
    FROM emprestimo_itens
    WHERE emprestimo_id=?
  ");

  // DELETE cabeçalho quando zerar
  $delHeader = $pdo->prepare("
    DELETE FROM emprestimos_ativos
    WHERE id=?
  ");

  // Inserir movimento de devolução
  $insMov = $pdo->prepare("
    INSERT INTO movimentos
      (recurso, codigo, tipo, req_id, categoria, nome, turma, disciplina, atividade, cargo_setor, email, obs, payload, retirada_at)
    VALUES
      (?, ?, 'devolucao', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ");

  $devolvidos = [];
  $jaLivres   = [];
  $inex       = [];

  // Para reduzir chamadas ao DB, cache de cabeçalhos carregados por emprestimo_id
  $headerCache = [];

  foreach ($codigos as $codigo) {
    // 1) Confere se existe e status
    $selItem->execute([$codigo]);
    $row = $selItem->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
      $inex[] = (int)$codigo;
      continue;
    }

    // 2) Atualiza status => disponivel (se estava ocupado)
    $updLivre->execute([$codigo]);
    if ($updLivre->rowCount() === 0) {
      // Já estava livre (ou falhou por outro motivo)
      $jaLivres[] = (int)$codigo;
      continue;
    }

    // 3) Encontrar emprestimo_id + req_id (de onde vamos remover o item e pegar metadados)
    $selEmpItem->execute([$recurso, $codigo]);
    $empRow = $selEmpItem->fetch(PDO::FETCH_ASSOC);

    $emprestimo_id = $empRow['emprestimo_id'] ?? null;
    $req_id        = $empRow['req_id'] ?? null;

    // Mesmo que por alguma razão não haja linha em emprestimo_itens (inconsistência),
    // seguimos e logamos a devolução com req_id nulo; mas tentamos manter coerência.
    if ($emprestimo_id) {
      // 4) Remover item da lista de ativos
      $delEmpItem->execute([$emprestimo_id, $recurso, $codigo]);

      // 5) Verificar se zerou itens do cabeçalho
      $countRestantes->execute([$emprestimo_id]);
      $nRest = (int)$countRestantes->fetchColumn();

      // 6) Carregar metadados do cabeçalho (para log)
      if (!isset($headerCache[$emprestimo_id])) {
        $selHeaderById->execute([$emprestimo_id]);
        $headerCache[$emprestimo_id] = $selHeaderById->fetch(PDO::FETCH_ASSOC) ?: [];
      }
      $hdr = $headerCache[$emprestimo_id];

      // 7) Montar payload de log (opcional: registrar item devolvido e timestamp)
      $payload = json_encode([
        'devolucao' => [
          'recurso'   => $recurso,
          'codigo'    => (int)$codigo,
          'at'        => date('c'),
          'req_id'    => $req_id,
          'solicitante' => [
            'categoria'   => $hdr['categoria']   ?? null,
            'nome'        => $hdr['nome']        ?? null,
            'turma'       => $hdr['turma']       ?? null,
            'disciplina'  => $hdr['disciplina']  ?? null,
            'atividade'   => $hdr['atividade']   ?? null,
            'cargo_setor' => $hdr['cargo_setor'] ?? null,
            'email'       => $hdr['email']       ?? null,
            'obs'         => $hdr['obs']         ?? null,
            'retirada_at' => $hdr['created_at']  ?? null,
          ]
        ]
      ], JSON_UNESCAPED_UNICODE);

      // 8) Inserir movimento de devolução
      $insMov->execute([
        $recurso,
        $codigo,
        $req_id,
        $hdr['categoria']   ?? null,
        $hdr['nome']        ?? null,
        $hdr['turma']       ?? null,
        $hdr['disciplina']  ?? null,
        $hdr['atividade']   ?? null,
        $hdr['cargo_setor'] ?? null,
        $hdr['email']       ?? null,
        $hdr['obs']         ?? null,
        $payload,
        $hdr['created_at']  ?? null, // guardamos a retirada original no campo retirada_at
      ]);

      // 9) Se zerou, remove cabeçalho
      if ($nRest === 0) {
        $delHeader->execute([$emprestimo_id]);
        // Limpa cache para não reaproveitar metadados de um header já removido
        unset($headerCache[$emprestimo_id]);
      }
    } else {
      // Não encontramos o item em emprestimo_itens (inconsistência),
      // ainda assim registramos um movimento mínimo com req_id nulo
      $payload = json_encode([
        'devolucao' => [
          'recurso' => $recurso,
          'codigo'  => (int)$codigo,
          'at'      => date('c'),
          'req_id'  => null
        ]
      ], JSON_UNESCAPED_UNICODE);

      $insMov->execute([
        $recurso,
        $codigo,
        null, // req_id
        null, null, null, null, null, null, null, null,
        $payload,
        null  // retirada_at
      ]);
    }

    $devolvidos[] = (int)$codigo;
  }

  $pdo->commit();
  echo json_encode([
    'ok'         => true,
    'devolvidos' => $devolvidos,
    'ja_livres'  => $jaLivres,
    'inexistentes' => $inex
  ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
