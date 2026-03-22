// Continuação do app.js

// App Manager
class AppManager {
    constructor() {
        this.storage = new StorageManager();
        this.notification = new NotificationManager();
        this.modal = new ModalManager();
        this.calculos = CalculosMoldes;
        this.currentModule = 'dashboard';
        
        // Inicializa importador Excel V2 quando disponível
        if (typeof ExcelImporterV2 !== 'undefined') {
            this.excelImporter = new ExcelImporterV2(this);
            window.excelImporterV2 = this.excelImporter; // Torna acessível globalmente
            console.log('✅ ExcelImporterV2 integrado ao AppManager');
        }
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupDateTime();
        this.setupModules();
        this.updateDashboard();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const module = item.dataset.module;
                this.switchModule(module);
            });
        });

        const toggleBtn = document.getElementById('toggleSidebar');
        const sidebar = document.getElementById('sidebar');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }
    }

    setupDateTime() {
        const dateTimeEl = document.getElementById('dateTime');
        if (!dateTimeEl) return;
        
        const updateDateTime = () => {
            const now = new Date();
            const formatted = now.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            dateTimeEl.textContent = formatted;
        };
        updateDateTime();
        setInterval(updateDateTime, 60000);
    }

    switchModule(moduleName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.module === moduleName) {
                item.classList.add('active');
            }
        });

        document.querySelectorAll('.module').forEach(module => {
            module.classList.remove('active');
        });
        document.getElementById(moduleName).classList.add('active');

        const titles = {
            dashboard: 'Dashboard',
            vidaUtil: 'Vida Útil de Moldes',
            itensCriticos: 'Itens Críticos',
            qlp: 'QLP',
            gases: 'Controle de Gases',
            treinamentos: 'Treinamentos',
            reunioes: 'Reuniões Diárias',
            diaria: 'Diária - Gestão Visual',
            planoAcao: 'Plano de Ação',
            custos: 'Gestão de Custos',
            saidaMoldes: 'Saída de Moldes',
            inventarioMoldes: 'Inventário de Moldes'
        };
        document.getElementById('pageTitle').textContent = titles[moduleName];

        this.currentModule = moduleName;
        
        // Adiciona botão de importação Excel após um pequeno delay para garantir que o conteúdo foi renderizado
        setTimeout(() => {
            if (this.excelImporter) {
                const moduleMap = {
                    'inventarioMoldes': { name: 'inventarioMoldes', selector: '#inventarioMoldes' },
                    'vidaUtil': { name: 'vidaUtil', selector: '#vidaUtil' },
                    'qlp': { name: 'qlp', selector: '#qlp' },
                    'itensCriticos': { name: 'itensCriticos', selector: '#itensCriticos' },
                    'gases': { name: 'gases', selector: '#gases' },
                    'treinamentos': { name: 'treinamentos', selector: '#treinamentos' },
                    'reunioes': { name: 'reunioes', selector: '#reunioes' },
                    'saidaMoldes': { name: 'saidaMoldes', selector: '#saidaMoldes' }
                };
                
                if (moduleMap[moduleName]) {
                    // Remove botões de importação anteriores para evitar duplicação
                    const existingPanels = document.querySelectorAll('.excel-import-panel');
                    existingPanels.forEach(panel => panel.remove());
                    
                    // Adiciona novo botão
                    this.excelImporter.createImportButton(moduleMap[moduleName].name, moduleMap[moduleName].selector);
                }
            }
        }, 300);

        this.loadModuleData(moduleName);
    }

    setupModules() {
        // Helper function para adicionar listener com segurança
        const addListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        // Vida Útil
        addListener('addVidaUtilBtn', 'click', () => this.showVidaUtilForm());
        addListener('searchVidaUtil', 'input', (e) => this.searchTable('vidaUtilTable', e.target.value));

        // Inventário de Moldes
        addListener('addInventarioBtn', 'click', () => this.showInventarioMoldesForm());
        addListener('searchInventario', 'input', (e) => this.searchTable('inventarioTable', e.target.value));

        // Itens Críticos
        addListener('addItemCriticoBtn', 'click', () => this.showItemCriticoForm());
        addListener('searchItensCriticos', 'input', (e) => this.searchTable('itensCriticosTable', e.target.value));

        // QLP
        addListener('addQlpBtn', 'click', () => this.showQlpForm());
        addListener('searchQlp', 'input', (e) => this.searchTable('qlpTable', e.target.value));

        // Gases
        addListener('addGasBtn', 'click', () => this.showGasForm());
        addListener('searchGases', 'input', (e) => this.searchTable('gasesTable', e.target.value));

        // Treinamentos
        addListener('addTreinamentoBtn', 'click', () => this.showTreinamentoForm());
        addListener('searchTreinamentos', 'input', (e) => this.searchTable('treinamentosTable', e.target.value));

        // Reuniões
        addListener('addReuniaoBtn', 'click', () => this.showReuniaoForm());
        addListener('searchReunioes', 'input', (e) => this.searchTable('reunioesTable', e.target.value));
        
        // Plano de Ação
        addListener('addPlanoAcaoBtn', 'click', () => this.showPlanoAcaoForm());
        addListener('searchPlanoAcao', 'input', (e) => this.searchTable('planoAcaoTable', e.target.value));
        
        // Custos
        addListener('addCustoBtn', 'click', () => this.showCustoForm());
        addListener('searchCustos', 'input', (e) => this.searchTable('custosTable', e.target.value));
        
        // Saída de Moldes - Nova lógica de múltiplos itens
        addListener('searchSaidaMoldes', 'input', (e) => this.searchTable('saidaMoldesTable', e.target.value));
        
        // Inicializar data atual no formulário
        const inputDataSaida = document.getElementById('inputData');
        if (inputDataSaida && !inputDataSaida.value) {
            inputDataSaida.value = new Date().toISOString().split('T')[0];
        }
        
        // Calculadora de Moldes
        addListener('searchItensMolde', 'input', (e) => this.searchTable('itensMoldeTable', e.target.value));
    }

    loadModuleData(module) {
        switch(module) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'vidaUtil':
                this.renderVidaUtil();
                break;
            case 'inventarioMoldes':
                this.renderInventarioMoldes();
                this.renderInventarioMoldesDashboard();
                break;
            case 'itensCriticos':
                this.renderItensCriticos();
                break;
            case 'qlp':
                this.renderQlp();
                break;
            case 'gases':
                this.renderGases();
                break;
            case 'treinamentos':
                this.renderTreinamentos();
                break;
            case 'reunioes':
                this.renderReunioes();
                this.renderReunioesDashboard();
                break;
            case 'diaria':
                this.renderDiaria();
                break;
            case 'planoAcao':
                this.renderPlanoAcao();
                break;
            case 'custos':
                this.renderCustos();
                break;
            case 'saidaMoldes':
                this.initSaidaMoldesForm();
                this.renderSaidaMoldes();
                break;
        }
    }

    // Dashboard
    updateDashboard() {
        const data = this.storage.getData();
        
        const totalMoldesEl = document.getElementById('totalMoldes');
        const moldesEmUsoEl = document.getElementById('moldesEmUso');
        const itensCriticosAlertaEl = document.getElementById('itensCriticosAlerta');
        const eficienciaMediaEl = document.getElementById('eficienciaMedia');
        
        if (!totalMoldesEl) return; // Se não está no dashboard, sair
        
        totalMoldesEl.textContent = data.vidaUtil.length;
        moldesEmUsoEl.textContent = data.vidaUtil.filter(m => m.status === 'Em Uso').length;
        
        const itensCriticos = data.itensCriticos.filter(i => i.quantidade <= i.estoqueMinimo).length;
        itensCriticosAlertaEl.textContent = itensCriticos;

        // KPIs de Saída de Moldes
        const totalSaidasEl = document.getElementById('dashTotalSaidas');
        const saidasSemanaEl = document.getElementById('dashSaidasSemana');
        
        if (totalSaidasEl && data.saidaMoldes) {
            totalSaidasEl.textContent = data.saidaMoldes.length;
            
            // Saídas nos últimos 7 dias
            const hoje = new Date();
            const seteDiasAtras = new Date(hoje.getTime() - (7 * 24 * 60 * 60 * 1000));
            const saidasSemana = data.saidaMoldes.filter(s => new Date(s.data) >= seteDiasAtras).length;
            saidasSemanaEl.textContent = saidasSemana;
        }

        // Calcular eficiência média
        if (data.vidaUtil.length > 0) {
            const eficiencias = data.vidaUtil.map(m => {
                const calc = CalculosMoldes.calcularTodosMolde(m);
                return parseFloat(calc.eficiencia);
            });
            const media = eficiencias.reduce((a, b) => a + b, 0) / eficiencias.length;
            eficienciaMediaEl.textContent = media.toFixed(1) + '%';
        } else {
            eficienciaMediaEl.textContent = '0%';
        }

        // Moldes por máquina
        const moldesPorMaq = {};
        data.vidaUtil.forEach(m => {
            if (!moldesPorMaq[m.maquina]) moldesPorMaq[m.maquina] = 0;
            if (m.status === 'Em Uso') moldesPorMaq[m.maquina]++;
        });
        
        const moldesPorMaquinaContainer = document.getElementById('moldesPorMaquina');
        if (Object.keys(moldesPorMaq).length > 0) {
            moldesPorMaquinaContainer.innerHTML = Object.entries(moldesPorMaq).map(([maq, count]) => `
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <strong>Máquina ${maq}</strong>: ${count} molde(s) em uso
                </div>
            `).join('');
        } else {
            moldesPorMaquinaContainer.innerHTML = '<p class="empty-message">Nenhum molde em uso</p>';
        }

        // Status de gases
        const gasesRecentes = data.gases.slice(-5).reverse();
        const gasesContainer = document.getElementById('statusGases');
        if (gasesRecentes.length > 0) {
            gasesContainer.innerHTML = gasesRecentes.map(g => {
                const duracao = CalculosMoldes.calcularDuracaoGas(g.dataMontagem, g.dataSaida);
                return `
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <strong>${g.tipoGas}</strong> - ${g.responsavel}
                        <br><small style="color: var(--text-secondary);">Duração: ${duracao} dias</small>
                    </div>
                `;
            }).join('');
        } else {
            gasesContainer.innerHTML = '<p class="empty-message">Nenhum registro de gases</p>';
        }

        // Próximos treinamentos
        const proximosTreinamentos = data.treinamentos
            .filter(t => new Date(t.data) >= new Date() && t.status !== 'Concluído')
            .sort((a, b) => new Date(a.data) - new Date(b.data))
            .slice(0, 5);
        
        const treinamentosContainer = document.getElementById('proximosTreinamentos');
        if (proximosTreinamentos.length > 0) {
            treinamentosContainer.innerHTML = proximosTreinamentos.map(t => `
                <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <strong>${t.titulo}</strong>
                    <br><small style="color: var(--text-secondary);">${this.formatDate(t.data)} - ${t.instrutor}</small>
                </div>
            `).join('');
        } else {
            treinamentosContainer.innerHTML = '<p class="empty-message">Nenhum treinamento agendado</p>';
        }

        // Eficiência por máquina
        const eficienciaPorMaq = {};
        data.vidaUtil.forEach(m => {
            if (!eficienciaPorMaq[m.maquina]) eficienciaPorMaq[m.maquina] = [];
            const calc = CalculosMoldes.calcularTodosMolde(m);
            eficienciaPorMaq[m.maquina].push(parseFloat(calc.eficiencia));
        });

        const eficienciaContainer = document.getElementById('eficienciaPorMaquina');
        if (Object.keys(eficienciaPorMaq).length > 0) {
            eficienciaContainer.innerHTML = Object.entries(eficienciaPorMaq).map(([maq, eficiencias]) => {
                const media = eficiencias.reduce((a, b) => a + b, 0) / eficiencias.length;
                const color = media >= 90 ? 'var(--success-color)' : media >= 70 ? 'var(--warning-color)' : 'var(--danger-color)';
                return `
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Máquina ${maq}</strong>
                        <div class="progress-bar" style="margin-top: 5px;">
                            <div class="progress" style="width: ${media}%; background: ${color};"></div>
                        </div>
                        <span style="font-size: 12px;">${media.toFixed(1)}%</span>
                    </div>
                `;
            }).join('');
        } else {
            eficienciaContainer.innerHTML = '<p class="empty-message">Sem dados</p>';
        }

        // Plano de Ação - Status
        const acoesPlano = data.planoAcao || [];
        const planoAcaoContainer = document.getElementById('statusPlanoAcao');
        if (planoAcaoContainer) {
            const totalAcoes = acoesPlano.length;
            const acoesAbertas = acoesPlano.filter(a => a.status === 'Pendente' || a.status === 'Em Andamento').length;
            const acoesConcluidas = acoesPlano.filter(a => a.status === 'Concluída').length;
            const acoesAtrasadas = acoesPlano.filter(a => a.status === 'Atrasada').length;

            if (totalAcoes > 0) {
                planoAcaoContainer.innerHTML = `
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Total de Ações:</strong> ${totalAcoes}
                    </div>
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                        <span>Abertas:</span>
                        <strong style="color: var(--warning-color);">${acoesAbertas}</strong>
                    </div>
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                        <span>Concluídas:</span>
                        <strong style="color: var(--success-color);">${acoesConcluidas}</strong>
                    </div>
                    <div style="padding: 8px 0; display: flex; justify-content: space-between;">
                        <span>Atrasadas:</span>
                        <strong style="color: var(--danger-color);">${acoesAtrasadas}</strong>
                    </div>
                `;
            } else {
                planoAcaoContainer.innerHTML = '<p class="empty-message">Nenhuma ação registrada</p>';
            }
        }

        // Diária - Últimas Reuniões
        const reunioesRecentes = data.reunioes || [];
        const diariaContainer = document.getElementById('statusDiaria');
        if (diariaContainer) {
            if (reunioesRecentes.length > 0) {
                const ultimasReunions = reunioesRecentes.slice(-3).reverse();
                const totalSeguranca = reunioesRecentes.reduce((sum, r) => 
                    sum + (r.condicaoInsegura || 0) + (r.incidente || 0) + (r.atoInseguro || 0), 0);
                const totalMoldes = reunioesRecentes.reduce((sum, r) => sum + (r.moldesRecebidos || 0), 0);

                diariaContainer.innerHTML = `
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Total de Reuniões:</strong> ${reunioesRecentes.length}
                    </div>
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                        <span>Ocorrências Segurança:</span>
                        <strong style="color: var(--danger-color);">${totalSeguranca}</strong>
                    </div>
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                        <span>Moldes Recebidos:</span>
                        <strong style="color: var(--success-color);">${totalMoldes}</strong>
                    </div>
                    <div style="padding: 8px 0;">
                        <small style="color: var(--text-secondary);">Última: ${this.formatDate(ultimasReunions[0].data)} - ${ultimasReunions[0].tipo}</small>
                    </div>
                `;
            } else {
                diariaContainer.innerHTML = '<p class="empty-message">Nenhuma reunião registrada</p>';
            }
        }

        // QLP - Estatísticas de Pessoas
        const funcionariosQlp = data.qlp || [];
        const totalFuncionariosEl = document.getElementById('totalFuncionarios');
        const funcionariosAtivosEl = document.getElementById('funcionariosAtivos');
        const qlpContainer = document.getElementById('statusQlp');
        
        if (totalFuncionariosEl) {
            totalFuncionariosEl.textContent = funcionariosQlp.length;
        }
        
        if (funcionariosAtivosEl) {
            const ativos = funcionariosQlp.filter(f => f.status === 'Ativo').length;
            funcionariosAtivosEl.textContent = ativos;
        }
        
        if (qlpContainer) {
            if (funcionariosQlp.length > 0) {
                const ativos = funcionariosQlp.filter(f => f.status === 'Ativo').length;
                const ferias = funcionariosQlp.filter(f => f.status === 'Férias').length;
                const afastados = funcionariosQlp.filter(f => f.status === 'Afastado').length;
                
                // Calcular tempo médio na empresa
                let tempoMedio = 0;
                if (funcionariosQlp.length > 0) {
                    const tempos = funcionariosQlp
                        .filter(f => f.dataEntrada)
                        .map(f => {
                            const entrada = new Date(f.dataEntrada);
                            const hoje = new Date();
                            const diffTime = Math.abs(hoje - entrada);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return diffDays;
                        });
                    
                    if (tempos.length > 0) {
                        tempoMedio = Math.floor(tempos.reduce((a, b) => a + b, 0) / tempos.length);
                    }
                }
                
                const anos = Math.floor(tempoMedio / 365);
                const meses = Math.floor((tempoMedio % 365) / 30);
                const tempoMedioStr = anos > 0 
                    ? `${anos} ano${anos > 1 ? 's' : ''} ${meses > 0 ? `e ${meses} mês${meses > 1 ? 'es' : ''}` : ''}`
                    : `${meses} mês${meses > 1 ? 'es' : ''}`;
                
                // Distribuição por função
                const funcoes = {};
                funcionariosQlp.forEach(f => {
                    if (f.funcao) {
                        funcoes[f.funcao] = (funcoes[f.funcao] || 0) + 1;
                    }
                });
                
                const top3Funcoes = Object.entries(funcoes)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
                
                qlpContainer.innerHTML = `
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Total:</strong> ${funcionariosQlp.length} funcionário${funcionariosQlp.length !== 1 ? 's' : ''}
                    </div>
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                        <span>Ativos:</span>
                        <strong style="color: var(--success-color);">${ativos}</strong>
                    </div>
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                        <span>Férias:</span>
                        <strong style="color: var(--info-color);">${ferias}</strong>
                    </div>
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                        <span>Afastados:</span>
                        <strong style="color: var(--warning-color);">${afastados}</strong>
                    </div>
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Tempo Médio:</strong> ${tempoMedioStr || 'N/A'}
                    </div>
                    ${top3Funcoes.length > 0 ? `
                        <div style="padding: 8px 0;">
                            <strong style="font-size: 11px; color: var(--text-secondary);">TOP 3 FUNÇÕES</strong>
                            ${top3Funcoes.map(([funcao, count]) => `
                                <div style="padding: 4px 0; display: flex; justify-content: space-between;">
                                    <small>${funcao}</small>
                                    <small><strong>${count}</strong></small>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                `;
            } else {
                qlpContainer.innerHTML = '<p class="empty-message">Nenhum funcionário cadastrado</p>';
            }
        }
        
        // Saída de Moldes - NOVO
        const dashTotalSaidasEl = document.getElementById('dashTotalSaidas');
        const dashSaidasSemanaEl = document.getElementById('dashSaidasSemana');
        const saidaMoldesContainer = document.getElementById('statusSaidaMoldes');
        
        // Pegar dados do localStorage
        let saidaMoldes = [];
        try {
            const stored = localStorage.getItem('moldes_management');
            if (stored) {
                const allData = JSON.parse(stored);
                saidaMoldes = allData.saidaMoldes || [];
            }
        } catch (e) {
            saidaMoldes = [];
        }
        
        // Atualizar KPI: Total de Saídas
        if (dashTotalSaidasEl) {
            dashTotalSaidasEl.textContent = saidaMoldes.length;
        }
        
        // Atualizar KPI: Saídas Esta Semana
        if (dashSaidasSemanaEl) {
            const hoje = new Date();
            const inicioSemana = new Date(hoje);
            inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
            
            const saidasSemana = saidaMoldes.filter(s => {
                const dataSaida = new Date(s.data);
                return dataSaida >= inicioSemana;
            });
            
            dashSaidasSemanaEl.textContent = saidasSemana.length;
        }
        
        // Atualizar Widget: Últimas Saídas
        if (saidaMoldesContainer) {
            if (saidaMoldes.length > 0) {
                const ultimas5 = saidaMoldes
                    .sort((a, b) => new Date(b.data) - new Date(a.data))
                    .slice(0, 5);
                
                saidaMoldesContainer.innerHTML = ultimas5.map(s => {
                    const dataFormatada = new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    return `
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${s.item}</strong>
                                <br><small style="color: var(--text-secondary);">Máquina ${s.maquina} - ${dataFormatada}</small>
                            </div>
                            <span class="badge badge-success">${s.quantidade} un</span>
                        </div>
                    `;
                }).join('');
            } else {
                saidaMoldesContainer.innerHTML = '<p class="empty-message">Nenhuma saída registrada</p>';
            }
        }
    }

    // Vida Útil
    showVidaUtilForm(item = null) {
        const content = `
            <form id="vidaUtilForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Código *</label>
                        <input type="text" name="codigo" value="${item && item.codigo || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Nome *</label>
                        <input type="text" name="nome" value="${item && item.nome || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Status *</label>
                        <select name="status" required>
                            <option value="Disponível" ${item && item.status === 'Disponível' ? 'selected' : ''}>Disponível</option>
                            <option value="Em Uso" ${item && item.status === 'Em Uso' ? 'selected' : ''}>Em Uso</option>
                            <option value="Manutenção" ${item && item.status === 'Manutenção' ? 'selected' : ''}>Manutenção</option>
                            <option value="Descartado" ${item && item.status === 'Descartado' ? 'selected' : ''}>Descartado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Máquina *</label>
                        <select name="maquina" required>
                            <option value="591" ${item && item.maquina === '591' ? 'selected' : ''}>591</option>
                            <option value="592" ${item && item.maquina === '592' ? 'selected' : ''}>592</option>
                            <option value="593" ${item && item.maquina === '593' ? 'selected' : ''}>593</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Qtd Moldes (Set) *</label>
                        <input type="number" name="qtdMoldes" value="${item && item.qtdMoldes || ''}" required placeholder="Ex: 10">
                    </div>
                    <div class="form-group">
                        <label>Velocidade *</label>
                        <input type="number" step="0.1" name="velocidade" value="${item && item.velocidade || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Target (garrafas/molde) *</label>
                        <input type="number" name="target" value="${item && item.target || ''}" required placeholder="Ex: 7000">
                    </div>
                    <div class="form-group">
                        <!-- Espaço reservado -->
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Data Entrada *</label>
                        <input type="date" name="dataEntrada" value="${item && item.dataEntrada || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Data Saída *</label>
                        <input type="date" name="dataSaida" value="${item && item.dataSaida || ''}" required>
                    </div>
                </div>
                <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <strong style="color: #2563eb;">ℹ️ Valores Calculados Automaticamente:</strong>
                    <ul style="margin: 10px 0 0 20px; color: #475569;">
                        <li>Dias em Máquina</li>
                        <li>Cortes Total</li>
                        <li>Cortes por Molde</li>
                        <li>Eficiência (%) = (Cortes Total ÷ Qtd Moldes ÷ Target) × 100</li>
                    </ul>
                </div>
            </form>
        `;

        this.modal.show(item ? 'Editar Molde' : 'Adicionar Molde', content, () => {
            const form = document.getElementById('vidaUtilForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return false;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            data.velocidade = parseFloat(data.velocidade);
            data.qtdMoldes = parseInt(data.qtdMoldes);
            data.target = parseInt(data.target);

            if (item) {
                this.storage.updateItem('vidaUtil', item.id, data);
                this.notification.show('success', 'Sucesso', 'Molde atualizado com sucesso!');
            } else {
                this.storage.addItem('vidaUtil', data);
                this.notification.show('success', 'Sucesso', 'Molde adicionado com sucesso!');
            }

            this.renderVidaUtil();
            this.updateDashboard();
            return true;
        });
    }

    renderVidaUtil() {
        console.log('🎯 renderVidaUtil() chamada');
        const items = this.storage.getModule('vidaUtil');
        const tbody = document.getElementById('vidaUtilTable');
        
        console.log('📦 Items de Vida Útil recuperados:', items.length);
        console.log('📦 Dados completos:', JSON.stringify(items, null, 2));

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="empty-message">Nenhum molde cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => {
            const calc = CalculosMoldes.calcularTodosMolde(item);
            const statusClass = item.status === 'Disponível' ? 'success' : 
                               item.status === 'Em Uso' ? 'info' : 
                               item.status === 'Manutenção' ? 'warning' : 'danger';
            
            const eficienciaClass = parseFloat(calc.eficiencia) >= 90 ? 'success' : 
                                   parseFloat(calc.eficiencia) >= 70 ? 'warning' : 'danger';

            return `
                <tr>
                    <td><strong>${item.codigo}</strong></td>
                    <td>${item.nome}</td>
                    <td><span class="badge badge-${statusClass}">${item.status}</span></td>
                    <td>${item.maquina}</td>
                    <td><strong>${item.qtdMoldes}</strong></td>
                    <td>${this.formatDate(item.dataEntrada)}</td>
                    <td>${calc.dias}</td>
                    <td>${calc.cortesTotal.toLocaleString('pt-BR')}</td>
                    <td>${item.target.toLocaleString('pt-BR')}</td>
                    <td><span class="badge badge-${eficienciaClass}">${calc.eficiencia}%</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="window.app.editVidaUtil('${item.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.app.deleteVidaUtil('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Atualizar Dashboard e Gráficos
        this.updateDashboardVidaUtil(items);
        this.renderGraficosVidaUtil(items);
    }
    
    updateDashboardVidaUtil(items) {
        // KPIs
        const totalMoldesEl = document.getElementById('totalMoldesVU');
        const moldesEmUsoEl = document.getElementById('moldesEmUsoVU');
        const eficienciaMediaEl = document.getElementById('eficienciaMediaVU');
        const melhorMaquinaEl = document.getElementById('melhorMaquinaVU');
        
        if (!totalMoldesEl) return; // Não está na aba Vida Útil
        
        // Total de moldes
        totalMoldesEl.textContent = items.length;
        
        // Moldes em uso
        const moldesEmUso = items.filter(m => m.status === 'Em Uso');
        moldesEmUsoEl.textContent = moldesEmUso.length;
        
        // Eficiência média
        if (items.length > 0) {
            const somaEficiencia = items.reduce((sum, item) => {
                const calc = CalculosMoldes.calcularTodosMolde(item);
                return sum + parseFloat(calc.eficiencia);
            }, 0);
            const media = (somaEficiencia / items.length).toFixed(1);
            eficienciaMediaEl.textContent = media + '%';
        } else {
            eficienciaMediaEl.textContent = '0%';
        }
        
        // Melhor máquina (por eficiência média)
        const maquinas = { '591': [], '592': [], '593': [] };
        items.forEach(item => {
            if (maquinas[item.maquina]) {
                const calc = CalculosMoldes.calcularTodosMolde(item);
                maquinas[item.maquina].push(parseFloat(calc.eficiencia));
            }
        });
        
        let melhorMaquina = '-';
        let melhorMedia = 0;
        Object.keys(maquinas).forEach(maq => {
            if (maquinas[maq].length > 0) {
                const media = maquinas[maq].reduce((a, b) => a + b, 0) / maquinas[maq].length;
                if (media > melhorMedia) {
                    melhorMedia = media;
                    melhorMaquina = maq;
                }
            }
        });
        melhorMaquinaEl.textContent = melhorMaquina !== '-' ? 'Máq ' + melhorMaquina : '-';
    }
    
    renderGraficosVidaUtil(items) {
        this.renderGraficoMoldesPorStatus(items);
        this.renderGraficoMoldesPorMaquina(items);
        this.renderGraficosEficienciaPorMaquina(items);
    }
    
    renderGraficoMoldesPorStatus(items) {
        const canvas = document.getElementById('chartMoldesPorStatus');
        if (!canvas) return;
        
        // Destruir gráfico anterior
        if (this.chartMoldesPorStatus) {
            this.chartMoldesPorStatus.destroy();
        }
        
        // Agrupar por status
        const status = {};
        items.forEach(item => {
            status[item.status] = (status[item.status] || 0) + 1;
        });
        
        const ctx = canvas.getContext('2d');
        this.chartMoldesPorStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(status),
                datasets: [{
                    data: Object.values(status),
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e2e8f0',
                            font: { size: 12 },
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#e2e8f0',
                        bodyColor: '#e2e8f0',
                        borderColor: '#475569',
                        borderWidth: 1,
                        padding: 12
                    }
                }
            }
        });
    }
    
    renderGraficoMoldesPorMaquina(items) {
        const canvas = document.getElementById('chartMoldesPorMaquina');
        if (!canvas) return;
        
        // Destruir gráfico anterior
        if (this.chartMoldesPorMaquina) {
            this.chartMoldesPorMaquina.destroy();
        }
        
        // Agrupar por máquina
        const maquinas = { '591': 0, '592': 0, '593': 0 };
        items.forEach(item => {
            if (maquinas[item.maquina] !== undefined) {
                maquinas[item.maquina]++;
            }
        });
        
        const ctx = canvas.getContext('2d');
        this.chartMoldesPorMaquina = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Máquina 591', 'Máquina 592', 'Máquina 593'],
                datasets: [{
                    label: 'Moldes',
                    data: [maquinas['591'], maquinas['592'], maquinas['593']],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#e2e8f0',
                        bodyColor: '#e2e8f0',
                        borderColor: '#475569',
                        borderWidth: 1,
                        padding: 12
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 11 },
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 11 }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    renderGraficosEficienciaPorMaquina(items) {
        ['591', '592', '593'].forEach((maq, index) => {
            const canvas = document.getElementById(`chartEficienciaMaq${maq}`);
            if (!canvas) return;
            
            // Destruir gráfico anterior
            if (this[`chartEficienciaMaq${maq}`]) {
                this[`chartEficienciaMaq${maq}`].destroy();
            }
            
            // Filtrar moldes da máquina e ordenar por data de entrada
            const moldesMaquina = items
                .filter(item => item.maquina === maq)
                .sort((a, b) => new Date(a.dataEntrada) - new Date(b.dataEntrada))
                .slice(-10); // Últimos 10 moldes
            
            // Calcular eficiências
            const labels = moldesMaquina.map(item => item.codigo);
            const eficiencias = moldesMaquina.map(item => {
                const calc = CalculosMoldes.calcularTodosMolde(item);
                return parseFloat(calc.eficiencia);
            });
            
            // Calcular média
            const media = eficiencias.length > 0 
                ? (eficiencias.reduce((a, b) => a + b, 0) / eficiencias.length).toFixed(1)
                : 0;
            
            // Atualizar badge de média
            const mediaBadge = document.getElementById(`eficMedia${maq}VU`);
            if (mediaBadge) {
                mediaBadge.textContent = media + '%';
            }
            
            // Cores por máquina
            const cores = {
                '591': { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
                '592': { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                '593': { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
            };
            
            const ctx = canvas.getContext('2d');
            this[`chartEficienciaMaq${maq}`] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Eficiência (%)',
                        data: eficiencias,
                        borderColor: cores[maq].border,
                        backgroundColor: cores[maq].bg,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: cores[maq].border,
                        pointBorderColor: '#1e293b',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1e293b',
                            titleColor: '#e2e8f0',
                            bodyColor: '#e2e8f0',
                            borderColor: cores[maq].border,
                            borderWidth: 1,
                            padding: 12,
                            callbacks: {
                                label: function(context) {
                                    return 'Eficiência: ' + context.parsed.y.toFixed(1) + '%';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: '#94a3b8',
                                font: { size: 11 },
                                stepSize: 20,
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            }
                        },
                        x: {
                            ticks: {
                                color: '#94a3b8',
                                font: { size: 10 },
                                maxRotation: 45,
                                minRotation: 45
                            },
                            grid: { display: false }
                        }
                    }
                }
            });
        });
    }

    showVidaUtilForm(item = null) {
        const content = `
            <form id="vidaUtilForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Código *</label>
                        <input type="text" name="codigo" value="${item && item.codigo || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Nome *</label>
                        <input type="text" name="nome" value="${item && item.nome || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Status *</label>
                        <select name="status" required>
                            <option value="Disponível" ${item && item.status === 'Disponível' ? 'selected' : ''}>Disponível</option>
                            <option value="Em Uso" ${item && item.status === 'Em Uso' ? 'selected' : ''}>Em Uso</option>
                            <option value="Manutenção" ${item && item.status === 'Manutenção' ? 'selected' : ''}>Manutenção</option>
                            <option value="Descartado" ${item && item.status === 'Descartado' ? 'selected' : ''}>Descartado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Máquina *</label>
                        <select name="maquina" required>
                            <option value="591" ${item && item.maquina === '591' ? 'selected' : ''}>591</option>
                            <option value="592" ${item && item.maquina === '592' ? 'selected' : ''}>592</option>
                            <option value="593" ${item && item.maquina === '593' ? 'selected' : ''}>593</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Qtd Moldes (Set) *</label>
                        <input type="number" name="qtdMoldes" value="${item && item.qtdMoldes || ''}" required placeholder="Ex: 10">
                    </div>
                    <div class="form-group">
                        <label>Velocidade *</label>
                        <input type="number" step="0.1" name="velocidade" value="${item && item.velocidade || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Target (garrafas/molde) *</label>
                        <input type="number" name="target" value="${item && item.target || ''}" required placeholder="Ex: 7000">
                    </div>
                    <div class="form-group">
                        <!-- Espaço reservado -->
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Data Entrada *</label>
                        <input type="date" name="dataEntrada" value="${item && item.dataEntrada || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Data Saída *</label>
                        <input type="date" name="dataSaida" value="${item && item.dataSaida || ''}" required>
                    </div>
                </div>
                <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <strong style="color: #2563eb;">ℹ️ Valores Calculados Automaticamente:</strong>
                    <ul style="margin: 10px 0 0 20px; color: #475569;">
                        <li>Dias em Máquina</li>
                        <li>Cortes Total</li>
                        <li>Cortes por Molde</li>
                        <li>Eficiência (%) = (Cortes Total ÷ Qtd Moldes ÷ Target) × 100</li>
                    </ul>
                </div>
            </form>
        `;

        this.modal.show(item ? 'Editar Molde' : 'Adicionar Molde', content, () => {
            const form = document.getElementById('vidaUtilForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return false;
            }

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            data.velocidade = parseFloat(data.velocidade);
            data.qtdMoldes = parseInt(data.qtdMoldes);
            data.target = parseInt(data.target);

            if (item) {
                this.storage.updateItem('vidaUtil', item.id, data);
                this.notification.show('success', 'Sucesso', 'Molde atualizado com sucesso!');
            } else {
                this.storage.addItem('vidaUtil', data);
                this.notification.show('success', 'Sucesso', 'Molde adicionado com sucesso!');
            }

            this.renderVidaUtil();
            this.updateDashboard();
            return true;
        });
    }

    editVidaUtil(id) {
        const items = this.storage.getModule('vidaUtil');
        const item = items.find(i => i.id === id);
        if (item) {
            this.showVidaUtilForm(item);
        }
    }

    deleteVidaUtil(id) {
        if (confirm('Tem certeza que deseja excluir este molde?')) {
            this.storage.deleteItem('vidaUtil', id);
            this.notification.show('success', 'Sucesso', 'Molde excluído com sucesso!');
            this.renderVidaUtil();
            this.updateDashboard();
        }
    }

    editVidaUtil(id) {
        const items = this.storage.getModule('vidaUtil');
        const item = items.find(i => i.id === id);
        if (item) {
            this.showVidaUtilForm(item);
        }
    }

    deleteVidaUtil(id) {
        if (confirm('Tem certeza que deseja excluir este molde?')) {
            this.storage.deleteItem('vidaUtil', id);
            this.notification.show('success', 'Sucesso', 'Molde excluído com sucesso!');
            this.renderVidaUtil();
            this.updateDashboard();
        }
    }

    // Continua no próximo bloco...
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    searchTable(tableId, query) {
        const rows = document.querySelectorAll(`#${tableId} tr`);
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Nova função para aba Diária (Visualização de Reuniões)
    renderDiaria() {
        const reunioes = this.storage.getModule('reunioes');
        const container = document.getElementById('diariaContent');
        
        if (!container) return;
        
        if (reunioes.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 15px; color: var(--border-color);"></i>
                    <p style="font-size: 18px; color: var(--text-primary);">Nenhuma reunião registrada</p>
                    <p style="font-size: 14px;">Cadastre reuniões em "Reuniões Diárias" para ver a gestão visual aqui</p>
                </div>
            `;
            return;
        }

        // Ordenar reuniões por data
        const reunioesOrdenadas = reunioes.sort((a, b) => new Date(a.data) - new Date(b.data));
        const reuniaoMaisRecente = reunioesOrdenadas[reunioesOrdenadas.length - 1];
        
        // Preparar dados para gráficos (últimas 10 reuniões)
        const ultimasReunioesGraficos = reunioesOrdenadas.slice(-10);
        const labels = ultimasReunioesGraficos.map(r => this.formatDate(r.data));
        
        // Calcular totais do período
        const totais = {
            condicaoInsegura: 0,
            incidente: 0,
            atoInseguro: 0,
            moldesRecebidos: 0,
            pecasLimpas: 0,
            moldesReparados: 0,
            coroasRecebidas: 0,
            coroasReparadas: 0,
            coroasInspecionadas: 0,
            coroasSegregadas: 0,
            puncoesRecebidos: 0,
            puncoesReparados: 0,
            puncoesSegregados: 0,
            volumeInspecionado: 0,
            volumeSegregado: 0,
            insertosSegregados: 0
        };

        reunioes.forEach(r => {
            totais.condicaoInsegura += r.condicaoInsegura || 0;
            totais.incidente += r.incidente || 0;
            totais.atoInseguro += r.atoInseguro || 0;
            totais.moldesRecebidos += r.moldesRecebidos || 0;
            totais.pecasLimpas += r.pecasLimpas || 0;
            totais.moldesReparados += r.moldesReparados || 0;
            totais.coroasRecebidas += r.coroasRecebidas || 0;
            totais.coroasReparadas += r.coroasReparadas || 0;
            totais.coroasInspecionadas += r.coroasInspecionadas || 0;
            totais.coroasSegregadas += r.coroasSegregadas || 0;
            totais.puncoesRecebidos += r.puncoesRecebidos || 0;
            totais.puncoesReparados += r.puncoesReparados || 0;
            totais.puncoesSegregados += r.puncoesSegregados || 0;
            totais.volumeInspecionado += r.volumeInspecionado || 0;
            totais.volumeSegregado += r.volumeSegregado || 0;
            totais.insertosSegregados += r.insertosSegregados || 0;
        });

        // Estilo Dashboard: Cards de estatísticas principais no topo
        container.innerHTML = `
            <!-- Cards Principais - Estilo Dashboard -->
            <div class="stats-grid" style="margin-bottom: 30px;">
                <div class="stat-card">
                    <div class="stat-icon red">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${totais.condicaoInsegura + totais.incidente + totais.atoInseguro}</h3>
                        <p>Ocorrências Segurança</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">
                        <i class="fas fa-industry"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${totais.moldesRecebidos}</h3>
                        <p>Moldes Recebidos</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">
                        <i class="fas fa-cog"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${totais.coroasReparadas + totais.puncoesReparados}</h3>
                        <p>Componentes Reparados</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${totais.volumeInspecionado.toLocaleString('pt-BR')}</h3>
                        <p>Volume Inspecionado</p>
                    </div>
                </div>
            </div>

            <!-- Grid Dashboard - Estilo Dashboard -->
            <div class="dashboard-grid">

                <!-- Card Segurança -->
                <div class="dashboard-card">
                    <h3><i class="fas fa-shield-alt" style="color: var(--danger-color);"></i> Segurança</h3>
                    <div class="list-container" style="margin-bottom: 15px;">
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Condição Insegura:</span>
                            <strong style="color: var(--danger-color);">${totais.condicaoInsegura}</strong>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Incidentes:</span>
                            <strong style="color: var(--danger-color);">${totais.incidente}</strong>
                        </div>
                        <div style="padding: 8px 0; display: flex; justify-content: space-between;">
                            <span>Ato Inseguro:</span>
                            <strong style="color: var(--danger-color);">${totais.atoInseguro}</strong>
                        </div>
                    </div>
                    <div style="background: var(--bg-light); padding: 10px; border-radius: 8px;">
                        <canvas id="chartSeguranca" style="max-height: 250px;"></canvas>
                    </div>
                </div>

                <!-- Card Produção -->
                <div class="dashboard-card">
                    <h3><i class="fas fa-industry" style="color: var(--success-color);"></i> Produção de Moldes</h3>
                    <div class="list-container" style="margin-bottom: 15px;">
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Moldes Recebidos:</span>
                            <strong style="color: var(--success-color);">${totais.moldesRecebidos}</strong>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Peças Limpas:</span>
                            <strong style="color: var(--success-color);">${totais.pecasLimpas}</strong>
                        </div>
                        <div style="padding: 8px 0; display: flex; justify-content: space-between;">
                            <span>Moldes Reparados:</span>
                            <strong style="color: var(--success-color);">${totais.moldesReparados}</strong>
                        </div>
                    </div>
                    <div style="background: var(--bg-light); padding: 10px; border-radius: 8px;">
                        <canvas id="chartProducao" style="max-height: 250px;"></canvas>
                    </div>
                </div>

                <!-- Card Componentes -->
                <div class="dashboard-card">
                    <h3><i class="fas fa-cog" style="color: var(--warning-color);"></i> Componentes</h3>
                    <div class="list-container" style="margin-bottom: 15px;">
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Coroas Reparadas:</span>
                            <strong style="color: var(--warning-color);">${totais.coroasReparadas}</strong>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Coroas Inspecionadas:</span>
                            <strong style="color: var(--warning-color);">${totais.coroasInspecionadas}</strong>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Punções Reparados:</span>
                            <strong style="color: var(--warning-color);">${totais.puncoesReparados}</strong>
                        </div>
                        <div style="padding: 8px 0; display: flex; justify-content: space-between;">
                            <span>Insertos Segregados:</span>
                            <strong style="color: var(--warning-color);">${totais.insertosSegregados}</strong>
                        </div>
                    </div>
                    <div style="background: var(--bg-light); padding: 10px; border-radius: 8px;">
                        <canvas id="chartComponentes" style="max-height: 250px;"></canvas>
                    </div>
                </div>

                <!-- Card Volume -->
                <div class="dashboard-card">
                    <h3><i class="fas fa-chart-line" style="color: var(--primary-color);"></i> Volume e Inspeção</h3>
                    <div class="list-container" style="margin-bottom: 15px;">
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Volume Inspecionado:</span>
                            <strong style="color: var(--primary-color);">${totais.volumeInspecionado.toLocaleString('pt-BR')}</strong>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Volume Segregado:</span>
                            <strong style="color: var(--danger-color);">${totais.volumeSegregado.toLocaleString('pt-BR')}</strong>
                        </div>
                        <div style="padding: 8px 0; display: flex; justify-content: space-between;">
                            <span>Taxa de Rejeição:</span>
                            <strong style="color: var(--warning-color);">${totais.volumeInspecionado > 0 ? ((totais.volumeSegregado / totais.volumeInspecionado) * 100).toFixed(2) : 0}%</strong>
                        </div>
                    </div>
                    <div style="background: var(--bg-light); padding: 10px; border-radius: 8px;">
                        <canvas id="chartVolume" style="max-height: 250px;"></canvas>
                    </div>
                </div>
            </div>

            <!-- Grid Dashboard - Histórico -->
            <div class="dashboard-grid" style="margin-top: 30px;">
                <div class="dashboard-card" style="grid-column: 1 / -1;">
                    <h3><i class="fas fa-history"></i> Últimas 5 Reuniões</h3>
                    <div class="list-container">
                        ${reunioesOrdenadas.slice(-5).reverse().map(r => `
                            <div style="padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                    <strong style="color: var(--text-primary);">${this.formatDate(r.data)} - ${r.tipo}</strong>
                                    <span class="badge" style="background: var(--success-color); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                                        ${r.moldesReparados || 0} reparados
                                    </span>
                                </div>
                                <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">
                                    👥 ${r.participantes} participantes | 
                                    🏭 ${r.moldesRecebidos || 0} moldes recebidos | 
                                    ⚠️ ${(r.condicaoInsegura || 0) + (r.incidente || 0) + (r.atoInseguro || 0)} ocorrências de segurança
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Criar gráficos após renderizar HTML
        setTimeout(() => {
            this.criarGraficosComChartJS(ultimasReunioesGraficos, labels);
        }, 100);
    }

    criarGraficosComChartJS(reunioes, labels) {
        // Destruir gráficos existentes
        if (window.chartSeguranca) window.chartSeguranca.destroy();
        if (window.chartProducao) window.chartProducao.destroy();
        if (window.chartComponentes) window.chartComponentes.destroy();
        if (window.chartVolume) window.chartVolume.destroy();

        // Configuração comum para gráficos
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 12, weight: '500' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    cornerRadius: 6
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        font: { size: 11 },
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                    ticks: { 
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: { display: false }
                }
            }
        };

        // 1. Gráfico de Segurança (Barras - Vermelho)
        const ctxSeguranca = document.getElementById('chartSeguranca');
        if (ctxSeguranca) {
            window.chartSeguranca = new Chart(ctxSeguranca, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Condição Insegura',
                            data: reunioes.map(r => r.condicaoInsegura || 0),
                            backgroundColor: 'rgba(239, 68, 68, 0.7)',
                            borderColor: '#ef4444',
                            borderWidth: 2,
                            borderRadius: 6
                        },
                        {
                            label: 'Incidentes',
                            data: reunioes.map(r => r.incidente || 0),
                            backgroundColor: 'rgba(220, 38, 38, 0.7)',
                            borderColor: '#dc2626',
                            borderWidth: 2,
                            borderRadius: 6
                        },
                        {
                            label: 'Ato Inseguro',
                            data: reunioes.map(r => r.atoInseguro || 0),
                            backgroundColor: 'rgba(185, 28, 28, 0.7)',
                            borderColor: '#b91c1c',
                            borderWidth: 2,
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        title: {
                            display: true,
                            text: 'Indicadores de Segurança',
                            font: { size: 14, weight: 'bold' },
                            color: '#ef4444'
                        }
                    }
                }
            });
        }

        // 2. Gráfico de Produção (Barras - Verde)
        const ctxProducao = document.getElementById('chartProducao');
        if (ctxProducao) {
            window.chartProducao = new Chart(ctxProducao, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Moldes Recebidos',
                            data: reunioes.map(r => r.moldesRecebidos || 0),
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: '#10b981',
                            borderWidth: 2,
                            borderRadius: 6
                        },
                        {
                            label: 'Peças Limpas',
                            data: reunioes.map(r => r.pecasLimpas || 0),
                            backgroundColor: 'rgba(5, 150, 105, 0.7)',
                            borderColor: '#059669',
                            borderWidth: 2,
                            borderRadius: 6
                        },
                        {
                            label: 'Moldes Reparados',
                            data: reunioes.map(r => r.moldesReparados || 0),
                            backgroundColor: 'rgba(4, 120, 87, 0.7)',
                            borderColor: '#047857',
                            borderWidth: 2,
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        title: {
                            display: true,
                            text: 'Produção de Moldes',
                            font: { size: 14, weight: 'bold' },
                            color: '#10b981'
                        }
                    }
                }
            });
        }

        // 3. Gráfico de Componentes (Barras empilhadas - Laranja)
        const ctxComponentes = document.getElementById('chartComponentes');
        if (ctxComponentes) {
            window.chartComponentes = new Chart(ctxComponentes, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Coroas Recebidas',
                            data: reunioes.map(r => r.coroasRecebidas || 0),
                            backgroundColor: 'rgba(245, 158, 11, 0.8)',
                            borderColor: '#f59e0b',
                            borderWidth: 2,
                            stack: 'coroas',
                            borderRadius: 5
                        },
                        {
                            label: 'Coroas Reparadas',
                            data: reunioes.map(r => r.coroasReparadas || 0),
                            backgroundColor: 'rgba(217, 119, 6, 0.8)',
                            borderColor: '#d97706',
                            borderWidth: 2,
                            stack: 'coroas',
                            borderRadius: 5
                        },
                        {
                            label: 'Punções Recebidos',
                            data: reunioes.map(r => r.puncoesRecebidos || 0),
                            backgroundColor: 'rgba(251, 146, 60, 0.7)',
                            borderColor: '#fb923c',
                            borderWidth: 2,
                            stack: 'puncoes',
                            borderRadius: 5
                        },
                        {
                            label: 'Punções Reparados',
                            data: reunioes.map(r => r.puncoesReparados || 0),
                            backgroundColor: 'rgba(234, 88, 12, 0.7)',
                            borderColor: '#ea580c',
                            borderWidth: 2,
                            stack: 'puncoes',
                            borderRadius: 5
                        }
                    ]
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        title: {
                            display: true,
                            text: 'Componentes: Coroas e Punções',
                            font: { size: 14, weight: 'bold' },
                            color: '#f59e0b'
                        }
                    }
                }
            });
        }

        // 4. Gráfico de Volume (Linha - Estilo Bolsa de Valores)
        const ctxVolume = document.getElementById('chartVolume');
        if (ctxVolume) {
            window.chartVolume = new Chart(ctxVolume, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Volume Inspecionado',
                            data: reunioes.map(r => r.volumeInspecionado || 0),
                            borderColor: '#2563eb',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 5,
                            pointBackgroundColor: '#2563eb',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointHoverRadius: 7
                        },
                        {
                            label: 'Volume Segregado',
                            data: reunioes.map(r => r.volumeSegregado || 0),
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointRadius: 5,
                            pointBackgroundColor: '#ef4444',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointHoverRadius: 7,
                            borderDash: [5, 5]
                        },
                        {
                            label: 'Insertos Segregados',
                            data: reunioes.map(r => r.insertosSegregados || 0),
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 2,
                            tension: 0.3,
                            fill: false,
                            pointRadius: 4,
                            pointBackgroundColor: '#f59e0b',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        title: {
                            display: true,
                            text: 'Tendência de Volume e Inspeção (Estilo Trading)',
                            font: { size: 14, weight: 'bold' },
                            color: '#1e40af'
                        }
                    },
                    scales: {
                        ...commonOptions.scales,
                        y: {
                            ...commonOptions.scales.y,
                            grid: { 
                                color: 'rgba(0, 0, 0, 0.05)',
                                drawBorder: false
                            }
                        },
                        x: {
                            ...commonOptions.scales.x,
                            grid: { 
                                color: 'rgba(0, 0, 0, 0.03)'
                            }
                        }
                    }
                }
            });
        }
    }

    // Plano de Ação
    renderPlanoAcao() {
        const acoes = this.storage.getModule('planoAcao');
        
        // Renderizar estatísticas
        this.renderPlanoAcaoStats(acoes);
        
        // Renderizar tabela
        const tbody = document.getElementById('planoAcaoTable');
        if (!tbody) return;

        if (acoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-message">Nenhuma ação registrada</td></tr>';
            return;
        }

        tbody.innerHTML = acoes.map(acao => {
            // Calcular dias desde abertura
            const diasDesdeAbertura = Math.floor((new Date() - new Date(acao.dataAbertura)) / (1000 * 60 * 60 * 24));
            
            // Calcular dias até prazo ou atraso
            const diasAtePrazo = Math.floor((new Date(acao.prazo) - new Date()) / (1000 * 60 * 60 * 24));
            const atrasada = diasAtePrazo < 0 && acao.status !== 'Concluída' && acao.status !== 'Cancelada';
            
            // Se está atrasada, atualizar status automaticamente
            if (atrasada && acao.status !== 'Atrasada') {
                acao.status = 'Atrasada';
                this.storage.updateItem('planoAcao', acao.id, acao);
            }
            
            // Cores de prioridade
            const prioridadeColors = {
                'Alta': 'var(--danger-color)',
                'Média': 'var(--warning-color)',
                'Baixa': 'var(--success-color)'
            };
            
            // Cores de status
            const statusColors = {
                'Pendente': '#64748b',
                'Em Andamento': '#3b82f6',
                'Concluída': '#10b981',
                'Cancelada': '#6b7280',
                'Atrasada': '#ef4444'
            };
            
            return `
                <tr>
                    <td>${this.formatDate(acao.dataAbertura)}</td>
                    <td style="max-width: 300px;">
                        <strong>${acao.descricao}</strong>
                        <br><small style="color: var(--text-secondary); font-size: 11px;">
                            ${diasDesdeAbertura} dia(s) desde abertura
                        </small>
                    </td>
                    <td><span style="font-size: 11px;">${acao.origem}</span></td>
                    <td>${acao.responsavel}</td>
                    <td>
                        ${this.formatDate(acao.prazo)}
                        <br><small style="color: ${atrasada ? 'var(--danger-color)' : 'var(--success-color)'}; font-size: 11px;">
                            ${atrasada ? `${Math.abs(diasAtePrazo)} dia(s) atrasado` : `${diasAtePrazo} dia(s) restantes`}
                        </small>
                    </td>
                    <td>
                        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: white; background: ${prioridadeColors[acao.prioridade]};">
                            ${acao.prioridade}
                        </span>
                    </td>
                    <td><span style="font-size: 11px;">${acao.categoria}</span></td>
                    <td>
                        <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; color: white; background: ${statusColors[acao.status]};">
                            ${acao.status}
                        </span>
                    </td>
                    <td style="white-space: nowrap;">
                        <button class="btn btn-sm btn-primary" onclick="window.app.editPlanoAcao('${acao.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.app.deletePlanoAcao('${acao.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderPlanoAcaoStats(acoes) {
        const container = document.getElementById('planoAcaoStats');
        if (!container) return;

        const total = acoes.length;
        const pendentes = acoes.filter(a => a.status === 'Pendente').length;
        const emAndamento = acoes.filter(a => a.status === 'Em Andamento').length;
        const concluidas = acoes.filter(a => a.status === 'Concluída').length;
        const atrasadas = acoes.filter(a => a.status === 'Atrasada').length;
        const canceladas = acoes.filter(a => a.status === 'Cancelada').length;
        
        const taxaConclusao = total > 0 ? ((concluidas / total) * 100).toFixed(1) : 0;
        
        // Calcular média de dias para conclusão
        const acoesConcluidas = acoes.filter(a => a.dataConclusao);
        let mediaDias = 0;
        if (acoesConcluidas.length > 0) {
            const totalDias = acoesConcluidas.reduce((sum, a) => {
                const dias = Math.floor((new Date(a.dataConclusao) - new Date(a.dataAbertura)) / (1000 * 60 * 60 * 24));
                return sum + dias;
            }, 0);
            mediaDias = Math.round(totalDias / acoesConcluidas.length);
        }

        container.innerHTML = `
            <div class="stats-grid" style="margin-bottom: 25px;">
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${total}</h3>
                        <p>Total de Ações</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${pendentes + emAndamento}</h3>
                        <p>Ações Abertas</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${concluidas}</h3>
                        <p>Concluídas</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${atrasadas}</h3>
                        <p>Atrasadas</p>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid" style="margin-bottom: 25px;">
                <div class="dashboard-card">
                    <h3><i class="fas fa-chart-pie"></i> Taxa de Conclusão</h3>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; font-weight: bold; color: var(--success-color);">
                            ${taxaConclusao}%
                        </div>
                        <p style="color: var(--text-secondary); margin-top: 10px;">
                            ${concluidas} de ${total} ações concluídas
                        </p>
                    </div>
                </div>
                <div class="dashboard-card">
                    <h3><i class="fas fa-calendar-check"></i> Média de Conclusão</h3>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 48px; font-weight: bold; color: var(--primary-color);">
                            ${mediaDias}
                        </div>
                        <p style="color: var(--text-secondary); margin-top: 10px;">
                            dias para concluir ações
                        </p>
                    </div>
                </div>
                <div class="dashboard-card">
                    <h3><i class="fas fa-list-alt"></i> Status das Ações</h3>
                    <div class="list-container">
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Pendentes:</span>
                            <strong style="color: #64748b;">${pendentes}</strong>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Em Andamento:</span>
                            <strong style="color: #3b82f6;">${emAndamento}</strong>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Concluídas:</span>
                            <strong style="color: #10b981;">${concluidas}</strong>
                        </div>
                        <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                            <span>Atrasadas:</span>
                            <strong style="color: #ef4444;">${atrasadas}</strong>
                        </div>
                        <div style="padding: 8px 0; display: flex; justify-content: space-between;">
                            <span>Canceladas:</span>
                            <strong style="color: #6b7280;">${canceladas}</strong>
                        </div>
                    </div>
                </div>
                <div class="dashboard-card">
                    <h3><i class="fas fa-layer-group"></i> Por Categoria</h3>
                    <div class="list-container">
                        ${this.getCategoryCounts(acoes).map(([cat, count]) => `
                            <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
                                <span>${cat}:</span>
                                <strong>${count}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    getCategoryCounts(acoes) {
        const counts = {};
        acoes.forEach(a => {
            counts[a.categoria] = (counts[a.categoria] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }

    showPlanoAcaoForm(acao = null) {
        const isEdit = !!acao;
        const formTitle = isEdit ? 'Editar Ação' : 'Nova Ação';

        const formHTML = `
            <div class="modal-header">
                <h2>${formTitle}</h2>
                <button class="close-modal" onclick="window.app.modal.close()">&times;</button>
            </div>
            <form id="planoAcaoForm" class="modal-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Data de Abertura *</label>
                        <input type="date" name="dataAbertura" value="${acao?.dataAbertura || new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label>Prazo *</label>
                        <input type="date" name="prazo" value="${acao?.prazo || ''}" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Descrição da Ação *</label>
                    <textarea name="descricao" rows="3" required placeholder="Descreva detalhadamente a ação a ser realizada">${acao?.descricao || ''}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Origem *</label>
                        <select name="origem" required>
                            <option value="">Selecione...</option>
                            <option value="Reunião DDS" ${acao?.origem === 'Reunião DDS' ? 'selected' : ''}>Reunião DDS</option>
                            <option value="Reunião de Produção" ${acao?.origem === 'Reunião de Produção' ? 'selected' : ''}>Reunião de Produção</option>
                            <option value="Auditoria" ${acao?.origem === 'Auditoria' ? 'selected' : ''}>Auditoria</option>
                            <option value="Inspeção" ${acao?.origem === 'Inspeção' ? 'selected' : ''}>Inspeção</option>
                            <option value="Melhoria Contínua" ${acao?.origem === 'Melhoria Contínua' ? 'selected' : ''}>Melhoria Contínua</option>
                            <option value="Reclamação Cliente" ${acao?.origem === 'Reclamação Cliente' ? 'selected' : ''}>Reclamação Cliente</option>
                            <option value="Não Conformidade" ${acao?.origem === 'Não Conformidade' ? 'selected' : ''}>Não Conformidade</option>
                            <option value="Outro" ${acao?.origem === 'Outro' ? 'selected' : ''}>Outro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Responsável *</label>
                        <input type="text" name="responsavel" value="${acao?.responsavel || ''}" required placeholder="Nome do responsável">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Prioridade *</label>
                        <select name="prioridade" required>
                            <option value="Alta" ${acao?.prioridade === 'Alta' ? 'selected' : ''}>Alta</option>
                            <option value="Média" ${acao?.prioridade === 'Média' ? 'selected' : ''}>Média</option>
                            <option value="Baixa" ${acao?.prioridade === 'Baixa' ? 'selected' : ''}>Baixa</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status *</label>
                        <select name="status" required>
                            <option value="Pendente" ${acao?.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="Em Andamento" ${acao?.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                            <option value="Concluída" ${acao?.status === 'Concluída' ? 'selected' : ''}>Concluída</option>
                            <option value="Atrasada" ${acao?.status === 'Atrasada' ? 'selected' : ''}>Atrasada</option>
                            <option value="Cancelada" ${acao?.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Categoria *</label>
                        <select name="categoria" required>
                            <option value="">Selecione...</option>
                            <option value="Segurança" ${acao?.categoria === 'Segurança' ? 'selected' : ''}>Segurança</option>
                            <option value="Qualidade" ${acao?.categoria === 'Qualidade' ? 'selected' : ''}>Qualidade</option>
                            <option value="Produção" ${acao?.categoria === 'Produção' ? 'selected' : ''}>Produção</option>
                            <option value="Manutenção" ${acao?.categoria === 'Manutenção' ? 'selected' : ''}>Manutenção</option>
                            <option value="5S" ${acao?.categoria === '5S' ? 'selected' : ''}>5S</option>
                            <option value="Treinamento" ${acao?.categoria === 'Treinamento' ? 'selected' : ''}>Treinamento</option>
                            <option value="Administrativo" ${acao?.categoria === 'Administrativo' ? 'selected' : ''}>Administrativo</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Data de Conclusão</label>
                    <input type="date" name="dataConclusao" value="${acao?.dataConclusao || ''}">
                    <small style="color: var(--text-secondary);">Preencher apenas quando a ação for concluída</small>
                </div>
                
                <div class="form-group">
                    <label>Observações</label>
                    <textarea name="observacoes" rows="3" placeholder="Anotações, atualizações de progresso, impedimentos, etc.">${acao?.observacoes || ''}</textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="window.app.modal.close()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> ${isEdit ? 'Atualizar' : 'Cadastrar'}
                    </button>
                </div>
            </form>
        `;

        this.modal.show(formHTML);

        const form = document.getElementById('planoAcaoForm');
        if (!form) {
            console.error('Formulário planoAcaoForm não encontrado!');
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);

            if (isEdit) {
                this.storage.updateItem('planoAcao', acao.id, data);
                this.notification.show('success', 'Sucesso', 'Ação atualizada com sucesso!');
            } else {
                this.storage.addItem('planoAcao', data);
                this.notification.show('success', 'Sucesso', 'Ação cadastrada com sucesso!');
            }

            this.modal.close();
            this.renderPlanoAcao();
        });
    }

    editPlanoAcao(id) {
        const acoes = this.storage.getModule('planoAcao');
        const acao = acoes.find(a => a.id === id);
        if (acao) this.showPlanoAcaoForm(acao);
    }

    deletePlanoAcao(id) {
        if (confirm('Tem certeza que deseja excluir esta ação?')) {
            this.storage.deleteItem('planoAcao', id);
            this.notification.show('success', 'Sucesso', 'Ação excluída com sucesso!');
            this.renderPlanoAcao();
        }
    }
}