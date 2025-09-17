<?php
// Ajuste as credenciais abaixo para o seu MySQL.
$DB_HOST = '127.0.0.1';
$DB_NAME = 'lab_emprestimos';
$DB_USER = 'root';
$DB_PASS = '';

$dsn = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";
$options = [
  PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES   => false,
];
$pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);

function tableName(string $recurso): string {
  $map = ['notebooks'=>'notebook','celulares'=>'celular','cameras'=>'camera'];
  if (!isset($map[$recurso])) throw new InvalidArgumentException('Recurso inválido');
  return $map[$recurso];
}
header('Content-Type: application/json; charset=utf-8');
// Ex.: IP da máquina no LAN + pasta do projeto
define('PUBLIC_BASE_URL', 'http://10.117.198.199/LMTSESI_EMPRESTO/');
// define('PUBLIC_BASE_URL', 'http://10.117.198.147/LMTSESI_EMPRESTO/');

