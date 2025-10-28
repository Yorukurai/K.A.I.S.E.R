document.addEventListener('DOMContentLoaded', () => {
    const logContainer = document.getElementById('log-container');
    const limparBtn = document.getElementById('limpar-log');

    const renderizarLogs = () => {
        logContainer.innerHTML = '';
        try {
            const logs = JSON.parse(localStorage.getItem('rolagensLog') || '[]');
            logs.forEach(log => {
                const entry = document.createElement('div');
                entry.classList.add('log-entry');
                entry.innerHTML = `
                    <div class="log-title">${log.titulo}</div>
                    <div class="log-details">
                        <span class="log-formula">${log.formula}</span>
                        <span class="log-results">
                            <span class="log-rolls">[${log.resultados.join(', ')}]</span> = 
                            <span class="log-total">${log.total}</span>
                        </span>
                    </div>
                `;
                logContainer.appendChild(entry);
            });
        } catch (e) {
            logContainer.innerHTML = 'Erro ao carregar os logs.';
            console.error(e);
        }
    };

    limparBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja apagar todo o histórico de rolagens?')) {
            localStorage.removeItem('rolagensLog');
            renderizarLogs();
        }
    });
    
    // Ouve por atualizações da janela principal
    window.addEventListener('storage', () => {
        renderizarLogs();
    });

    // Renderiza os logs ao abrir a janela
    renderizarLogs();
});