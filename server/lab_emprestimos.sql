-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 04/09/2025 às 19:27
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `lab_emprestimos`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `camera`
--

CREATE TABLE `camera` (
  `id` int(11) NOT NULL,
  `codigo` int(11) NOT NULL,
  `patrimonio` varchar(64) DEFAULT NULL,
  `status` enum('disponivel','ocupado') NOT NULL DEFAULT 'disponivel',
  `manutencao` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `camera`
--

INSERT INTO `camera` (`id`, `codigo`, `patrimonio`, `status`, `manutencao`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 19:37:47'),
(2, 2, NULL, 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-25 19:25:57');

-- --------------------------------------------------------

--
-- Estrutura para tabela `celular`
--

CREATE TABLE `celular` (
  `id` int(11) NOT NULL,
  `codigo` int(11) NOT NULL,
  `patrimonio` varchar(64) DEFAULT NULL,
  `status` enum('disponivel','ocupado') NOT NULL DEFAULT 'disponivel',
  `manutencao` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `celular`
--

INSERT INTO `celular` (`id`, `codigo`, `patrimonio`, `status`, `manutencao`, `created_at`, `updated_at`) VALUES
(1, 1, '1514751', 'disponivel', 1, '2025-08-25 19:25:57', '2025-08-27 15:07:27'),
(2, 2, '1514752', 'disponivel', 1, '2025-08-25 19:25:57', '2025-08-27 15:07:29'),
(3, 3, '1514753', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:16'),
(4, 4, '1514754', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:16'),
(5, 5, '1514755', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:17'),
(6, 6, '1514756', 'disponivel', 0, '2025-08-25 19:25:57', '2025-09-04 15:39:17'),
(7, 7, '1514757', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:17'),
(8, 8, '1514758', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:17'),
(9, 9, '1514759', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:17'),
(10, 10, '1514760', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:17'),
(11, 11, '1514761', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:17'),
(12, 12, '1514762', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:17'),
(13, 13, '1514763', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:17'),
(14, 14, '1514764', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:17'),
(15, 15, '1514765', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:17'),
(16, 16, '1514766', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:12:17');

-- --------------------------------------------------------

--
-- Estrutura para tabela `movimentos`
--

CREATE TABLE `movimentos` (
  `id` bigint(20) NOT NULL,
  `recurso` enum('notebooks','celulares','cameras') NOT NULL,
  `codigo` int(11) NOT NULL,
  `tipo` enum('emprestimo','devolucao','manut_on','manut_off') NOT NULL,
  `req_id` char(36) NOT NULL,
  `categoria` enum('aluno','professor','colaborador') DEFAULT NULL,
  `nome` varchar(120) DEFAULT NULL,
  `turma` varchar(60) DEFAULT NULL,
  `disciplina` varchar(60) DEFAULT NULL,
  `atividade` varchar(120) DEFAULT NULL,
  `cargo_setor` varchar(120) DEFAULT NULL,
  `email` varchar(160) DEFAULT NULL,
  `obs` varchar(255) DEFAULT NULL,
  `retirada_at` datetime DEFAULT current_timestamp(),
  `devolucao_at` datetime DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `movimentos`
--

INSERT INTO `movimentos` (`id`, `recurso`, `codigo`, `tipo`, `req_id`, `categoria`, `nome`, `turma`, `disciplina`, `atividade`, `cargo_setor`, `email`, `obs`, `retirada_at`, `devolucao_at`, `payload`, `created_at`) VALUES
(1, 'notebooks', 16, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:24:01', NULL, NULL, '2025-08-26 18:24:01'),
(2, 'notebooks', 18, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:24:05', NULL, NULL, '2025-08-26 18:24:05'),
(3, 'notebooks', 28, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:24:10', NULL, NULL, '2025-08-26 18:24:10'),
(4, 'notebooks', 31, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:24:15', NULL, NULL, '2025-08-26 18:24:15'),
(5, 'notebooks', 32, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:24:17', NULL, NULL, '2025-08-26 18:24:17'),
(6, 'notebooks', 33, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:24:18', NULL, NULL, '2025-08-26 18:24:18'),
(7, 'notebooks', 34, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:24:20', NULL, NULL, '2025-08-26 18:24:20'),
(8, 'notebooks', 35, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:24:21', NULL, NULL, '2025-08-26 18:24:21'),
(9, 'notebooks', 1, 'emprestimo', '744640ae-441a-42ff-ac50-7cde044b6d99', 'colaborador', 'Lucas Stradiotto', '6º A', '', 'Robótica', 'OED', 'lucas.stradiotto@sesisp.org.br', 'Bateria Completa', '2025-08-26 15:34:01', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto\",\"turma\":\"6º A\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"OED\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"Bateria Completa\"}', '2025-08-26 18:34:01'),
(10, 'notebooks', 2, 'emprestimo', '744640ae-441a-42ff-ac50-7cde044b6d99', 'colaborador', 'Lucas Stradiotto', '6º A', '', 'Robótica', 'OED', 'lucas.stradiotto@sesisp.org.br', 'Bateria Completa', '2025-08-26 15:34:01', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto\",\"turma\":\"6º A\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"OED\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"Bateria Completa\"}', '2025-08-26 18:34:01'),
(11, 'notebooks', 3, 'emprestimo', '744640ae-441a-42ff-ac50-7cde044b6d99', 'colaborador', 'Lucas Stradiotto', '6º A', '', 'Robótica', 'OED', 'lucas.stradiotto@sesisp.org.br', 'Bateria Completa', '2025-08-26 15:34:01', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto\",\"turma\":\"6º A\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"OED\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"Bateria Completa\"}', '2025-08-26 18:34:01'),
(12, 'notebooks', 4, 'emprestimo', '744640ae-441a-42ff-ac50-7cde044b6d99', 'colaborador', 'Lucas Stradiotto', '6º A', '', 'Robótica', 'OED', 'lucas.stradiotto@sesisp.org.br', 'Bateria Completa', '2025-08-26 15:34:01', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto\",\"turma\":\"6º A\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"OED\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"Bateria Completa\"}', '2025-08-26 18:34:01'),
(13, 'notebooks', 5, 'emprestimo', '744640ae-441a-42ff-ac50-7cde044b6d99', 'colaborador', 'Lucas Stradiotto', '6º A', '', 'Robótica', 'OED', 'lucas.stradiotto@sesisp.org.br', 'Bateria Completa', '2025-08-26 15:34:01', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto\",\"turma\":\"6º A\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"OED\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"Bateria Completa\"}', '2025-08-26 18:34:01'),
(14, 'notebooks', 1, 'devolucao', '744640ae-441a-42ff-ac50-7cde044b6d99', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:57:46', '2025-08-26 15:57:46', NULL, '2025-08-26 18:57:46'),
(15, 'notebooks', 2, 'devolucao', '744640ae-441a-42ff-ac50-7cde044b6d99', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:57:46', '2025-08-26 15:57:46', NULL, '2025-08-26 18:57:46'),
(16, 'notebooks', 3, 'devolucao', '744640ae-441a-42ff-ac50-7cde044b6d99', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:57:46', '2025-08-26 15:57:46', NULL, '2025-08-26 18:57:46'),
(17, 'notebooks', 4, 'devolucao', '744640ae-441a-42ff-ac50-7cde044b6d99', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:57:46', '2025-08-26 15:57:46', NULL, '2025-08-26 18:57:46'),
(18, 'notebooks', 5, 'devolucao', '744640ae-441a-42ff-ac50-7cde044b6d99', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 15:57:46', '2025-08-26 15:57:46', NULL, '2025-08-26 18:57:46'),
(19, 'notebooks', 1, 'emprestimo', '5069a6b6-8a83-4674-b9cc-c42b4747372e', 'aluno', 'Samuel Reis', '9º B', '', 'Robótica', '', '', '', '2025-08-26 16:35:27', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Samuel Reis\",\"turma\":\"9º B\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-08-26 19:35:27'),
(20, 'cameras', 1, 'emprestimo', 'ec91f544-7af7-474a-944d-5deac895969d', 'aluno', 'Heloisa', '9º B', '', 'Pesquisa', '', '', '', '2025-08-26 16:36:34', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Heloisa\",\"turma\":\"9º B\",\"disciplina\":\"\",\"atividade\":\"Pesquisa\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-08-26 19:36:34'),
(21, 'notebooks', 1, 'devolucao', '5069a6b6-8a83-4674-b9cc-c42b4747372e', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 16:37:03', '2025-08-26 16:37:03', NULL, '2025-08-26 19:37:03'),
(22, 'cameras', 1, 'devolucao', 'ec91f544-7af7-474a-944d-5deac895969d', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 16:37:47', '2025-08-26 16:37:47', NULL, '2025-08-26 19:37:47'),
(23, 'notebooks', 1, 'emprestimo', '0834994d-f1fc-4b67-984a-af6694153dc1', 'colaborador', 'Lucas Stradiotto', '9º B', '', 'Robótica', 'OED', 'lucas.stradiotto@sesisp.org.br', '', '2025-08-26 16:39:49', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto\",\"turma\":\"9º B\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"OED\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"\"}', '2025-08-26 19:39:49'),
(24, 'notebooks', 2, 'emprestimo', '0b45afce-17ad-4dbe-9b32-37ab6a3d4b98', 'aluno', 'Samuel', '9º B', '', 'Robótica', '', '', '', '2025-08-26 16:45:52', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Samuel\",\"turma\":\"9º B\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-08-26 19:45:52'),
(25, 'notebooks', 1, 'devolucao', '0834994d-f1fc-4b67-984a-af6694153dc1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 16:59:50', '2025-08-26 16:59:50', NULL, '2025-08-26 19:59:50'),
(26, 'notebooks', 2, 'devolucao', '0b45afce-17ad-4dbe-9b32-37ab6a3d4b98', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-26 17:01:57', '2025-08-26 17:01:57', NULL, '2025-08-26 20:01:57'),
(27, 'notebooks', 1, 'emprestimo', 'ff6f2898-7b8f-4219-bdc1-fdb88053da15', 'colaborador', 'Lucas Stradiotto', '9º B', '', 'Robótica', 'OED', 'lucas.stradiotto@sesisp.org.br', '', '2025-08-26 17:10:43', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto\",\"turma\":\"9º B\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"OED\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"\"}', '2025-08-26 20:10:43'),
(28, 'notebooks', 1, 'devolucao', 'ff6f2898-7b8f-4219-bdc1-fdb88053da15', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-27 10:41:38', '2025-08-27 10:41:38', NULL, '2025-08-27 13:41:38'),
(29, 'notebooks', 1, 'emprestimo', '0275ec37-18f2-4bc2-a4f2-fbd262c5a531', 'aluno', 'Samuel', '9ºB', '', 'Robótica', '', '', '', '2025-08-27 12:07:13', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Samuel\",\"turma\":\"9ºB\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-08-27 15:07:13'),
(30, 'celulares', 1, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-27 12:07:27', NULL, NULL, '2025-08-27 15:07:27'),
(31, 'celulares', 2, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-27 12:07:29', NULL, NULL, '2025-08-27 15:07:29'),
(32, 'celulares', 6, 'emprestimo', '7473765c-443c-46d0-a99f-85f6e5e3ea31', 'aluno', 'Adrielly', '6º A', '', 'Selibi', '', '', '', '2025-08-27 13:20:10', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Adrielly\",\"turma\":\"6º A\",\"disciplina\":\"\",\"atividade\":\"Selibi\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-08-27 16:20:10'),
(33, 'notebooks', 2, 'emprestimo', '862a383c-66bf-4137-ae02-893fe49251ee', 'aluno', 'Enzo Samuel', '7ºA', '', 'Robótica', '', '', '', '2025-08-27 15:35:30', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Enzo Samuel\",\"turma\":\"7ºA\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-08-27 18:35:30'),
(34, 'notebooks', 3, 'emprestimo', '23a09a4b-0ece-47c9-aba3-a12106964d5d', 'colaborador', 'Lucas Stradiotto', '6º A', '', 'Robótica', 'OED', 'lucas.stradiotto@sesisp.org.br', '', '2025-08-28 09:53:46', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto\",\"turma\":\"6º A\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"OED\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"\"}', '2025-08-28 12:53:46'),
(35, 'notebooks', 3, 'devolucao', '23a09a4b-0ece-47c9-aba3-a12106964d5d', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-28 09:55:17', '2025-08-28 09:55:17', NULL, '2025-08-28 12:55:17'),
(36, 'notebooks', 3, 'emprestimo', 'f1188127-cfc8-4f80-b41d-2e6f816bc28b', 'colaborador', 'Lucas Stradiotto dos Santos', 'Turma 9B', '', 'Robótica', 'Oed', 'lucas.stradiotto@sesisp.org.br', '', '2025-09-04 08:16:59', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto dos Santos\",\"turma\":\"Turma 9B\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"Oed\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"\"}', '2025-09-04 11:16:59'),
(37, 'notebooks', 3, 'devolucao', 'f1188127-cfc8-4f80-b41d-2e6f816bc28b', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 08:20:26', '2025-09-04 08:20:26', NULL, '2025-09-04 11:20:26'),
(38, 'notebooks', 1, 'devolucao', '0275ec37-18f2-4bc2-a4f2-fbd262c5a531', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 12:39:07', '2025-09-04 12:39:07', NULL, '2025-09-04 15:39:07'),
(39, 'notebooks', 2, 'devolucao', '862a383c-66bf-4137-ae02-893fe49251ee', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 12:39:12', '2025-09-04 12:39:12', NULL, '2025-09-04 15:39:12'),
(40, 'celulares', 6, 'devolucao', '7473765c-443c-46d0-a99f-85f6e5e3ea31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 12:39:17', '2025-09-04 12:39:17', NULL, '2025-09-04 15:39:17'),
(41, 'notebooks', 1, 'emprestimo', '078dd8e9-1f3b-46ac-af97-aa0aeef3aa8f', 'aluno', 'Samuel', '9B', '', 'pesquisa', '', '', '', '2025-09-04 14:22:13', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Samuel\",\"turma\":\"9B\",\"disciplina\":\"\",\"atividade\":\"pesquisa\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-09-04 17:22:13'),
(42, 'notebooks', 1, 'devolucao', '078dd8e9-1f3b-46ac-af97-aa0aeef3aa8f', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 14:24:44', '2025-09-04 14:24:44', NULL, '2025-09-04 17:24:44'),
(43, 'notebooks', 3, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 14:24:55', NULL, NULL, '2025-09-04 17:24:55'),
(44, 'notebooks', 13, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 14:25:57', NULL, NULL, '2025-09-04 17:25:57'),
(45, 'notebooks', 16, 'manut_off', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 14:25:59', NULL, NULL, '2025-09-04 17:25:59'),
(46, 'notebooks', 22, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 14:26:01', NULL, NULL, '2025-09-04 17:26:01'),
(47, 'notebooks', 28, 'manut_off', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 14:26:06', NULL, NULL, '2025-09-04 17:26:06'),
(48, 'notebooks', 27, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 14:26:31', NULL, NULL, '2025-09-04 17:26:31'),
(49, 'notebooks', 28, 'manut_on', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 14:26:32', NULL, NULL, '2025-09-04 17:26:32'),
(50, 'notebooks', 31, 'manut_off', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 14:26:35', NULL, NULL, '2025-09-04 17:26:35');

-- --------------------------------------------------------

--
-- Estrutura para tabela `notebook`
--

CREATE TABLE `notebook` (
  `id` int(11) NOT NULL,
  `codigo` int(11) NOT NULL,
  `patrimonio` varchar(64) DEFAULT NULL,
  `status` enum('disponivel','ocupado') NOT NULL DEFAULT 'disponivel',
  `manutencao` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `notebook`
--

INSERT INTO `notebook` (`id`, `codigo`, `patrimonio`, `status`, `manutencao`, `created_at`, `updated_at`) VALUES
(1, 1, '1503350', 'disponivel', 0, '2025-08-25 19:25:57', '2025-09-04 17:24:44'),
(2, 2, '1503352', 'disponivel', 0, '2025-08-25 19:25:57', '2025-09-04 15:39:12'),
(3, 3, '1503353', 'disponivel', 1, '2025-08-25 19:25:57', '2025-09-04 17:24:55'),
(4, 4, '1503354', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:57:46'),
(5, 5, '1503355', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:57:46'),
(6, 6, '1503356', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(7, 7, '1503357', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(8, 8, '1503358', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(9, 9, '1503359', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(10, 10, '1503360', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(11, 11, '1503361', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(12, 12, '1503362', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(13, 13, '1503363', 'disponivel', 1, '2025-08-25 19:25:57', '2025-09-04 17:25:57'),
(14, 14, '1503364', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(15, 15, '1503365', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(16, 16, '1503366', 'disponivel', 0, '2025-08-25 19:25:57', '2025-09-04 17:25:59'),
(17, 17, '1503367', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(18, 18, '1503368', 'disponivel', 1, '2025-08-25 19:25:57', '2025-08-26 18:24:05'),
(19, 19, '1503369', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(20, 20, '1503370', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:26'),
(21, 21, '1503371', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:27'),
(22, 22, '1503372', 'disponivel', 1, '2025-08-25 19:25:57', '2025-09-04 17:26:01'),
(23, 23, '1503373', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:27'),
(24, 24, '1503374', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:27'),
(25, 25, '1503375', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:27'),
(26, 26, '1503376', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:27'),
(27, 27, '1503377', 'disponivel', 1, '2025-08-25 19:25:57', '2025-09-04 17:26:31'),
(28, 28, '1503378', 'disponivel', 1, '2025-08-25 19:25:57', '2025-09-04 17:26:32'),
(29, 29, '1503379', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:27'),
(30, 30, '1503380', 'disponivel', 0, '2025-08-25 19:25:57', '2025-08-26 18:04:27'),
(31, 31, '1503351', 'disponivel', 0, '2025-08-25 19:25:57', '2025-09-04 17:26:35'),
(32, 32, '1503381', 'disponivel', 1, '2025-08-25 19:25:57', '2025-08-26 18:24:17'),
(33, 33, NULL, 'disponivel', 1, '2025-08-25 19:25:57', '2025-08-26 18:24:18'),
(34, 34, NULL, 'disponivel', 1, '2025-08-25 19:25:57', '2025-08-26 18:24:20'),
(35, 35, NULL, 'disponivel', 1, '2025-08-25 19:25:57', '2025-08-26 18:24:21');

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `vw_emprestimos_ativos`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `vw_emprestimos_ativos` (
`recurso` enum('notebooks','celulares','cameras')
,`codigo` int(11)
,`req_id` char(36)
,`categoria` enum('aluno','professor','colaborador')
,`nome` varchar(120)
,`turma` varchar(60)
,`disciplina` varchar(60)
,`atividade` varchar(120)
,`cargo_setor` varchar(120)
,`email` varchar(160)
,`obs` varchar(255)
,`retirada_at` datetime
);

-- --------------------------------------------------------

--
-- Estrutura para view `vw_emprestimos_ativos`
--
DROP TABLE IF EXISTS `vw_emprestimos_ativos`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_emprestimos_ativos`  AS SELECT `m`.`recurso` AS `recurso`, `m`.`codigo` AS `codigo`, `m`.`req_id` AS `req_id`, `m`.`categoria` AS `categoria`, `m`.`nome` AS `nome`, `m`.`turma` AS `turma`, `m`.`disciplina` AS `disciplina`, `m`.`atividade` AS `atividade`, `m`.`cargo_setor` AS `cargo_setor`, `m`.`email` AS `email`, `m`.`obs` AS `obs`, `m`.`retirada_at` AS `retirada_at` FROM ((`movimentos` `m` join (select `movimentos`.`recurso` AS `recurso`,`movimentos`.`codigo` AS `codigo`,max(`movimentos`.`created_at`) AS `last_loan` from `movimentos` where `movimentos`.`tipo` = 'emprestimo' group by `movimentos`.`recurso`,`movimentos`.`codigo`) `ult` on(`ult`.`recurso` = `m`.`recurso` and `ult`.`codigo` = `m`.`codigo` and `m`.`tipo` = 'emprestimo' and `m`.`created_at` = `ult`.`last_loan`)) left join (select `movimentos`.`recurso` AS `recurso`,`movimentos`.`codigo` AS `codigo`,max(`movimentos`.`created_at`) AS `last_return` from `movimentos` where `movimentos`.`tipo` = 'devolucao' group by `movimentos`.`recurso`,`movimentos`.`codigo`) `dev` on(`dev`.`recurso` = `m`.`recurso` and `dev`.`codigo` = `m`.`codigo`)) WHERE `dev`.`last_return` is null OR `m`.`created_at` > `dev`.`last_return` ;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `camera`
--
ALTER TABLE `camera`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_camera_codigo` (`codigo`),
  ADD UNIQUE KEY `patrimonio` (`patrimonio`),
  ADD KEY `idx_camera_status` (`status`),
  ADD KEY `idx_camera_manut` (`manutencao`);

--
-- Índices de tabela `celular`
--
ALTER TABLE `celular`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_celular_codigo` (`codigo`),
  ADD UNIQUE KEY `patrimonio` (`patrimonio`),
  ADD KEY `idx_celular_status` (`status`),
  ADD KEY `idx_celular_manut` (`manutencao`);

--
-- Índices de tabela `movimentos`
--
ALTER TABLE `movimentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_mov_recurso_codigo` (`recurso`,`codigo`),
  ADD KEY `idx_mov_tipo` (`tipo`),
  ADD KEY `idx_mov_req` (`req_id`),
  ADD KEY `idx_mov_recurso_codigo_tipo` (`recurso`,`codigo`,`tipo`),
  ADD KEY `idx_mov_created` (`created_at`);

--
-- Índices de tabela `notebook`
--
ALTER TABLE `notebook`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_notebook_codigo` (`codigo`),
  ADD UNIQUE KEY `patrimonio` (`patrimonio`),
  ADD KEY `idx_notebook_status` (`status`),
  ADD KEY `idx_notebook_manut` (`manutencao`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `camera`
--
ALTER TABLE `camera`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `celular`
--
ALTER TABLE `celular`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de tabela `movimentos`
--
ALTER TABLE `movimentos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT de tabela `notebook`
--
ALTER TABLE `notebook`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
