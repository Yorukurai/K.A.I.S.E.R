<?php
session_start();
include '../db_connect.php';

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["success" => false, "message" => "Acesso negado."]);
    exit();
}
$usuario_id = $_SESSION['usuario_id'];
$data = json_decode(file_get_contents("php://input"));

// Pega o ID do personagem e os dados da ficha
$personagem_id = $data->personagem_id; 
$dados_ficha = json_encode($data->dados_ficha); // Salva o objeto inteiro como JSON

if (empty($personagem_id)) {
    // Se não tem ID, é um personagem NOVO
    $stmt = $conexao->prepare("INSERT INTO personagens (usuario_id, dados_ficha) VALUES (?, ?)");
    $stmt->bind_param("is", $usuario_id, $dados_ficha);
} else {
    // Se tem ID, está ATUALIZANDO um personagem existente
    $stmt = $conexao->prepare("UPDATE personagens SET dados_ficha = ? WHERE id = ? AND usuario_id = ?");
    $stmt->bind_param("sii", $dados_ficha, $personagem_id, $usuario_id);
}

if ($stmt->execute()) {
    $new_id = empty($personagem_id) ? $conexao->insert_id : $personagem_id;
    echo json_encode(["success" => true, "message" => "Ficha salva!", "personagem_id" => $new_id]);
} else {
    echo json_encode(["success" => false, "message" => "Erro ao salvar ficha."]);
}
$stmt->close();
$conexao->close();
?>