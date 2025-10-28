<?php
session_start();
include '../db_connect.php';

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["success" => false, "message" => "Acesso negado."]);
    exit();
}

$usuario_id = $_SESSION['usuario_id'];
$data = json_decode(file_get_contents("php://input"));
$personagem_id = $data->personagem_id;
$campanha_id = $data->campanha_id;

// Atualiza a tabela personagens, setando o campanha_id
// A cláusula "WHERE usuario_id" garante que um jogador só pode associar seu próprio personagem.
$stmt = $conexao->prepare("UPDATE personagens SET campanha_id = ? WHERE id = ? AND usuario_id = ?");
$stmt->bind_param("iii", $campanha_id, $personagem_id, $usuario_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Erro ao associar personagem."]);
}

$stmt->close();
$conexao->close();
?>