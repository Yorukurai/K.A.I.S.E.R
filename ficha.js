document.addEventListener('DOMContentLoaded', () => {

    // ====================================\
    // 0. VARIÁVEIS GLOBAIS E IDs (NOVO)
    // ====================================
    let globalPersonagemId = null;
    let globalCampanhaId = null;
    let globalPersonagemNome = "Personagem";
    let ultimoIdRolagemConhecido = 0; // Para o polling

    // Pega o ID da URL
    const urlParams = new URLSearchParams(window.location.search);
    const personagemIdFromURL = urlParams.get('personagem_id');

    
    // ====================================\
    // 1. DADOS E CORES DE AFINIDADE/ELEMENTOS (Seu código)
    // ====================================
    const afinidades = [
        { nome: 'Energia', simbolo: 'https://static.wikia.nocookie.net/ordemparanormal/images/e/e1/Energia.png/revision/latest?cb=20221031212916&path-prefix=pt-br', tema: 'theme-violet' },
        { nome: 'Conhecimento', simbolo: 'https://static.wikia.nocookie.net/ordemparanormal/images/2/20/Conhecimento.png/revision/latest?cb=20211227034840&path-prefix=pt-br', tema: 'theme-yellow' },
        { nome: 'Sangue', simbolo: 'https://static.wikia.nocookie.net/ordemparanormal/images/c/cc/Sangue.png/revision/latest?cb=20221031204745&path-prefix=pt-br', tema: 'theme-red' },
        { nome: 'Morte', simbolo: 'https://static.wikia.nocookie.net/ordemparanormal/images/a/ad/Morte.png/revision/latest?cb=20221031215135&path-prefix=pt-br', tema: 'theme-white' },
        { nome: 'Medo', simbolo: 'https://static.wikia.nocookie.net/ordemparanormal/images/a/af/Medo.png/revision/latest?cb=20220324232436&path-prefix=pt-br', tema: 'theme-light-blue' }
    ];
    let indiceAfinidadeAtual = 0;

    const elementoUrls = {
        'Energia': afinidades.find(a => a.nome === 'Energia').simbolo,
        'Conhecimento': afinidades.find(a => a.nome === 'Conhecimento').simbolo,
        'Sangue': afinidades.find(a => a.nome === 'Sangue').simbolo,
        'Morte': afinidades.find(a => a.nome === 'Morte').simbolo,
        'Medo': afinidades.find(a => a.nome === 'Medo').simbolo,
    };

    // Estruturas de dados (MODIFICADO)
    // Inicializa vazio; será preenchido pelo carregarFicha()
    let rituais = { 1: [], 2: [], 3: [], 4: [] };
    let inventario = [];

    let ritualEmEdicao = null;
    let itemEmEdicaoIndex = -1;

    // Popular dropdown de NEX (Seu código)
    const nexSelect = document.getElementById('personagem-nex');
    if (nexSelect) {
        for (let i = 5; i <= 95; i += 5) {
            nexSelect.options.add(new Option(`${i}%`, `${i}%`));
        }
        nexSelect.options.add(new Option('99%', '99%'));
        nexSelect.value = '5%'; // Define o valor padrão
    }
    
    // ====================================\
    // 2. LÓGICA DE ATRIBUTOS E PERÍCIAS (Seu código)
    // ====================================
    const atributos = ['for', 'agi', 'vig', 'int', 'pre'];

    // (Seu código original, sem modificações)
    const calcularStatusVitais = () => {
        try {
            const classe = document.getElementById('personagem-classe').value.toLowerCase();
            const nexStr = document.getElementById('personagem-nex').value;
            const vigor = parseInt(document.querySelector(`.secao-atributo[data-atributo="vig"] .input-atributo-editavel`).value) || 0;
            const presenca = parseInt(document.querySelector(`.secao-atributo[data-atributo="pre"] .input-atributo-editavel`).value) || 0;

            const nex = parseInt(nexStr) || 0;
            const niveisSuperiores = Math.max(0, Math.floor(nex / 5) - 1);

            let maxPV = 0, maxSAN = 0, maxPE = 0;

            switch(classe) {
                case 'combatente':
                    maxPV = 20 + vigor; maxSAN = 12; maxPE = 2 + presenca;
                    if (niveisSuperiores > 0) {
                        maxPV += niveisSuperiores * (6 + vigor);
                        maxSAN += niveisSuperiores * 4;
                        maxPE += niveisSuperiores * (2 + presenca);
                    }
                    break;
                case 'especialista':
                    maxPV = 16 + vigor; maxSAN = 16; maxPE = 3 + presenca;
                    if (niveisSuperiores > 0) {
                        maxPV += niveisSuperiores * (5 + vigor);
                        maxSAN += niveisSuperiores * 5;
                        maxPE += niveisSuperiores * (3 + presenca);
                    }
                    break;
                case 'ocultista':
                    maxPV = 12 + vigor; maxSAN = 20; maxPE = 4 + presenca;
                    if (niveisSuperiores > 0) {
                        maxPV += niveisSuperiores * (4 + vigor);
                        maxSAN += niveisSuperiores * 6;
                        maxPE += niveisSuperiores * (4 + presenca);
                    }
                    break;
                case 'nenhum':
                default:
                    maxPV = 10; maxSAN = 10; maxPE = 1;
                    break;
            }

            document.getElementById('vida-max').value = maxPV;
            document.getElementById('sanidade-max').value = maxSAN;
            document.getElementById('pe-max').value = maxPE;

            // NÃO define mais os valores ATUAIS, para preservar os dados carregados
            // (A menos que seja uma ficha nova, o que preencherFicha vai tratar)

            atualizarBarraDeProgresso('vida');
            atualizarBarraDeProgresso('sanidade');
            atualizarBarraDeProgresso('pe');

        } catch (e) { console.error("Erro ao calcular status vitais:", e); }
    };

    // (Seu código original, sem modificações)
    const aplicarCalculoTotalPericia = (periciaItem) => {
        const inputRanks = periciaItem.querySelector('.input-pericia-valor');
        const inputTotal = periciaItem.querySelector('.input-pericia-total');
        const inputMod = periciaItem.querySelector('.input-atributo-mod');
        const attr = periciaItem.getAttribute('data-atributo');

        if (!inputRanks || !inputTotal || !inputMod || !attr) return;
        
        const inputAtributoValor = document.querySelector(`.secao-atributo[data-atributo="${attr}"] .input-atributo-editavel`);
        const valorAtributo = parseInt(inputAtributoValor.value) || 0;
        
        const attrMod = valorAtributo; 
        inputMod.value = (attrMod >= 0 ? '+' : '') + attrMod;
        
        const ranks = parseInt(inputRanks.value) || 0;
        const total = ranks + attrMod;
        inputTotal.value = (total >= 0 ? '+' : '') + total;
    };

    // (Seu código original, sem modificações)
    const atualizarAtributoEPericias = (attr) => {
        const inputAtributoValor = document.querySelector(`.secao-atributo[data-atributo="${attr}"] .input-atributo-editavel`);
        if (!inputAtributoValor) return;

        const valor = parseInt(inputAtributoValor.value) || 0;

        if (attr === 'for') {
            document.getElementById('inventario-capacidade').value = valor * 2; 
        }
        if (attr === 'agi') {
            const iniciativaInput = document.getElementById('iniciativa-valor');
            iniciativaInput.value = (valor >= 0 ? '+' : '') + valor;
        }
        if (attr === 'vig' || attr === 'pre') {
            calcularStatusVitais(); // Recalcula máximos
        }

        document.querySelectorAll(`.pericia-item[data-atributo="${attr}"]`).forEach(periciaItem => {
            aplicarCalculoTotalPericia(periciaItem); 
        });
    };

    // (Seu código original, sem modificações)
    atributos.forEach(attr => {
        const secaoAtributo = document.querySelector(`.secao-atributo[data-atributo="${attr}"]`);
        const inputAtributoValor = secaoAtributo.querySelector('.input-atributo-editavel');
        
        if (inputAtributoValor) {
            inputAtributoValor.addEventListener('input', () => {
                let val = parseInt(inputAtributoValor.value);
                if (isNaN(val)) val = 0;
                inputAtributoValor.value = val; 
                atualizarAtributoEPericias(attr);
            });
            inputAtributoValor.addEventListener('click', (e) => e.stopPropagation());
        }
    });

    // (Seu código original, sem modificações)
    document.getElementById('personagem-classe').addEventListener('input', calcularStatusVitais);
    document.getElementById('personagem-nex').addEventListener('input', calcularStatusVitais);

    // (Seu código original, sem modificações)
    document.querySelectorAll('.input-pericia-valor').forEach(inputRanks => {
        inputRanks.addEventListener('input', () => {
            const periciaItem = inputRanks.closest('.pericia-item');
            if (periciaItem) aplicarCalculoTotalPericia(periciaItem);
        });
    });

    // ====================================\
    // 3. LÓGICA DAS BARRAS DE STATUS (Seu código)
    // ====================================
    // (Seu código original, sem modificações)
    const atualizarBarraDeProgresso = (idBase) => {
        const inputAtual = document.getElementById(`${idBase}-atual`);
        const inputMax = document.getElementById(`${idBase}-max`);
        const barraProgresso = document.getElementById(`${idBase}-progresso`);
        
        if (!inputAtual || !inputMax || !barraProgresso) return;
        
        let atual = parseInt(inputAtual.value) || 0;
        let max = parseInt(inputMax.value) || 1; 
        if (max < 1) max = 1;
        if (atual < 0) atual = 0;
        
        // Não força mais o atual a ser igual ao max, apenas garante que não seja negativo
        inputAtual.value = atual;
        inputMax.value = max;

        let porcentagem = (atual / max) * 100;
        if (porcentagem > 100) porcentagem = 100;
        if (porcentagem < 0) porcentagem = 0;
        
        barraProgresso.style.width = `${porcentagem}%`;
    };

    // (Seu código original, sem modificações)
    ['vida', 'pe', 'sanidade'].forEach(idBase => {
        const inputAtual = document.getElementById(`${idBase}-atual`);
        const inputMax = document.getElementById(`${idBase}-max`);
        if(inputAtual && inputMax) {
            const atualizar = () => atualizarBarraDeProgresso(idBase);
            inputAtual.addEventListener('input', atualizar);
            inputMax.addEventListener('input', atualizar);
        }
    });

    // ====================================\
    // 4. LÓGICA DE AFINIDADE E TEMA (Seu código)
    // ====================================
    // (Seu código original, sem modificações)
    const simboloAfinidadeIcone = document.getElementById('simbolo-afinidade-icone');
    const afinidadeLabel = document.querySelector('.afinidade-label');
    const body = document.body;
    
    window.trocarSimboloEtema = () => {
        indiceAfinidadeAtual = (indiceAfinidadeAtual + 1) % afinidades.length;
        const afinidade = afinidades[indiceAfinidadeAtual];
        
        body.className = afinidade.tema; 
        
        if (simboloAfinidadeIcone) simboloAfinidadeIcone.src = afinidade.simbolo;
        if (afinidadeLabel) afinidadeLabel.textContent = afinidade.nome.toUpperCase();
        
        atualizarBarraDeProgresso('pe');
    };
    
    const temaInicial = body.className.split(' ').find(cls => cls.startsWith('theme-'));
    const indexInicial = afinidades.findIndex(a => a.tema === temaInicial);
    if(indexInicial !== -1) {
        indiceAfinidadeAtual = (indexInicial - 1 + afinidades.length) % afinidades.length;
    } else {
        indiceAfinidadeAtual = -1;
    }
    trocarSimboloEtema();

    // ====================================\
    // 5. LÓGICA DE UPLOAD DE IMAGEM (Seu código)
    // ====================================
    // (Seu código original, sem modificações)
    document.getElementById('file-upload').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => { document.getElementById('personagem-foto').src = e.target.result; };
            reader.readAsDataURL(file);
        }
    });

    // ====================================\
    // 6. LÓGICA DAS ABAS (Seu código)
    // ====================================
    // (Seu código original, sem modificações)
    let logWindow = null;
    window.openTab = (evt, tabName) => {
        if (tabName === 'tab-pane-log') {
            if (logWindow && !logWindow.closed) {
                logWindow.focus();
            } else {
                logWindow = window.open('log.html', 'Log de Rolagens', 'width=500,height=700,scrollbars=yes');
            }
            return;
        }
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
        const paneToShow = document.getElementById(tabName);
        if(paneToShow) paneToShow.classList.add('active');
        if(evt.currentTarget) evt.currentTarget.classList.add('active');
        if (tabName === 'tab-pane-inventario') renderizarInventario();
    };

    window.openRitualTab = (evt, ritualTabName) => {
        document.querySelectorAll('.ritual-tab-pane').forEach(pane => pane.classList.remove('active'));
        document.querySelectorAll('.ritual-tab-button').forEach(button => button.classList.remove('active'));
        document.getElementById(ritualTabName).classList.add('active');
        evt.currentTarget.classList.add('active');
    };

    // ====================================\
    // 7. LÓGICA DE ATAQUES (Seu código)
    // ====================================
    // (Seu código original, sem modificações)
    window.adicionarLinhaAtaque = () => { 
        const tabelaBody = document.querySelector('#tabela-ataque tbody');
        const novaLinha = tabelaBody.insertRow();
        novaLinha.innerHTML = `
            <td><input type="text" class="input-tabela" placeholder="Arma"></td>
            <td><input type="text" class="input-tabela" placeholder="+Bônus"></td>
            <td><input type="text" class="input-tabela" placeholder="Crítico"></td>
            <td><input type="text" class="input-tabela" placeholder="Dano"></td>
            <td class="celula-rolagem">
                <button class="botao-rolar-dado" data-tipo="ataque" title="Rolar Ataque"><span class="icone-rolar-dado"></span></button>
                <button class="botao-rolar-dado" data-tipo="dano" title="Rolar Dano"><span class="icone-rolar-dado"></span></button>
            </td>
            <td><button onclick="removerLinhaAtaque(this)" class="botao-remover-linha">X</button></td>
        `;
        adicionarListenersDeRolagemAtaque(novaLinha);
    };

    const adicionarListenersDeRolagemAtaque = (linha) => {
        linha.querySelectorAll('.botao-rolar-dado').forEach(botao => {
            botao.addEventListener('click', (e) => {
                e.stopPropagation();
                const tipo = botao.dataset.tipo;
                const celulas = linha.cells;
                const nomeArma = celulas[0].querySelector('input').value || "Ataque";
                if (tipo === 'ataque') {
                    const bonus = celulas[1].querySelector('input').value || "+0";
                    rolarDados(`Ataque: ${nomeArma}`, `1d20${bonus}`);
                } else if (tipo === 'dano') {
                    const dano = celulas[3].querySelector('input').value;
                    rolarDados(`Dano: ${nomeArma}`, dano);
                }
            });
        });
    };

    window.removerLinhaAtaque = (botao) => {
        botao.closest('tr').remove();
    };
    
    // ====================================\
    // 8. LÓGICA DE RITUAIS (Seu código)
    // ====================================
    // (Seu código original, sem modificações)
    // As funções agora operam na variável global `rituais`
    const renderizarListaRituais = (circulo) => {
        const lista = document.getElementById(`lista-rituais-${circulo}`);
        if (!lista) return;
        lista.innerHTML = '';
        if (!rituais[circulo]) rituais[circulo] = []; // Garante que exista

        rituais[circulo].forEach((ritual, index) => {
            const simboloUrl = elementoUrls[ritual.elemento] || '';
            const item = document.createElement('li');
            item.classList.add('ritual-item');
            const danosHtml = `...`; // Seu HTML de danos aqui
            item.innerHTML = `
                <div class="ritual-item-header" onclick="abrirModalRitual(${index}, ${circulo})">
                    <div class="ritual-info-principal">
                        <img src="${simboloUrl}" alt="${ritual.elemento}" class="ritual-icone-afinidade">
                        <span class="ritual-nome-display">${ritual.nome} (${ritual.custo})</span>
                    </div>
                    <button onclick="event.stopPropagation(); removerRitual(this, ${circulo});" class="botao-remover-ritual">X</button>
                </div>
                ${(ritual.danoNormal || ritual.danoDiscente || ritual.danoVerdadeiro) ? danosHtml : ''}
            `;
            lista.appendChild(item);
        });
    };

    window.adicionarRitual = (circulo) => {
        const novoIndex = rituais[circulo].length;
        const elementoInicial = afinidades.find(a => a.tema === body.className)?.nome || 'Energia';
        const novoRitual = {
            index: novoIndex, nome: `Novo Ritual`, custo: "1 PE", execucao: "Padrão", alcance: "Curto", duracao: "Cena",
            danoNormal: "", danoDiscente: "", danoVerdadeiro: "", descricao: "", elemento: elementoInicial
        };
        rituais[circulo].push(novoRitual);
        renderizarListaRituais(circulo);
        abrirModalRitual(novoIndex, circulo);
    };

    window.removerRitual = (botao, circulo) => {
        const item = botao.closest('.ritual-item');
        const index = Array.from(item.parentNode.children).indexOf(item);
        if (confirm(`Tem certeza que deseja remover o ritual ${rituais[circulo][index].nome}?`)) {
            rituais[circulo].splice(index, 1);
            rituais[circulo].forEach((r, i) => r.index = i);
            renderizarListaRituais(circulo);
        }
    };
    
    window.abrirModalRitual = (index, circulo) => {
        ritualEmEdicao = { circulo, index };
        const ritual = rituais[circulo][index];
        document.getElementById('modal-ritual-titulo').textContent = `Editar Ritual (${circulo}º Círculo)`;
        document.getElementById('modal-ritual-nome').value = ritual.nome;
        document.getElementById('modal-ritual-custo').value = ritual.custo;
        document.getElementById('modal-ritual-execucao').value = ritual.execucao;
        document.getElementById('modal-ritual-alcance').value = ritual.alcance;
        document.getElementById('modal-ritual-duracao').value = ritual.duracao;
        document.getElementById('modal-ritual-dano-normal').value = ritual.danoNormal || '';
        document.getElementById('modal-ritual-dano-discente').value = ritual.danoDiscente || '';
        document.getElementById('modal-ritual-dano-verdadeiro').value = ritual.danoVerdadeiro || '';
        document.getElementById('modal-ritual-descricao').value = ritual.descricao;
        document.getElementById('modal-ritual-elemento').value = ritual.elemento;
        window.atualizarIconeElemento(ritual.elemento);
        document.getElementById('modal-ritual').style.display = 'block';
    };

    window.fecharModalRitual = () => {
        document.getElementById('modal-ritual').style.display = 'none';
        ritualEmEdicao = null;
    };

    window.atualizarIconeElemento = (elemento) => {
        document.getElementById('modal-ritual-icone').src = elementoUrls[elemento] || '';
    };
    
    window.salvarRitualDetalhes = () => {
        if (!ritualEmEdicao) return;
        const { circulo, index } = ritualEmEdicao;
        rituais[circulo][index] = {
            index: index,
            nome: document.getElementById('modal-ritual-nome').value,
            custo: document.getElementById('modal-ritual-custo').value,
            execucao: document.getElementById('modal-ritual-execucao').value,
            alcance: document.getElementById('modal-ritual-alcance').value,
            duracao: document.getElementById('modal-ritual-duracao').value,
            danoNormal: document.getElementById('modal-ritual-dano-normal').value,
            danoDiscente: document.getElementById('modal-ritual-dano-discente').value,
            danoVerdadeiro: document.getElementById('modal-ritual-dano-verdadeiro').value,
            descricao: document.getElementById('modal-ritual-descricao').value,
            elemento: document.getElementById('modal-ritual-elemento').value
        };
        renderizarListaRituais(circulo);
        fecharModalRitual();
    };
    
    // ====================================\
    // 9. LÓGICA DE INVENTÁRIO (Seu código)
    // ====================================
    // (Seu código original, sem modificações)
    // As funções agora operam na variável global `inventario`
    const renderizarInventario = () => {
        const lista = document.getElementById('lista-inventario');
        if (!lista) return;
        lista.innerHTML = '';
        let totalEspacos = 0;
        inventario.forEach((item, index) => {
            const itemLi = document.createElement('li');
            itemLi.classList.add('item-inventario');
            itemLi.setAttribute('onclick', `abrirModalItem(${index})`);
            itemLi.innerHTML = `
                <span class="item-nome-display">${item.nome}</span>
                <span class="item-espaco-display">Espaço: ${item.espaco}</span>
            `;
            lista.appendChild(itemLi);
            totalEspacos += (parseInt(item.espaco) || 0);
        });
        document.getElementById('inventario-ocupado').value = totalEspacos;
    };
    
    window.adicionarItemInventario = () => {
        const novoItem = { nome: 'Novo Item', melhorias: '', espaco: 1, descricao: '', urlFoto: '' };
        inventario.push(novoItem);
        const newIndex = inventario.length - 1;
        renderizarInventario();
        abrirModalItem(newIndex);
    };

    window.abrirModalItem = (index) => {
        itemEmEdicaoIndex = index;
        const item = inventario[index];
        if (!item) return;
        document.getElementById('modal-item-url').value = item.urlFoto;
        document.getElementById('modal-item-foto').src = item.urlFoto;
        document.getElementById('modal-item-nome').value = item.nome;
        document.getElementById('modal-item-melhorias').value = item.melhorias;
        document.getElementById('modal-item-espaco').value = item.espaco;
        document.getElementById('modal-item-descricao').value = item.descricao;
        document.getElementById('modal-item').style.display = 'block';
    };

    window.salvarItemDetalhes = () => {
        if (itemEmEdicaoIndex === -1) return;
        const item = inventario[itemEmEdicaoIndex];
        item.nome = document.getElementById('modal-item-nome').value;
        item.melhorias = document.getElementById('modal-item-melhorias').value;
        item.espaco = parseInt(document.getElementById('modal-item-espaco').value) || 0;
        item.descricao = document.getElementById('modal-item-descricao').value;
        item.urlFoto = document.getElementById('modal-item-url').value;
        renderizarInventario();
        fecharModalItem();
    };

    window.removerItemInventario = () => {
        if (itemEmEdicaoIndex === -1) return;
        if (confirm(`Tem certeza que deseja remover ${inventario[itemEmEdicaoIndex].nome}?`)) {
            inventario.splice(itemEmEdicaoIndex, 1);
            renderizarInventario();
            fecharModalItem();
        }
    };

    window.fecharModalItem = () => {
        document.getElementById('modal-item').style.display = 'none';
        itemEmEdicaoIndex = -1;
    };

    document.getElementById('modal-item-url').addEventListener('input', (e) => {
        document.getElementById('modal-item-foto').src = e.target.value;
    });

    // ====================================\
    // 9.5. LÓGICA DE SALVAR E CARREGAR (NOVO)
    // ====================================

    /**
     * Carrega os dados da ficha do backend.
     */
    async function carregarFicha(id) {
        if (!id) {
            console.log("Novo personagem, inicializando ficha em branco.");
            inicializarFichaBranca(); // Renderiza rituais/inventário vazios
            adicionarListenersDeAutoSave(); // Habilita o auto-save
            return;
        }

        try {
            const response = await fetch(`api/carregar_ficha.php?id=${id}`);
            const result = await response.json();

            if (result.success) {
                console.log("Ficha carregada:", result);
                globalPersonagemId = result.id;
                globalCampanhaId = result.campanha_id;
                
                // Preenche a ficha com os dados
                preencherFicha(result.dados_ficha);
                
                globalPersonagemNome = result.dados_ficha.nome || "Personagem";

                // Inicia o polling para receber rolagens
                if(globalCampanhaId) {
                    iniciarPolling(globalCampanhaId);
                }
                
                adicionarListenersDeAutoSave();
            } else {
                alert(result.message);
                window.location.href = 'personagens.html';
            }
        } catch (error) {
            console.error("Erro ao carregar a ficha:", error);
            alert("Erro de conexão ao carregar a ficha.");
        }
    }

    /**
     * Preenche todos os campos da ficha com os dados do JSON.
     */
    function preencherFicha(dados) {
        if (!dados) {
            inicializarFichaBranca();
            return;
        }

        // 1. Preenche os dados complexos (rituais, inventário)
        rituais = dados.rituais || { 1: [], 2: [], 3: [], 4: [] };
        inventario = dados.inventario || [];

        // 2. Preenche todos os inputs, textareas e selects com um ID
        for (const key in dados) {
            const elemento = document.getElementById(key);
            if (elemento) {
                if (elemento.type === 'checkbox') {
                    elemento.checked = dados[key];
                } else {
                    elemento.value = dados[key];
                }
            }
        }
        
        // 3. Lógica especial para foto
        if(dados.personagem_foto) {
             document.getElementById('personagem-foto').src = dados.personagem_foto;
        }
        
        // 4. Renderiza e recalcula tudo com os dados carregados
        console.log("Renderizando dados carregados...");
        inicializarFichaBranca(); // Renderiza o estado carregado
    }

    /**
     * Coleta todos os dados da ficha e retorna um objeto JSON.
     */
    function coletarDadosDaFicha() {
        const dados = {};
        
        // 1. Pega todos os inputs, textareas e selects com um ID
        const campos = document.querySelectorAll('input[id], textarea[id], select[id]');
        campos.forEach(el => {
            if (el.id) {
                 if (el.type === 'checkbox') {
                    dados[el.id] = el.checked;
                } else {
                    dados[el.id] = el.value;
                }
            }
        });
        
        // 2. Lógica especial para foto
        dados.personagem_foto = document.getElementById('personagem-foto').src;

        // 3. Salva os dados complexos (rituais, inventário)
        dados.rituais = rituais;
        dados.inventario = inventario;
        
        return dados;
    }

    /**
     * Salva o estado atual da ficha no backend.
     */
    async function salvarFicha() {
        const dadosFicha = coletarDadosDaFicha();
        
        // Atualiza o nome global para o log
        globalPersonagemNome = dadosFicha.nome || "Personagem";

        try {
            const response = await fetch('api/salvar_ficha.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personagem_id: globalPersonagemId, // Pode ser null se for novo
                    dados_ficha: dadosFicha
                })
            });
            const result = await response.json();

            if (result.success) {
                console.log(result.message);
                if (result.new_id && !globalPersonagemId) {
                    globalPersonagemId = result.new_id;
                    // Atualiza a URL sem recarregar
                    window.history.pushState(
                        { id: globalPersonagemId }, 
                        `Ficha ${globalPersonagemId}`, 
                        `ficha_personagem.html?personagem_id=${globalPersonagemId}`
                    );
                }
                mostrarNotificacaoSalvo();
            } else {
                console.error("Erro ao salvar:", result.message);
            }
        } catch (error) {
            console.error("Erro de rede ao salvar:", error);
        }
    }

    /**
     * Adiciona listeners para salvar automaticamente.
     */
    function adicionarListenersDeAutoSave() {
        const debouncedSalvar = debounce(salvarFicha, 1000); // Salva 1s após a última mudança

        const campos = document.querySelectorAll('input, textarea, select');
        campos.forEach(el => {
            el.addEventListener('input', debouncedSalvar);
        });
        
        // Adiciona listeners aos botões que modificam os arrays (rituais/inventário)
        // (Opcional, mas garante salvamento ao adicionar/remover)
        document.querySelectorAll('.botao-remover-linha, .botao-remover-ritual, .botao-remover-item').forEach(btn => {
            btn.addEventListener('click', debouncedSalvar);
        });
        document.querySelectorAll('.botao-adicionar-item, .botao-adicionar-ritual, .botao-adicionar-ataque').forEach(btn => {
            btn.addEventListener('click', debouncedSalvar);
        });
         document.querySelectorAll('.modal .botao-salvar').forEach(btn => {
            btn.addEventListener('click', debouncedSalvar);
        });
    }
    
    // Função utilitária de Debounce
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Função utilitária para notificação
    function mostrarNotificacaoSalvo() {
        let toast = document.getElementById('save-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'save-toast';
            toast.textContent = 'Salvo!';
            // Estilos (pode mover para o CSS)
            toast.style.cssText = "position:fixed; bottom:20px; right:20px; background:#4caf50; color:white; padding:10px 20px; border-radius:5px; z-index:1000; opacity: 0; transition: opacity 0.5s;";
            document.body.appendChild(toast);
        }
        
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });
        
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 1500);
    }
    
    /**
     * Função que renderiza o estado inicial (vazio ou carregado)
     */
    function inicializarFichaBranca() {
        console.log("Inicializando renderização da ficha...");
        // 1. Renderiza Rituais e Inventário (com dados carregados ou vazios)
        for(let i = 1; i <= 4; i++) renderizarListaRituais(i);
        renderizarInventario();
        
        // 2. Calcula Status Vitais (com base em VIG/PRE/NEX/Classe carregados)
        calcularStatusVitais();
        
        // 3. Atualiza todas as perícias (com base nos atributos carregados)
        atributos.forEach(atualizarAtributoEPericias);
        
        // 4. Atualiza as barras de status (com base nos valores atuais/max carregados)
        ['vida', 'pe', 'sanidade'].forEach(atualizarBarraDeProgresso);
    }


    // ====================================\
    // 10. LÓGICA DE ROLAGEM DE DADOS (MODIFICADO)
    // ====================================
    
    // (Seu código original de Toast)
    const toastContainer = document.getElementById('rolagem-toast-container');
    const mostrarPopupRolagem = (titulo, formula, resultados, total) => {
        const corTema = getComputedStyle(document.documentElement).getPropertyValue('--cor-divisoria');
        const toast = document.createElement('div');
        toast.classList.add('rolagem-toast-item');
        toast.style.borderColor = corTema;
        toast.innerHTML = `
            <div class="rolagem-toast-header">
                <div class="rolagem-toast-simbolo" style="background-color: ${corTema};"></div>
                <div class="rolagem-toast-titulo">${titulo}</div>
            </div>
            <div class="rolagem-toast-corpo">
                <span class="rolagem-toast-formula">[${resultados.join(', ')}] ${formula.replace(/(\d*d\d+)/gi, '')}</span>
                <span class="rolagem-toast-total">${total}</span>
            </div>
        `;
        toastContainer.appendChild(toast);
        // ... (resto da sua lógica de animação do toast)
         if (toastContainer.children.length > 3) {
            const toastAntigo = toastContainer.children[0];
            toastAntigo.classList.add('fade-out');
            setTimeout(() => { if (toastAntigo.parentElement === toastContainer) toastContainer.removeChild(toastAntigo); }, 400); 
        }
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('fade-out');
            setTimeout(() => { if (toast.parentElement === toastContainer) toastContainer.removeChild(toast); }, 400); 
        }, 3000); 
    };

    // (Seu código original de Log Local)
    const salvarRolagemNoLog = (logData) => {
        try {
            const logs = JSON.parse(localStorage.getItem('rolagensLog') || '[]');
            logs.unshift(logData); 
            if(logs.length > 100) logs.pop(); 
            localStorage.setItem('rolagensLog', JSON.stringify(logs));
            window.dispatchEvent(new Event('storage'));
        } catch(e) { console.error("Erro ao salvar log:", e); }
    };

    /**
     * (NOVO) Envia a rolagem para o servidor.
     */
    async function enviarRolagemParaBackend(logData) {
        // Só envia se estivermos em uma campanha válida
        if (!globalCampanhaId || !globalPersonagemId) {
            console.log("Rolagem não enviada: Fora de campanha.");
            return;
        }

        try {
            await fetch('api/salvar_rolagem.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campanha_id: globalCampanhaId,
                    personagem_id: globalPersonagemId,
                    personagem_nome: globalPersonagemNome,
                    titulo: logData.titulo,
                    formula: logData.formula,
                    resultados: logData.resultados,
                    total: logData.total
                })
            });
        } catch (error) {
            console.error("Erro ao enviar rolagem para o backend:", error);
        }
    }

    // (Seu código original de Rolagem - MODIFICADO)
    window.rolarDados = (titulo, formula) => {
        if (!formula || typeof formula !== 'string') return;

        let formulaLimpa = formula.replace(/[^d0-9\+\-]/gi, '').toLowerCase();
        const regexDados = /(\d*)d(\d+)/gi;
        let correspondencias;
        let resultados = [];
        let formulaCalculo = formulaLimpa;

        while((correspondencias = regexDados.exec(formulaLimpa)) !== null) {
            const numDados = correspondencias[1] ? parseInt(correspondencias[1]) : 1;
            const numLados = parseInt(correspondencias[2]);
            let somaParcial = 0;
            for(let i=0; i<numDados; i++) {
                const resultado = Math.floor(Math.random() * numLados) + 1;
                resultados.push(resultado);
                somaParcial += resultado;
            }
            formulaCalculo = formulaCalculo.replace(correspondencias[0], somaParcial);
        }

        try {
            // (Usando eval de forma controlada, como no seu original)
            const total = eval(formulaCalculo); 
            const logData = { titulo, formula, resultados, total, timestamp: new Date().toISOString() };
            
            // 1. Mostra o popup local
            mostrarPopupRolagem(titulo, formula, resultados, total);
            
            // 2. Salva no log do navegador (para log.html)
            salvarRolagemNoLog(logData);

            // 3. (NOVO) Envia para o backend (para o mestre e outros)
            enviarRolagemParaBackend(logData);

        } catch (e) { console.error("Erro na rolagem:", e); }
    };


    // ====================================\
    // 10.5. LÓGICA DE POLLING (NOVO)
    // ====================================

    /**
     * Inicia o Long-Polling para buscar rolagens.
     */
    async function iniciarPolling(campanhaId) {
        console.log(`Iniciando polling para campanha ${campanhaId} a partir de ${ultimoIdRolagemConhecido}`);
        try {
            const response = await fetch(`api/get_rolagens.php?campanha_id=${campanhaId}&ultimo_id=${ultimoIdRolagemConhecido}`);
            
            if (!response.ok) {
                 throw new Error(`Erro de rede: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success && result.rolagens.length > 0) {
                // Processa as novas rolagens
                result.rolagens.forEach(log => {
                    console.log("Nova rolagem recebida:", log);
                    
                    ultimoIdRolagemConhecido = Math.max(ultimoIdRolagemConhecido, log.id);

                    // Se a rolagem NÃO for nossa, exibe o toast
                    if (log.personagem_id !== globalPersonagemId) {
                         mostrarPopupRolagem(
                            `${log.personagem_nome}: ${log.titulo}`, 
                            log.formula, 
                            log.resultados, // Já vem como array
                            log.total
                        );
                    }
                });
            }
        } catch (error) {
            console.error("Erro no polling:", error);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Chama a si mesmo para a próxima requisição
        iniciarPolling(campanhaId);
    }


    // ====================================\
    // 11. LISTENERS DE EVENTOS DE ROLAGEM (Seu código)
    // ====================================
    // (Seu código original, sem modificações)
    document.querySelectorAll('.secao-atributo').forEach(attr => {
        attr.addEventListener('click', () => {
            const label = attr.dataset.label;
            const mod = parseInt(attr.querySelector('.input-atributo-editavel').value) || 0;
            rolarDados(`Teste de ${label}`, `1d20${mod >= 0 ? '+' : ''}${mod}`);
        });
    });

    document.querySelectorAll('.pericia-item').forEach(item => {
        item.addEventListener('click', () => {
            const label = item.querySelector('label').textContent;
            const total = item.querySelector('.input-pericia-total').value;
            rolarDados(`Teste de ${label}`, `1d20${total}`);
        });
    });

    document.getElementById('secao-iniciativa').addEventListener('click', () => {
        const bonus = document.getElementById('iniciativa-valor').value;
        rolarDados('Iniciativa', `1d20${bonus}`);
    });
    
    document.querySelectorAll('#tabela-ataque tbody tr').forEach(adicionarListenersDeRolagemAtaque);

    
    // ====================================\
    // INICIALIZAÇÃO FINAL (MODIFICADO)
    // ====================================
    // Removemos a inicialização daqui e movemos para UMA chamada:
    carregarFicha(personagemIdFromURL);
});