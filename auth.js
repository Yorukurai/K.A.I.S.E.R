function toggleForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const messageDiv = document.getElementById('message');

    // Alterna a visibilidade dos formulários
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
    messageDiv.innerHTML = ''; // Limpa mensagens de erro/sucesso
}

// Função para lidar com o registro
async function handleRegister(event) {
    event.preventDefault(); // Impede o recarregamento da página

    const nome = document.getElementById('register-nome').value;
    const email = document.getElementById('register-email').value;
    const senha = document.getElementById('register-senha').value;
    const messageDiv = document.getElementById('message');

    const response = await fetch('api/register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
    });

    const result = await response.json();

    if (result.success) {
        messageDiv.className = 'success';
        messageDiv.textContent = result.message;
        setTimeout(toggleForms, 1500); // Volta para tela de login após sucesso
    } else {
        messageDiv.className = 'error';
        messageDiv.textContent = result.message;
    }
}

// Função para lidar com o login
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const messageDiv = document.getElementById('message');

    const response = await fetch('api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    });

    const result = await response.json();

    if (result.success) {
        // Se o login for bem-sucedido, redireciona para a página principal (que criaremos depois)
        window.location.href = 'hub.html';
    } else {
        messageDiv.className = 'error';
        messageDiv.textContent = result.message;
    }
}