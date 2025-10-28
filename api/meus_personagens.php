<?php
session_start();
include '../db_connect.php';

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["success" => false, "personagens" => []]);
    exit();
}
$usuario_id = $_SESSION['usuario_id'];

$stmt = $conexao->prepare("SELECT id, dados_ficha FROM personagens WHERE usuario_id = ?");
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$resultado = $stmt->get_result();

$personagens = [];
while ($row = $resultado->fetch_assoc()) {
    $personagens[] = $row;
}

echo json_encode(["success" => true, "personagens" => $personagens]);

$stmt->close();
$conexao->close();
?>