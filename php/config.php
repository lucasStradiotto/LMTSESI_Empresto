<?php
// Ajuste as credenciais abaixo para o seu MySQL.
$DB_HOST = 'localhost';
$DB_NAME = 'lab_emprestimos';
$DB_USER = 'root';
$DB_PORT = 3306;
$DB_PASS = '';

// Inclua a porta no DSN se necessário:
$dsn = "mysql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME;charset=utf8mb4";
$options = [
  PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES   => false,
];
$pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);

// Centralize a função aqui e evite redeclarações
if (!function_exists('tableName')) {
  function tableName(string $recurso): string {
    $map = ['notebooks'=>'notebook','celulares'=>'celular','cameras'=>'camera'];
    if (!isset($map[$recurso])) throw new InvalidArgumentException('Recurso inválido');
    return $map[$recurso];
  }
}

// URL pública base do sistema (use seu IP/host)
if (!defined('PUBLIC_BASE_URL')) {
  define('PUBLIC_BASE_URL', 'http://10.117.198.147/LMTSESI_EMPRESTO/');
}
