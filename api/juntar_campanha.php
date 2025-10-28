<?php
session_start();
include '../db_connect.php';

// 1. Verifica se o usuário está logado
if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["success" => false, "message" => "Acesso negado. Faça o login primeiro."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
$codigo_convite = $data->codigo;

if (empty($codigo_convite)) {
    echo json_encode(["success" => false, "message" => "O código da campanha é obrigatório."]);
    exit();
}

// 2. Procura no banco de dados por uma campanha com o código fornecido
$stmt = $conexao->prepare("SELECT id FROM campanhas WHERE codigo_convite = ?");
$stmt->bind_param("s", $codigo_convite);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 1) {
    $campanha = $resultado->fetch_assoc();
    // 3. Se encontrou, retorna sucesso e o ID da campanha
    echo json_encode(["success" => true, "campanha_id" => $campanha['id']]);
} else {
    // 4. Se não encontrou, retorna erro
    echo json_encode(["success" => false, "message" => "Código da campanha inválido."]);
}

$stmt->close();
$conexao->close();
?>