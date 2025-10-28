<?php
session_start();
include '../db_connect.php';

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["success" => false, "message" => "Acesso negado."]);
    exit();
}
$mestre_id = $_SESSION['usuario_id'];

// Encontra a campanha MAIS RECENTE do mestre. (Poderia ser melhorado com um seletor de campanhas)
$stmt = $conexao->prepare("SELECT id, nome, codigo_convite FROM campanhas WHERE mestre_id = ? ORDER BY id DESC LIMIT 1");
$stmt->bind_param("i", $mestre_id);
$stmt->execute();
$resultado_campanha = $stmt->get_result();

if ($resultado_campanha->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Nenhuma campanha encontrada. Crie uma primeiro."]);
    exit();
}
$campanha = $resultado_campanha->fetch_assoc();
$campanha_id = $campanha['id'];

// Busca todos os personagens associados a essa campanha
$stmt = $conexao->prepare("SELECT id, dados_ficha FROM personagens WHERE campanha_id = ?");
$stmt->bind_param("i", $campanha_id);
$stmt->execute();
$resultado_personagens = $stmt->get_result();

$personagens = [];
while ($row = $resultado_personagens->fetch_assoc()) {
    $personagens[] = $row;
}

echo json_encode([
    "success" => true,
    "campanha" => $campanha,
    "personagens" => $personagens
]);

$stmt->close();
$conexao->close();
?>