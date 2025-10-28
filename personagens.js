document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const campanhaIdParaEntrar = urlParams.get('campanha_id');
    const joinPrompt = document.getElementById('join-prompt');

    if (campanhaIdParaEntrar) {
        joinPrompt.textContent = `Escolha um personagem para entrar na campanha.`;
        joinPrompt.style.display = 'block';
    }

    carregarPersonagens(campanhaIdParaEntrar);
});

async function carregarPersonagens(campanhaIdParaEntrar) {
    const response = await fetch('api/meus_personagens.php');
    const result = await response.json();
    const grid = document.getElementById('grid-personagens');

    if (result.success) {
        result.personagens.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card-personagem';
            // Decodifica os dados da ficha para pegar nome, classe e nex
            const dadosFicha = JSON.parse(p.dados_ficha || '{}');
            card.innerHTML = `
                <h2>${dadosFicha.nome || 'Personagem sem Nome'}</h2>
                <p>${dadosFicha.classe || 'Sem Classe'} | NEX ${dadosFicha.nex || '0%'}</p>
            `;

            card.onclick = () => {
                if (campanhaIdParaEntrar) {
                    associarPersonagem(p.id, campanhaIdParaEntrar);
                } else {
                    // Se não estiver entrando em campanha, apenas abre para editar
                    window.location.href = `ficha_personagem.html?personagem_id=${p.id}`;
                }
            };
            grid.insertBefore(card, grid.lastElementChild);
        });
    }
}

async function associarPersonagem(personagemId, campanhaId) {
    const response = await fetch('api/associar_personagem_campanha.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personagem_id: personagemId, campanha_id: campanhaId })
    });
    const result = await response.json();
    if (result.success) {
        // Após associar, vai para a ficha
        window.location.href = `ficha_personagem.html?personagem_id=${personagemId}`;
    } else {
        alert(result.message);
    }
}

function criarNovoPersonagem() {
    // Redireciona para a ficha em modo de criação (sem ID)
    window.location.href = 'ficha_personagem.html';
}