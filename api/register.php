<?php
// Inclui o arquivo de conexão com o banco
include '../db_connect.php';

// Pega os dados enviados pelo JavaScript
$data = json_decode(file_get_contents("php://input"));

// Atribui os dados a variáveis
$nome = $data->nome;
$email = $data->email;
$senha = $data->senha;

// --- Validação básica ---
if (empty($nome) || empty($email) || empty($senha)) {
    echo json_encode(["success" => false, "message" => "Todos os campos são obrigatórios."]);
    exit();
}

// --- Verificação de email duplicado ---
$stmt = $conexao->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Este email já está em uso."]);
    $stmt->close();
    $conexao->close();
    exit();
}
$stmt->close();

// --- Criptografia da senha (MUITO IMPORTANTE!) ---
$senha_hash = password_hash($senha, PASSWORD_DEFAULT);

// --- Insere o novo usuário no banco de dados ---
$stmt = $conexao->prepare("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $nome, $email, $senha_hash);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Usuário registrado com sucesso!"]);
} else {
    echo json_encode(["success" => false, "message" => "Erro ao registrar usuário."]);
}

$stmt->close();
$conexao->close();
?>