-- =========================================================
-- LMT SESI — Empréstimos
-- Schema completo (DB + Tabelas + Índices + View compatível)
-- =========================================================

-- 0) Cria o banco (se não existir) e usa
CREATE DATABASE IF NOT EXISTS lab_emprestimos
  CHARACTER SET utf8mb4;
USE lab_emprestimos;

-- Segurança: desligar checagem de FKs na recriação
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS=0;

-- =============== DROP (para recriar limpo) =================
DROP VIEW IF EXISTS vw_emprestimos_ativos;

DROP TABLE IF EXISTS emprestimo_itens;
DROP TABLE IF EXISTS emprestimos_ativos;

DROP TABLE IF EXISTS movimentos;
DROP TABLE IF EXISTS camera;
DROP TABLE IF EXISTS celular;
DROP TABLE IF EXISTS notebook;

-- =============== Tabelas de recursos =======================

CREATE TABLE notebook (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  codigo       INT NOT NULL,
  patrimonio   VARCHAR(64) UNIQUE,
  status       ENUM('disponivel','ocupado') NOT NULL DEFAULT 'disponivel',
  manutencao   TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_notebook_codigo (codigo),
  KEY idx_notebook_status (status),
  KEY idx_notebook_manut (manutencao)
) ENGINE=InnoDB;

CREATE TABLE celular (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  codigo       INT NOT NULL,
  patrimonio   VARCHAR(64) UNIQUE,
  status       ENUM('disponivel','ocupado') NOT NULL DEFAULT 'disponivel',
  manutencao   TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_celular_codigo (codigo),
  KEY idx_celular_status (status),
  KEY idx_celular_manut (manutencao)
) ENGINE=InnoDB;

CREATE TABLE camera (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  codigo       INT NOT NULL,
  patrimonio   VARCHAR(64) UNIQUE,
  status       ENUM('disponivel','ocupado') NOT NULL DEFAULT 'disponivel',
  manutencao   TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_camera_codigo (codigo),
  KEY idx_camera_status (status),
  KEY idx_camera_manut (manutencao)
) ENGINE=InnoDB;

-- =============== Movimentos (log histórico) =================
-- Observação: ampliado para suportar inserts do api_loan/api_return
CREATE TABLE movimentos (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  recurso       ENUM('notebooks','celulares','cameras') NOT NULL,
  codigo        INT NOT NULL,
  tipo          ENUM('emprestimo','devolucao','manut_on','manut_off') NOT NULL,
  req_id        CHAR(36) NULL,   -- mesmo req_id para itens do mesmo pedido
  categoria     VARCHAR(32) NULL,
  nome          VARCHAR(150) NULL,
  turma         VARCHAR(50) NULL,
  disciplina    VARCHAR(120) NULL,
  atividade     VARCHAR(200) NULL,
  cargo_setor   VARCHAR(120) NULL,
  email         VARCHAR(180) NULL,
  obs           TEXT NULL,
  payload       JSON NULL,
  retirada_at   DATETIME NULL,   -- preenchido no 'emprestimo'
  devolvido_at  DATETIME NULL,   -- preenchido no 'devolucao'
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mov_recurso_codigo (recurso, codigo),
  KEY idx_mov_tipo (tipo),
  KEY idx_mov_req (req_id),
  KEY idx_mov_retirada (retirada_at),
  KEY idx_mov_devolvido (devolvido_at)
) ENGINE=InnoDB;

-- =============== Cabeçalho do Empréstimo Ativo =============
-- Um registro por operação (req_id); fecha ao devolver tudo.
CREATE TABLE emprestimos_ativos (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  req_id        CHAR(36) NOT NULL,
  recurso       ENUM('notebooks','celulares','cameras') NOT NULL, -- tipo principal do pedido
  categoria     VARCHAR(32) NULL,
  nome          VARCHAR(150) NULL,
  turma         VARCHAR(50) NULL,
  disciplina    VARCHAR(120) NULL,
  atividade     VARCHAR(200) NULL,
  cargo_setor   VARCHAR(120) NULL,
  email         VARCHAR(180) NULL,
  obs           TEXT NULL,
  retirada_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- <== IMPORTANTE
  payload       JSON NULL,                                   -- <== IMPORTANTE
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_emp_ativos_req (req_id),
  KEY idx_emp_ativos_recurso (recurso),
  KEY idx_emp_ativos_nome (nome),
  KEY idx_emp_ativos_retirada (retirada_at)
) ENGINE=InnoDB;

-- =============== Itens do Empréstimo (ativos) ===============
CREATE TABLE emprestimo_itens (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  emprestimo_id   BIGINT NOT NULL,
  recurso         ENUM('notebooks','celulares','cameras') NOT NULL,
  codigo          INT NOT NULL,
  patrimonio      VARCHAR(64) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_empitem_emp
    FOREIGN KEY (emprestimo_id) REFERENCES emprestimos_ativos(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uq_empitem_unique (emprestimo_id, recurso, codigo),
  KEY idx_empitem_recurso_codigo (recurso, codigo)
) ENGINE=InnoDB;

-- =============== View retrocompatível =======================
-- Fornece o mesmo formato que a view antiga esperava,
-- agora baseada nos "ativos" reais.
CREATE VIEW vw_emprestimos_ativos AS
SELECT
  ea.req_id,
  ei.recurso,
  ei.codigo,
  CASE
    WHEN ei.recurso='notebooks' THEN (SELECT n.patrimonio FROM notebook n WHERE n.codigo=ei.codigo LIMIT 1)
    WHEN ei.recurso='celulares' THEN (SELECT c.patrimonio FROM celular  c WHERE c.codigo=ei.codigo LIMIT 1)
    WHEN ei.recurso='cameras'   THEN (SELECT ca.patrimonio FROM camera  ca WHERE ca.codigo=ei.codigo LIMIT 1)
  END AS patrimonio,
  ea.retirada_at,
  ea.nome,
  ea.categoria,
  ea.turma,
  ea.disciplina,
  ea.atividade,
  ea.cargo_setor,
  ea.email,
  ea.obs
FROM emprestimos_ativos ea
JOIN emprestimo_itens ei ON ei.emprestimo_id = ea.id;

-- Reativa checagem de FKs
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
