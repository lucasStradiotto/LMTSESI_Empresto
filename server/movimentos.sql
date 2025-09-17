-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 17/09/2025 às 15:11
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
(50, 'notebooks', 31, 'manut_off', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-04 14:26:35', NULL, NULL, '2025-09-04 17:26:35'),
(51, 'notebooks', 1, 'emprestimo', 'e293b05a-90b0-42b9-9b24-19c06780b171', 'colaborador', 'Lucas Stradiotto dos Santos', '9B', '', 'Robótica', 'OED', 'lucas.stradiotto@sesisp.org.br', '', '2025-09-12 14:00:42', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto dos Santos\",\"turma\":\"9B\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"OED\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"\"}', '2025-09-12 17:00:42'),
(52, 'notebooks', 1, 'devolucao', 'e293b05a-90b0-42b9-9b24-19c06780b171', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 14:01:02', '2025-09-12 14:01:02', NULL, '2025-09-12 17:01:02'),
(53, 'notebooks', 1, 'emprestimo', 'c1992d3d-cf26-4d8b-ab45-dcb1a45f097e', 'colaborador', 'Lucas Stradiotto dos Santos', '9B', '', 'Robótica', 'OED', 'lucas.stradiotto@sesisp.org.br', '', '2025-09-12 14:02:53', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto dos Santos\",\"turma\":\"9B\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"OED\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"\"}', '2025-09-12 17:02:53'),
(54, 'notebooks', 1, 'devolucao', 'c1992d3d-cf26-4d8b-ab45-dcb1a45f097e', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 14:59:01', '2025-09-12 14:59:01', NULL, '2025-09-12 17:59:01'),
(55, 'celulares', 3, 'emprestimo', '565f6dd9-517a-4a76-a68f-27ce59e2a281', 'colaborador', 'Lucas Stradiotto dos Santos', '9B', '', 'Robótica', 'OED', 'lucas.stradiotto@sesisp.org.br', '', '2025-09-12 14:59:39', NULL, '{\"categoria\":\"colaborador\",\"nome\":\"Lucas Stradiotto dos Santos\",\"turma\":\"9B\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"OED\",\"email\":\"lucas.stradiotto@sesisp.org.br\",\"obs\":\"\"}', '2025-09-12 17:59:39'),
(56, 'celulares', 3, 'devolucao', '565f6dd9-517a-4a76-a68f-27ce59e2a281', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 15:00:42', '2025-09-12 15:00:42', NULL, '2025-09-12 18:00:42'),
(57, 'celulares', 3, 'emprestimo', '51ef9e33-825b-4c32-b35b-25851162691f', 'aluno', 'Samuel', '9B', '', 'Pesquisa', '', '', '', '2025-09-12 15:17:57', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Samuel\",\"turma\":\"9B\",\"disciplina\":\"\",\"atividade\":\"Pesquisa\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-09-12 18:17:57'),
(58, 'celulares', 3, 'devolucao', '51ef9e33-825b-4c32-b35b-25851162691f', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 15:18:49', '2025-09-12 15:18:49', NULL, '2025-09-12 18:18:49'),
(59, 'celulares', 3, 'emprestimo', '237cf775-136e-47ed-8610-70cb074cdb97', 'aluno', 'Samuel', '9B', '', 'Pesquisa', '', '', '', '2025-09-12 15:57:12', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Samuel\",\"turma\":\"9B\",\"disciplina\":\"\",\"atividade\":\"Pesquisa\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-09-12 18:57:12'),
(60, 'celulares', 3, 'devolucao', '237cf775-136e-47ed-8610-70cb074cdb97', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 16:05:12', '2025-09-12 16:05:12', NULL, '2025-09-12 19:05:12'),
(61, 'celulares', 3, 'emprestimo', 'd9317bd9-16b1-4ba3-9aee-341f79041538', 'aluno', 'Samuel', '9B', '', 'Pesquisa', '', '', '', '2025-09-12 16:14:03', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Samuel\",\"turma\":\"9B\",\"disciplina\":\"\",\"atividade\":\"Pesquisa\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-09-12 19:14:03'),
(62, 'notebooks', 1, 'emprestimo', 'b87dc08f-bf7a-40c2-8289-bcfb11e8bc85', 'aluno', 'Davi', '7A', '', 'Pesquisa', '', '', '', '2025-09-12 16:15:30', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Davi\",\"turma\":\"7A\",\"disciplina\":\"\",\"atividade\":\"Pesquisa\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-09-12 19:15:30'),
(63, 'notebooks', 2, 'emprestimo', 'd03c1c62-9877-4c99-adb7-83007e625e8c', 'aluno', 'Hadassa', '7A', '', 'Pesquisa', '', '', '', '2025-09-12 16:27:06', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Hadassa\",\"turma\":\"7A\",\"disciplina\":\"\",\"atividade\":\"Pesquisa\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-09-12 19:27:06'),
(64, 'celulares', 5, 'emprestimo', '82f9f2de-4d7d-411f-8f33-28b171fa591a', 'aluno', 'Heloisa', '9B', '', 'Robótica', '', '', '', '2025-09-17 09:26:36', NULL, '{\"categoria\":\"aluno\",\"nome\":\"Heloisa\",\"turma\":\"9B\",\"disciplina\":\"\",\"atividade\":\"Robótica\",\"cargoSetor\":\"\",\"email\":\"\",\"obs\":\"\"}', '2025-09-17 12:26:36'),
(65, 'celulares', 3, 'devolucao', 'd9317bd9-16b1-4ba3-9aee-341f79041538', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-17 09:28:00', '2025-09-17 09:28:00', NULL, '2025-09-17 12:28:00');

--
-- Índices para tabelas despejadas
--

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
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `movimentos`
--
ALTER TABLE `movimentos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
