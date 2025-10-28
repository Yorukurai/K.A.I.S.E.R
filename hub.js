async function criarCampanha(event) {
    event.preventDefault();
    const nomeCampanha = document.getElementById('nome-campanha').value;
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';

    const response = await fetch('api/criar_campanha.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeCampanha })
    });

    const result = await response.json();

    if (result.success) {
        // Se a campanha foi criada, redireciona o mestre para a página de gerenciamento
        window.location.href = 'mestre.html'; 
    } else {
        messageDiv.textContent = result.message;
    }
}

// Dentro de hub.js
async function juntarCampanha(event) {
    event.preventDefault();
    const codigoCampanha = document.getElementById('codigo-campanha').value;
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';

    const response = await fetch('api/juntar_campanha.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoCampanha })
    });

    const result = await response.json();

    if (result.success) {
        // MUDANÇA AQUI: Redireciona para o painel de personagens, passando o ID da campanha
        window.location.href = `personagens.html?campanha_id=${result.campanha_id}`;
    } else {
        messageDiv.textContent = result.message;
    }
}