-- 04_procs_movimentacao.sql
USE lab_emprestimos;
DELIMITER $$

-- Utilitário: resolve nome da tabela física a partir do recurso
DROP PROCEDURE IF EXISTS _resolve_table_for_recurso $$
CREATE PROCEDURE _resolve_table_for_recurso(
  IN p_recurso ENUM('notebooks','celulares','cameras'),
  OUT p_table VARCHAR(32)
)
BEGIN
  CASE p_recurso
    WHEN 'notebooks' THEN SET p_table = 'notebook';
    WHEN 'celulares' THEN SET p_table = 'celular';
    WHEN 'cameras'   THEN SET p_table = 'camera';
    ELSE SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Recurso inválido';
  END CASE;
END $$


-- =============== EMPRESTAR ===============
-- Espera: p_codigos_json = JSON array de inteiros: e.g. '[1,2,3]'
-- Cria header (emprestimos_ativos), itens (emprestimo_itens), marca itens 'ocupado'
-- Escreve no LOG (movimentos) com req_id único

DROP PROCEDURE IF EXISTS sp_registrar_emprestimo $$
CREATE PROCEDURE sp_registrar_emprestimo(
  IN  p_recurso         ENUM('notebooks','celulares','cameras'),
  IN  p_codigos_json    JSON,
  IN  p_categoria       VARCHAR(32),
  IN  p_nome            VARCHAR(255),
  IN  p_turma           VARCHAR(64),
  IN  p_disciplina      VARCHAR(128),
  IN  p_atividade       VARCHAR(255),
  IN  p_cargo_setor     VARCHAR(128),
  IN  p_email           VARCHAR(255),
  IN  p_obs             TEXT,
  OUT p_req_id          CHAR(36)
)
BEGIN
  DECLARE v_table VARCHAR(32);
  DECLARE v_emp_id BIGINT;
  DECLARE v_now DATETIME;

  CALL _resolve_table_for_recurso(p_recurso, v_table);
  SET v_now = NOW();

  START TRANSACTION;

  -- Gera um req_id (UUID v4 simplificado via UUID())
  SET p_req_id = UUID();

  -- Cria header
  INSERT INTO emprestimos_ativos (req_id, categoria, nome, turma, disciplina, atividade, cargo_setor, email, obs, created_at)
  VALUES (p_req_id, p_categoria, p_nome, p_turma, p_disciplina, p_atividade, p_cargo_setor, p_email, p_obs, v_now);
  SET v_emp_id = LAST_INSERT_ID();

  -- Itera JSON de códigos
  -- Para cada código: valida disponível + sem manutenção, marca 'ocupado', cria emprestimo_itens e movimento
  SET @i = 0;
  SET @len = JSON_LENGTH(p_codigos_json);

  WHILE @i < @len DO
    SET @codigo = JSON_EXTRACT(p_codigos_json, CONCAT('$[', @i, ']'));

    -- JSON_EXTRACT retorna número como JSON; converte para INT
    SET @codigo_int = CAST(@codigo AS UNSIGNED);

    -- Validação + UPDATE dinâmico
    SET @sql_upd = CONCAT(
      "UPDATE `", v_table, "` ",
      "SET status='ocupado', updated_at=NOW() ",
      "WHERE codigo=? AND status='disponivel' AND manutencao=0"
    );
    PREPARE stmt_upd FROM @sql_upd;
    EXECUTE stmt_upd USING @codigo_int;
    DEALLOCATE PREPARE stmt_upd;

    -- Verifica se atualizou (se não, ignora este código)
    SET @rowc = ROW_COUNT();
    IF @rowc = 1 THEN
      -- amarra no ativo
      INSERT INTO emprestimo_itens (emprestimo_id, recurso, codigo)
      VALUES (v_emp_id, p_recurso, @codigo_int);

      -- log
      INSERT INTO movimentos
        (recurso, codigo, tipo, req_id, categoria, nome, turma, disciplina, atividade, cargo_setor, email, obs, payload, retirada_at)
      VALUES
        (p_recurso, @codigo_int, 'emprestimo', p_req_id, p_categoria, p_nome, p_turma, p_disciplina, p_atividade, p_cargo_setor, p_email, p_obs, NULL, v_now);
    END IF;

    SET @i = @i + 1;
  END WHILE;

  -- Se por algum motivo não ficou nenhum item válido, desfaz header
  IF (SELECT COUNT(*) FROM emprestimo_itens WHERE emprestimo_id = v_emp_id) = 0 THEN
    DELETE FROM emprestimos_ativos WHERE id = v_emp_id;
    -- req_id segue gerado, mas sem efeito; devolve NULL pra clareza
    SET p_req_id = NULL;
  END IF;

  COMMIT;
