<?php
session_start(); // Essencial para saber qual usuário está logado
include '../db_connect.php';

// 1. Verifica se o usuário está logado. Se não, bloqueia a ação.
if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["success" => false, "message" => "Acesso negado. Faça o login primeiro."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
$nome_campanha = $data->nome;
$mestre_id = $_SESSION['usuario_id'];

if (empty($nome_campanha)) {
    echo json_encode(["success" => false, "message" => "O nome da campanha é obrigatório."]);
    exit();
}

// 2. Gera um código de convite aleatório e único
// A função strtoupper deixa o código em maiúsculas
$codigo_convite = strtoupper(substr(str_shuffle(str_repeat("0123456789abcdefghijklmnopqrstuvwxyz", 6)), 0, 6));

// 3. Insere a nova campanha no banco de dados
$stmt = $conexao->prepare("INSERT INTO campanhas (nome, codigo_convite, mestre_id) VALUES (?, ?, ?)");
$stmt->bind_param("ssi", $nome_campanha, $codigo_convite, $mestre_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Erro ao criar campanha."]);
}

$stmt->close();
$conexao->close();
?>