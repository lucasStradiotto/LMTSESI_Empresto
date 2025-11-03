-- 01_create_database.sql
-- Criação do schema + tabelas base

CREATE DATABASE IF NOT EXISTS lab_emprestimos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE lab_emprestimos;

-- =============== TABELAS DE ITENS ===============

DROP TABLE IF EXISTS notebook;
CREATE TABLE notebook (
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
) ENGINE=InnoDB;

DROP TABLE IF EXISTS celular;
CREATE TABLE celular (
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
) ENGINE=InnoDB;

DROP TABLE IF EXISTS camera;
CREATE TABLE camera (
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
) ENGINE=InnoDB;

-- =============== TABELA DE MOVIMENTOS (LOG) ===============
-- Mantém histórico completo de empréstimos/devoluções/manutenção

DROP TABLE IF EXISTS movimentos;
CREATE TABLE movimentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recurso ENUM('notebooks','celulares','cameras') NOT NULL,
  codigo INT NOT NULL,
  tipo ENUM('emprestimo','devolucao','manut_on','manut_off') NOT NULL,
  req_id CHAR(36) NULL,
  categoria VARCHAR(32) NULL,
  nome VARCHAR(255) NULL,
  turma VARCHAR(64) NULL,
  disciplina VARCHAR(128) NULL,
  atividade VARCHAR(255) NULL,
  cargo_setor VARCHAR(128) NULL,
  email VARCHAR(255) NULL,
  obs TEXT NULL,
  payload JSON NULL,
  retirada_at DATETIME NULL,    -- quando o empréstimo foi efetuado
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mov_recurso_codigo (recurso, codigo),
  KEY idx_mov_tipo (tipo),
  KEY idx_mov_req (req_id),
  KEY idx_mov_retirada (retirada_at)
) ENGINE=InnoDB;

-- =============== TABELAS DE ATIVOS (ESTADO CORRENTE) ===============
-- Cabeçalho de um empréstimo ativo (um req_id) + itens associados

DROP TABLE IF EXISTS emprestimos_ativos;
CREATE TABLE emprestimos_ativos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  req_id CHAR(36) NOT NULL,
  categoria VARCHAR(32) NULL,
  nome VARCHAR(255) NULL,
  turma VARCHAR(64) NULL,
  disciplina VARCHAR(128) NULL,
  atividade VARCHAR(255) NULL,
  cargo_setor VARCHAR(128) NULL,
  email VARCHAR(255) NULL,
  obs TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_req_id (req_id),
  KEY idx_empativos_created (created_at)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS emprestimo_itens;
CREATE TABLE emprestimo_itens (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  emprestimo_id BIGINT NOT NULL,
  recurso ENUM('notebooks','celulares','cameras') NOT NULL,
  codigo INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_empitem (emprestimo_id, recurso, codigo),
  KEY idx_empitem_recurso_codigo (recurso, codigo),
  CONSTRAINT fk_empitem_header
    FOREIGN KEY (emprestimo_id) REFERENCES emprestimos_ativos(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
