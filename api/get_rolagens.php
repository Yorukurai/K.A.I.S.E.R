<?php
session_start();
include '../db_connect.php'; // Ajuste o caminho se necessário

header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(["success" => false, "message" => "Acesso negado."]);
    exit();
}

$campanha_id = isset($_GET['campanha_id']) ? (int)$_GET['campanha_id'] : 0;
$ultimo_id = isset($_GET['ultimo_id']) ? (int)$_GET['ultimo_id'] : 0;

if ($campanha_id === 0) {
    echo json_encode(["success" => false, "message" => "ID da campanha inválido."]);
    exit();
}

// Define um limite de tempo mais longo para o long-polling
set_time_limit(40);

// Loop para verificar novas rolagens
while (true) {
    $stmt = $conexao->prepare("SELECT * FROM rolagens WHERE campanha_id = ? AND id > ? ORDER BY id ASC");
    $stmt->bind_param("ii", $campanha_id, $ultimo_id);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows > 0) {
        $rolagens = [];
        while ($row = $resultado->fetch_assoc()) {
            // Decodifica os resultados de volta para um array
            $row['resultados'] = json_decode($row['resultados']); 
            $rolagens[] = $row;
        }
        echo json_encode(["success" => true, "rolagens" => $rolagens]);
        break; // Envia os dados e encerra o script
    } else {
        // Se não houver novos dados, aguarda 1 segundo e tenta novamente
        sleep(1);
        
        // Se o cliente desconectar, encerra o script
        if(connection_aborted()) {
            break;
        }
    }
}

$stmt->close();
$conexao->close();
?>