END $$


-- =============== DEVOLVER ===============
-- Espera: p_codigos_json = JSON array de inteiros: e.g. '[1,2]'
-- Marca itens 'disponivel', apaga dos ativos; se zerar, remove o header.
-- Aceita devolver itens de um pedido específico (p_req_id) OU de qualquer ativo daquele recurso (auto-detect).

DROP PROCEDURE IF EXISTS sp_registrar_devolucao $$
CREATE PROCEDURE sp_registrar_devolucao(
  IN  p_recurso         ENUM('notebooks','celulares','cameras'),
  IN  p_codigos_json    JSON,
  IN  p_req_id          CHAR(36)  -- pode ser NULL, e a devolução procura o header certo que contenha o item
)
BEGIN
  DECLARE v_table VARCHAR(32);
  DECLARE v_now DATETIME;

  CALL _resolve_table_for_recurso(p_recurso, v_table);
  SET v_now = NOW();

  START TRANSACTION;

  SET @i = 0;
  SET @len = JSON_LENGTH(p_codigos_json);

  WHILE @i < @len DO
    SET @codigo = JSON_EXTRACT(p_codigos_json, CONCAT('$[', @i, ']'));
    SET @codigo_int = CAST(@codigo AS UNSIGNED);

    -- Marca como disponível na tabela física, apenas se estava ocupado
    SET @sql_upd = CONCAT(
      "UPDATE `", v_table, "` ",
      "SET status='disponivel', updated_at=NOW() ",
      "WHERE codigo=? AND status='ocupado'"
    );
    PREPARE stmt_upd FROM @sql_upd;
    EXECUTE stmt_upd USING @codigo_int;
    DEALLOCATE PREPARE stmt_upd;

    -- Descobre o emprestimo_id alvo: se p_req_id foi passado, usa; caso contrário, encontra um header que contenha esse item
    SET @emp_id = NULL;
    IF p_req_id IS NOT NULL THEN
      SELECT id INTO @emp_id FROM emprestimos_ativos WHERE req_id = p_req_id LIMIT 1;
    ELSE
      SELECT ei.emprestimo_id
        INTO @emp_id
      FROM emprestimo_itens ei
      WHERE ei.recurso = p_recurso AND ei.codigo = @codigo_int
      ORDER BY ei.created_at DESC
      LIMIT 1;
    END IF;

    -- Remove item do ativo (se existir esse vínculo)
    IF @emp_id IS NOT NULL THEN
      DELETE FROM emprestimo_itens
      WHERE emprestimo_id = @emp_id AND recurso = p_recurso AND codigo = @codigo_int;

      -- Se cabeçalho ficou sem itens, remove
      IF (SELECT COUNT(*) FROM emprestimo_itens WHERE emprestimo_id = @emp_id) = 0 THEN
        DELETE FROM emprestimos_ativos WHERE id = @emp_id;
      END IF;
    END IF;

    -- log
    INSERT INTO movimentos (recurso, codigo, tipo, req_id, payload, retirada_at)
    VALUES (p_recurso, @codigo_int, 'devolucao', p_req_id, NULL, NULL);

    SET @i = @i + 1;
  END WHILE;

  COMMIT;
END $$

DELIMITER ;
