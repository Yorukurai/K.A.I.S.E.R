document.addEventListener('DOMContentLoaded', async () => {
    
    let ultimoIdRolagemConhecido = 0; // Para o polling
    let idCampanhaAtual = 0;
    const logContainer = document.getElementById('log-container');

    // 1. Carrega os dados da campanha (Seu código original)
    try {
        const response = await fetch('api/carregar_campanha_mestre.php');
        const result = await response.json();

        if (result.success) {
            idCampanhaAtual = result.campanha.id; // Guarda o ID da campanha
            document.getElementById('campaign-name').textContent = result.campanha.nome;
            document.getElementById('invite-code').textContent = result.campanha.codigo_convite;

            const grid = document.getElementById('grid-fichas');
            grid.innerHTML = ''; 

            if (result.personagens.length === 0) {
                 grid.innerHTML = '<p>Nenhum personagem entrou na campanha ainda.</p>';
            }

            result.personagens.forEach(p => {
                const dados = JSON.parse(p.dados_ficha || '{}');
                const fichaDiv = document.createElement('div');
                fichaDiv.className = 'mini-ficha';

                const pv_percent = (parseInt(dados.pv_atual || 0) / parseInt(dados.pv_max || 1)) * 100;
                const san_percent = (parseInt(dados.san_atual || 0) / parseInt(dados.san_max || 1)) * 100;
                const pe_percent = (parseInt(dados.pe_atual || 0) / parseInt(dados.pe_max || 1)) * 100;

                fichaDiv.innerHTML = `
                    <h3>${dados.nome || 'Sem Nome'}</h3>
                    <small>PV: ${dados.pv_atual || 0}/${dados.pv_max || 0}</small>
                    <div class="status-bar"><div class="pv-bar" style="width: ${pv_percent}%;">${Math.round(pv_percent)}%</div></div>
                    <small>SAN: ${dados.san_atual || 0}/${dados.san_max || 0}</small>
                    <div class="status-bar"><div class="san-bar" style="width: ${san_percent}%;">${Math.round(san_percent)}%</div></div>
                    <small>PE: ${dados.pe_atual || 0}/${dados.pe_max || 0}</small>
                    <div class="status-bar"><div class="pe-bar" style="width: ${pe_percent}%;">${Math.round(pe_percent)}%</div></div>
                `;
                grid.appendChild(fichaDiv);
            });
            
            // 2. (NOVO) Inicia o polling de rolagens
            logContainer.innerHTML = ''; // Limpa a mensagem "Aguardando..."
            iniciarPolling(idCampanhaAtual);

        } else {
            alert(result.message);
            document.getElementById('campaign-name').textContent = "Erro ao carregar campanha";
        }
    } catch (error) {
        console.error("Erro ao carregar campanha:", error);
        document.getElementById('campaign-name').textContent = "Erro de conexão";
    }

    /**
     * (NOVO) Inicia o Long-Polling para buscar rolagens.
     */
    async function iniciarPolling(campanhaId) {
        try {
            const response = await fetch(`api/get_rolagens.php?campanha_id=${campanhaId}&ultimo_id=${ultimoIdRolagemConhecido}`);
            
            if (!response.ok) {
                 throw new Error(`Erro de rede: ${response.statusText}`);
            }
            
            const result = await response.json();

            if (result.success && result.rolagens.length > 0) {
                // Processa as novas rolagens
                result.rolagens.forEach(log => {
                    // Atualiza o último ID conhecido
                    ultimoIdRolagemConhecido = Math.max(ultimoIdRolagemConhecido, log.id);
                    // Renderiza a rolagem no log
                    renderizarRolagemNoLog(log);
                });
            }
        } catch (error) {
            console.error("Erro no polling:", error);
            // Aguarda um pouco antes de tentar novamente em caso de erro
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Chama a si mesmo para a próxima requisição (recursão)
        iniciarPolling(campanhaId);
    }
    
    /**
     * (NOVO) Renderiza a rolagem na barra lateral do mestre.
     */
    function renderizarRolagemNoLog(log) {
        const entry = document.createElement('div');
        entry.className = 'log-entry-mestre'; // (Defina essa classe no seu estilo_mestre.css)
        
        entry.innerHTML = `
            <strong>${log.personagem_nome}</strong> (${log.titulo}):
            <div class="mestre-log-details">
                <span class="formula">${log.formula}</span>
                <span class="resultado">
                    [${log.resultados.join(', ')}] = <strong>${log.total}</strong>
                </span>
            </div>
        `;
        
        // Adiciona no topo e rola para baixo
        logContainer.prepend(entry);
    }
});