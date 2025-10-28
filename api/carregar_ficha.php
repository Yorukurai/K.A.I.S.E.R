<?php
session_start();
include '../db_connect.php'; // Ajuste o caminho se necessário

header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["success" => false, "message" => "Acesso negado."]);
    exit();
}

$usuario_id = $_SESSION['usuario_id'];
$personagem_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($personagem_id === 0) {
    echo json_encode(["success" => false, "message" => "ID de personagem inválido."]);
    exit();
}

// Verifica se o personagem pertence ao usuário logado
// (Em um VTT real, o mestre também poderia carregar, mas vamos manter simples por enquanto)
$stmt = $conexao->prepare("SELECT id, dados_ficha, campanha_id FROM personagens WHERE id = ? AND usuario_id = ?");
$stmt->bind_param("ii", $personagem_id, $usuario_id);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 1) {
    $personagem = $resultado->fetch_assoc();
    
    // Retorna os dados da ficha (já como objeto) e o ID da campanha
    echo json_encode([
        "success" => true,
        "id" => $personagem['id'],
        "dados_ficha" => json_decode($personagem['dados_ficha']), // Decodifica o JSON
        "campanha_id" => $personagem['campanha_id']
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Personagem não encontrado ou não pertence a você."]);
}

$stmt->close();
$conexao->close();
?>