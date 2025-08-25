-- Crie o banco (ajuste o nome se quiser)
CREATE DATABASE IF NOT EXISTS lab_emprestimos
  CHARACTER SET utf8mb4;
USE lab_emprestimos;

-- Status controlado por ENUM; manutencao = 0/1
-- Coluna "codigo" casa 1:1 com o número que aparece na sua UI.
-- "patrimonio" é opcional (pode ser NULL) mas é unique se usado.

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

-- (Opcional, mas altamente recomendado) histórico de operações
CREATE TABLE movimentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recurso ENUM('notebooks','celulares','cameras') NOT NULL,
  codigo INT NOT NULL,
  tipo ENUM('emprestimo','devolucao','manut_on','manut_off') NOT NULL,
  payload JSON NULL,                  -- dados de formulário (nome, turma, etc.)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mov_recurso_codigo (recurso, codigo),
  KEY idx_mov_tipo (tipo)
) ENGINE=InnoDB;
