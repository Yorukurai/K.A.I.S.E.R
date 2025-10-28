<?php
session_start();
include '../db_connect.php'; // Ajuste o caminho se necessário

header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["success" => false, "message" => "Acesso negado."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

// Validação básica
if (
    !isset($data->campanha_id) || !isset($data->personagem_id) ||
    !isset($data->personagem_nome) || !isset($data->titulo) ||
    !isset($data->formula) || !isset($data->resultados) || !isset($data->total)
) {
    echo json_encode(["success" => false, "message" => "Dados da rolagem incompletos."]);
    exit();
}

$resultados_json = json_encode($data->resultados);

$stmt = $conexao->prepare("INSERT INTO rolagens 
    (campanha_id, personagem_id, personagem_nome, titulo, formula, resultados, total) 
    VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("iissssi", 
    $data->campanha_id, 
    $data->personagem_id, 
    $data->personagem_nome,
    $data->titulo, 
    $data->formula, 
    $resultados_json, 
    $data->total
);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Erro ao salvar rolagem."]);
}

$stmt->close();
$conexao->close();
?>