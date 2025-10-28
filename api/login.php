<?php
session_start(); // Inicia a sessão para guardar que o usuário está logado
include '../db_connect.php';

$data = json_decode(file_get_contents("php://input"));

$email = $data->email;
$senha_digitada = $data->senha;

if (empty($email) || empty($senha_digitada)) {
    echo json_encode(["success" => false, "message" => "Email e senha são obrigatórios."]);
    exit();
}

// --- Busca o usuário pelo email ---
$stmt = $conexao->prepare("SELECT id, senha FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 1) {
    $usuario = $resultado->fetch_assoc();

    // --- Verifica se a senha criptografada bate com a senha digitada ---
    if (password_verify($senha_digitada, $usuario['senha'])) {
        // Senha correta!
        $_SESSION['usuario_id'] = $usuario['id']; // Guarda o ID do usuário na sessão
        echo json_encode(["success" => true]);
    } else {
        // Senha incorreta
        echo json_encode(["success" => false, "message" => "Email ou senha inválidos."]);
    }
} else {
    // Usuário não encontrado
    echo json_encode(["success" => false, "message" => "Email ou senha inválidos."]);
}

$stmt->close();
$conexao->close();
?>