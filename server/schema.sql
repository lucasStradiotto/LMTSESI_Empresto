-- ==============================
-- SCHEMA: lab_emprestimos
-- ==============================

CREATE DATABASE IF NOT EXISTS lab_emprestimos
  CHARACTER SET utf8mb4;
USE lab_emprestimos;

-- ------------------------------
-- Tabelas de Itens
-- ------------------------------
CREATE TABLE IF NOT EXISTS notebook (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo INT NOT NULL,
  patrimonio VARCHAR(64) UNIQUE,
  status ENUM('disponivel','ocupado') NOT NULL DEFAULT 'disponivel',
  manutencao TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_notebook_codigo (codigo),
  KEY idx_notebook_status (status),
  KEY idx_notebook_manut (manutencao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS celular (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo INT NOT NULL,
  patrimonio VARCHAR(64) UNIQUE,
  status ENUM('disponivel','ocupado') NOT NULL DEFAULT 'disponivel',
  manutencao TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_celular_codigo (codigo),
  KEY idx_celular_status (status),
  KEY idx_celular_manut (manutencao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS camera (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo INT NOT NULL,
  patrimonio VARCHAR(64) UNIQUE,
  status ENUM('disponivel','ocupado') NOT NULL DEFAULT 'disponivel',
  manutencao TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_camera_codigo (codigo),
  KEY idx_camera_status (status),
  KEY idx_camera_manut (manutencao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------
-- Movimentos (log de ações)
-- ------------------------------
CREATE TABLE IF NOT EXISTS movimentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  -- ID do pedido (mesmo para vários itens do mesmo empréstimo/devolução)
  req_id VARCHAR(64) NULL,
  recurso ENUM('notebooks','celulares','cameras') NOT NULL,
  codigo INT NOT NULL,
  tipo ENUM('emprestimo','devolucao','manut_on','manut_off') NOT NULL,
  payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mov_req (req_id),
  KEY idx_mov_recurso_codigo (recurso, codigo),
  KEY idx_mov_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------
-- VIEW: Empréstimos ativos (agrupamento usa req_id no backend)
-- Mostra itens cujo status atual ainda é 'ocupado'
-- ------------------------------------------------------------------
DROP VIEW IF EXISTS vw_emprestimos_ativos;

CREATE VIEW vw_emprestimos_ativos AS
/* NOTEBOOKS ATIVOS */
SELECT
  m.req_id,
  m.recurso,                   -- 'notebooks'
  m.codigo,                    -- número do item
  n.patrimonio,
  m.created_at AS retirada_at, -- data/hora do empréstimo
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.nome'))        AS nome,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.categoria'))   AS categoria,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.turma'))       AS turma,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.disciplina'))  AS disciplina,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.atividade'))   AS atividade,
  COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.cargoSetor')),
    JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.cargo_setor'))
  ) AS cargo_setor,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.email'))       AS email,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.obs'))         AS obs
FROM movimentos m
JOIN notebook n ON n.codigo = m.codigo
WHERE m.recurso = 'notebooks'
  AND m.tipo    = 'emprestimo'
  AND n.status  = 'ocupado'

UNION ALL

/* CELULARES ATIVOS */
SELECT
  m.req_id,
  m.recurso,                   -- 'celulares'
  m.codigo,
  c.patrimonio,
  m.created_at AS retirada_at,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.nome'))        AS nome,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.categoria'))   AS categoria,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.turma'))       AS turma,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.disciplina'))  AS disciplina,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.atividade'))   AS atividade,
  COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.cargoSetor')),
    JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.cargo_setor'))
  ) AS cargo_setor,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.email'))       AS email,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.obs'))         AS obs
FROM movimentos m
JOIN celular c ON c.codigo = m.codigo
WHERE m.recurso = 'celulares'
  AND m.tipo    = 'emprestimo'
  AND c.status  = 'ocupado'

UNION ALL

/* CÂMERAS ATIVAS */
SELECT
  m.req_id,
  m.recurso,                   -- 'cameras'
  m.codigo,
  ca.patrimonio,
  m.created_at AS retirada_at,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.nome'))        AS nome,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.categoria'))   AS categoria,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.turma'))       AS turma,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.disciplina'))  AS disciplina,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.atividade'))   AS atividade,
  COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.cargoSetor')),
    JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.cargo_setor'))
  ) AS cargo_setor,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.email'))       AS email,
  JSON_UNQUOTE(JSON_EXTRACT(m.payload,'$.obs'))         AS obs
FROM movimentos m
JOIN camera ca ON ca.codigo = m.codigo
WHERE m.recurso = 'cameras'
  AND m.tipo    = 'emprestimo'
  AND ca.status = 'ocupado';
