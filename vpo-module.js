// ============================================
// VPO - VERIFICAÇÃO DE PROCESSOS OPERACIONAIS
// ============================================

// Atividades VPO - TODAS PARA TODOS (8 atividades)
AppManager.prototype.atividadesVPO = [
    { id: 'guardian', nome: 'Guardian', icone: '🛡️', ordem: 1 },
    { id: 'splan', nome: 'Splan', icone: '📊', ordem: 2 },
    { id: 'interactionlog', nome: 'Interactionlog', icone: '📝', ordem: 3 },
    { id: 'smartcheck', nome: 'Smartcheck', icone: '✓', ordem: 4 },
    { id: 'pulsa', nome: 'Pulsa', icone: '💓', ordem: 5 },
    { id: 'sap', nome: 'SAP', icone: '💼', ordem: 6 },
    { id: 'monitoramentoSeguranca', nome: 'Mon. Segurança', icone: '🦺', ordem: 7 },
    { id: 'monitoramentoAmbiental', nome: 'Mon. Ambiental', icone: '🌱', ordem: 8 }
];

// Função para obter atividades por função (agora retorna todas para todos)
AppManager.prototype.getAtividadesPorFuncao = function(funcao) {
    return this.atividadesVPO; // Todos têm 8 atividades
};

// Variável global para armazenar colaboradores filtrados
AppManager.prototype.colaboradoresVPOFiltrados = [];

// Variáveis para controle de registro semanal
AppManager.prototype.vpoRegistroTemporario = {}; // Armazena checkboxes marcados antes de salvar

// Renderizar VPO
AppManager.prototype.renderVPO = function() {
    // Inicializar filtros se não existirem
    if (!this.vpoFiltrosAtivos) {
        this.vpoFiltrosAtivos = { data: '', turno: '', colaborador: '', status: '' };
    }
    
    // Obter colaboradores ativos do QLP
    let colaboradores = this.storage.getModule('qlp').filter(c => c.status === 'Ativo');
    
    // Aplicar filtro de colaborador específico
    if (this.vpoFiltrosAtivos.colaborador) {
        colaboradores = colaboradores.filter(c => c.id === this.vpoFiltrosAtivos.colaborador);
    }
    
    // Determinar data e turno (filtros ou valores padrão)
    const dataAlvo = this.vpoFiltrosAtivos.data || new Date().toISOString().split('T')[0];
    const turnoAlvo = this.vpoFiltrosAtivos.turno || '1';
    
    // Obter registros VPO do dia e turno
    const registros = this.storage.getModule('vpo').filter(r => r.data === dataAlvo && r.turno === turnoAlvo);
    
    // Calcular KPIs (considerando atividades dinâmicas por função)
    let totalConcluidas = 0;
    let totalPendentes = 0;
    let totalAtividades = 0;
    let tempoTotalMinutos = 0;
    
    colaboradores.forEach(colab => {
        const atividades = this.getAtividadesPorFuncao(colab.funcao);
        const numAtividades = atividades.length;
        totalAtividades += numAtividades;
        
        const registro = registros.find(r => r.colaboradorId === colab.id);
        if (registro) {
            totalConcluidas += registro.atividadesConcluidas || 0;
            totalPendentes += (numAtividades - (registro.atividadesConcluidas || 0));
            // Estimar 5 minutos por atividade concluída
            tempoTotalMinutos += (registro.atividadesConcluidas || 0) * 5;
        } else {
            totalPendentes += numAtividades;
        }
    });
    
    const conformidade = totalAtividades > 0 ? ((totalConcluidas / totalAtividades) * 100).toFixed(1) : 0;
    const tempoTotalHoras = (tempoTotalMinutos / 60).toFixed(1);
    
    // Atualizar KPIs
    document.getElementById('vpoAtividadesConcluidas').textContent = totalConcluidas;
    document.getElementById('vpoAtividadesPendentes').textContent = totalPendentes;
    document.getElementById('vpoColaboradoresAtivos').textContent = colaboradores.length;
    document.getElementById('vpoConformidade').textContent = conformidade + '%';
    document.getElementById('vpoTempoTotal').textContent = tempoTotalHoras + 'h';
    
    // Armazenar colaboradores para filtro
    this.colaboradoresVPOFiltrados = colaboradores.map(colab => {
        const registro = registros.find(r => r.colaboradorId === colab.id) || this.criarRegistroVPOVazio(colab, dataAlvo, turnoAlvo);
        const percentual = registro.percentualConclusao || 0;
        const statusText = percentual >= 95 ? 'Completo' : percentual >= 80 ? 'Bom' : percentual >= 50 ? 'Parcial' : 'Crítico';
        
        return {
            colaborador: colab,
            registro: registro,
            percentual: percentual,
            statusText: statusText
        };
    });
    
    // Aplicar filtro de status
    if (this.vpoFiltrosAtivos.status) {
        this.colaboradoresVPOFiltrados = this.colaboradoresVPOFiltrados.filter(
            item => item.statusText === this.vpoFiltrosAtivos.status
        );
    }
    
    // Renderizar checklists
    this.renderVPOChecklists();
    
    // Renderizar gráfico de desempenho individual
    this.renderVPOGraficoIndividual();
    
    // Atualizar info da semana selecionada
    this.atualizarInfoSemanaVPO();
    
    // Atualizar indicador de filtros
    this.atualizarIndicadorFiltros();
};

// Renderizar checklists (separado para permitir filtro sem recalcular tudo)
AppManager.prototype.renderVPOChecklists = function() {
    const container = document.getElementById('vpoChecklistContainer');
    const colaboradores = this.colaboradoresVPOFiltrados;
    
    if (colaboradores.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhum colaborador encontrado</div>';
        return;
    }
    
    // Todas as atividades (8 para todos)
    const gridColumns = `250px repeat(8, 1fr) 120px`;
    
    // Criar cabeçalho da tabela
    const header = `
        <div class="vpo-table-header" style="grid-template-columns: ${gridColumns};">
            <div class="vpo-table-header-cell">
                <i class="fas fa-user"></i>
                Colaborador
            </div>
            ${this.atividadesVPO.map(ativ => `
                <div class="vpo-table-header-cell">
                    <span class="icon">${ativ.icone}</span>
                    ${ativ.nome}
                </div>
            `).join('')}
            <div class="vpo-table-header-cell">
                <i class="fas fa-chart-line"></i>
                Status
            </div>
        </div>
    `;
    
    // Criar corpo da tabela
    const body = colaboradores.map(item => {
        const colab = item.colaborador;
        const registro = item.registro;
        const percentual = item.percentual;
        const statusText = item.statusText;
        const statusClass = statusText === 'Completo' ? 'vpo-status-completo' : 
                           statusText === 'Bom' ? 'vpo-status-bom' : 
                           statusText === 'Parcial' ? 'vpo-status-parcial' : 'vpo-status-critico';
        
        return `
            <div class="vpo-table-row" data-colaborador="${colab.nome.toLowerCase()}" data-status="${statusText}" style="grid-template-columns: ${gridColumns};">
                <div class="vpo-table-cell">
                    <div class="vpo-colaborador-nome">${colab.nome}</div>
                    <div class="vpo-colaborador-funcao">${colab.funcao || 'Colaborador'}</div>
                </div>
                ${this.atividadesVPO.map(ativ => {
                    const concluido = registro[ativ.id] || false;
                    const hora = registro[ativ.id + 'Hora'] || '';
                    return `
                        <div class="vpo-table-cell">
                            <div class="vpo-checkbox-wrapper">
                                <input type="checkbox" 
                                    class="vpo-checkbox"
                                    id="vpo_${registro.colaboradorId}_${ativ.id}" 
                                    ${concluido ? 'checked' : ''} 
                                    onchange="window.app.toggleAtividadeVPO('${registro.colaboradorId}', '${ativ.id}', this.checked)">
                                ${concluido ? `<span class="vpo-hora">${hora}</span>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
                <div class="vpo-table-cell">
                    <div class="vpo-status-badge ${statusClass}">
                        ${percentual.toFixed(0)}%
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Montar tabela completa
    container.innerHTML = `
        <div class="vpo-checklist-table">
            ${header}
            <div class="vpo-table-body">
                ${body}
            </div>
        </div>
    `;
};

// Filtrar VPO por busca e status
AppManager.prototype.filtrarVPO = function() {
    const busca = document.getElementById('vpoSearchColaborador').value.toLowerCase();
    const statusFiltro = document.getElementById('vpoStatusFilter').value;
    
    // Aplicar filtros nas linhas da tabela
    const container = document.getElementById('vpoChecklistContainer');
    const rows = container.querySelectorAll('.vpo-table-row');
    
    let visibleCount = 0;
    
    rows.forEach(row => {
        const nome = row.getAttribute('data-colaborador');
        const status = row.getAttribute('data-status');
        
        let mostrar = true;
        
        // Filtro por nome
        if (busca && !nome.includes(busca)) {
            mostrar = false;
        }
        
        // Filtro por status
        if (statusFiltro && status !== statusFiltro) {
            mostrar = false;
        }
        
        row.style.display = mostrar ? 'grid' : 'none';
        if (mostrar) visibleCount++;
    });
    
    // Verificar se há resultados
    if (visibleCount === 0) {
        const tableBody = container.querySelector('.vpo-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary); grid-column: 1 / -1;">Nenhum colaborador encontrado com os filtros aplicados</div>';
        }
    }
};

// Criar registro VPO vazio
AppManager.prototype.criarRegistroVPOVazio = function(colaborador, data, turno) {
    const atividades = this.getAtividadesPorFuncao(colaborador.funcao);
    const registro = {
        colaboradorId: colaborador.id,
        colaboradorNome: colaborador.nome,
        colaboradorFuncao: colaborador.funcao,
        data: data,
        turno: turno,
        percentualConclusao: 0,
        totalAtividades: atividades.length,
        atividadesConcluidas: 0,
        status: 'Pendente'
    };
    
    // Adicionar campos para cada atividade
    atividades.forEach(ativ => {
        registro[ativ.id] = false;
        registro[ativ.id + 'Hora'] = '';
    });
    
    return registro;
};

// Toggle atividade VPO (modo temporário - só salva ao clicar em "Salvar")
AppManager.prototype.toggleAtividadeVPO = function(colaboradorId, atividadeId, concluido) {
    const horaAtual = new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    
    // Inicializar registro temporário se não existir
    if (!this.vpoRegistroTemporario[colaboradorId]) {
        this.vpoRegistroTemporario[colaboradorId] = {};
    }
    
    // Armazenar estado temporário
    this.vpoRegistroTemporario[colaboradorId][atividadeId] = concluido;
    this.vpoRegistroTemporario[colaboradorId][atividadeId + 'Hora'] = concluido ? horaAtual : '';
    
    // Mostrar indicador de alterações não salvas
    const warning = document.getElementById('vpoUnsavedWarning');
    if (warning && Object.keys(this.vpoRegistroTemporario).length > 0) {
        warning.style.display = 'flex';
    }
    
    // Atualizar visual do checkbox (sem salvar)
    const checkbox = document.getElementById(`vpo_${colaboradorId}_${atividadeId}`);
    if (checkbox) {
        // Atualizar wrapper com horário
        const wrapper = checkbox.closest('.vpo-checkbox-wrapper');
        const horaSpan = wrapper.querySelector('.vpo-hora');
        
        if (concluido) {
            if (!horaSpan) {
                const newHora = document.createElement('span');
                newHora.className = 'vpo-hora';
                newHora.textContent = horaAtual;
                wrapper.appendChild(newHora);
            } else {
                horaSpan.textContent = horaAtual;
            }
        } else {
            if (horaSpan) {
                horaSpan.remove();
            }
        }
    }
    
    // Recalcular percentual temporário para o colaborador
    const atividades = this.getAtividadesPorFuncao();
    const colabRegistro = this.vpoRegistroTemporario[colaboradorId];
    const concluidas = atividades.filter(a => colabRegistro[a.id]).length;
    const percentual = (concluidas / atividades.length) * 100;
    
    // Atualizar badge de status
    const row = document.querySelector(`.vpo-table-row[data-colaborador*="${colaboradorId}"]`);
    if (!row) {
        // Buscar por nome do colaborador (fallback)
        const colaborador = this.storage.getModule('qlp').find(c => c.id === colaboradorId);
        if (colaborador) {
            const nomeRow = Array.from(document.querySelectorAll('.vpo-table-row')).find(r => 
                r.querySelector('.vpo-colaborador-nome')?.textContent.trim() === colaborador.nome
            );
            if (nomeRow) {
                const statusBadge = nomeRow.querySelector('.vpo-status-badge');
                if (statusBadge) {
                    this.atualizarBadgeStatus(statusBadge, percentual);
                }
            }
        }
    } else {
        const statusBadge = row.querySelector('.vpo-status-badge');
        if (statusBadge) {
            this.atualizarBadgeStatus(statusBadge, percentual);
        }
    }
};

// Função auxiliar para atualizar badge de status
AppManager.prototype.atualizarBadgeStatus = function(badge, percentual) {
    badge.textContent = percentual.toFixed(0) + '%';
    
    // Atualizar classe de cor
    badge.className = 'vpo-status-badge';
    if (percentual >= 95) {
        badge.classList.add('vpo-status-completo');
    } else if (percentual >= 80) {
        badge.classList.add('vpo-status-bom');
    } else if (percentual >= 50) {
        badge.classList.add('vpo-status-parcial');
    } else {
        badge.classList.add('vpo-status-critico');
    }
};

// Atualizar VPO
AppManager.prototype.atualizarVPO = function() {
    this.renderVPO();
    this.notification.show('info', 'Atualizado', 'VPO atualizado com sucesso!');
};

// Salvar registros VPO para a semana selecionada
AppManager.prototype.salvarVPOSemana = function() {
    const semanaSelecionada = parseInt(document.getElementById('vpoSemanaSelecionada').value);
    
    if (!this.vpoRegistroTemporario || Object.keys(this.vpoRegistroTemporario).length === 0) {
        this.notification.show('warning', 'Atenção', 'Nenhuma atividade foi marcada para salvar!');
        return;
    }
    
    // Calcular datas da semana selecionada
    const hoje = new Date();
    const diasOffset = (semanaSelecionada - 1) * 7;
    const fimSemana = new Date(hoje);
    fimSemana.setDate(fimSemana.getDate() - diasOffset);
    const inicioSemana = new Date(fimSemana);
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    
    const dataInicioStr = inicioSemana.toISOString().split('T')[0];
    const dataFimStr = fimSemana.toISOString().split('T')[0];
    const dataSalvamento = new Date().toISOString().split('T')[0];
    
    let totalSalvos = 0;
    
    // Processar cada colaborador do registro temporário
    Object.keys(this.vpoRegistroTemporario).forEach(colaboradorId => {
        const colabDados = this.vpoRegistroTemporario[colaboradorId];
        const colaborador = this.storage.getModule('qlp').find(c => c.id === colaboradorId);
        
        if (!colaborador) return;
        
        // Verificar se já existe registro para este colaborador nesta semana EM vpoSemanal
        const registros = this.storage.getModule('vpoSemanal');
        let registroExistente = registros.find(r => 
            r.colaboradorId === colaboradorId && 
            r.semana === semanaSelecionada
        );
        
        const atividades = this.getAtividadesPorFuncao(colaborador.funcao);
        
        // Criar ou atualizar registro
        if (!registroExistente) {
            // Criar novo registro
            const novoRegistro = {
                colaboradorId: colaboradorId,
                colaboradorNome: colaborador.nome,
                colaboradorFuncao: colaborador.funcao,
                semana: semanaSelecionada,
                dataInicio: dataInicioStr,
                dataFim: dataFimStr,
                dataSalvamento: dataSalvamento
            };
            
            // Adicionar atividades
            let concluidas = 0;
            atividades.forEach(ativ => {
                novoRegistro[ativ.id] = colabDados[ativ.id] || false;
                novoRegistro[ativ.id + 'Hora'] = colabDados[ativ.id + 'Hora'] || '';
                if (colabDados[ativ.id]) concluidas++;
            });
            
            // Calcular estatísticas
            novoRegistro.totalAtividades = atividades.length;
            novoRegistro.atividadesConcluidas = concluidas;
            novoRegistro.percentualConclusao = (concluidas / atividades.length) * 100;
            novoRegistro.status = novoRegistro.percentualConclusao >= 95 ? 'Completo' : 
                                 novoRegistro.percentualConclusao >= 80 ? 'Bom' :
                                 novoRegistro.percentualConclusao >= 50 ? 'Parcial' : 'Crítico';
            
            this.storage.addItem('vpoSemanal', novoRegistro);
            totalSalvos++;
        } else {
            // Atualizar registro existente
            let concluidas = 0;
            atividades.forEach(ativ => {
                registroExistente[ativ.id] = colabDados[ativ.id] || false;
                registroExistente[ativ.id + 'Hora'] = colabDados[ativ.id + 'Hora'] || '';
                if (colabDados[ativ.id]) concluidas++;
            });
            
            // Atualizar data de salvamento
            registroExistente.dataSalvamento = dataSalvamento;
            
            // Recalcular estatísticas
            registroExistente.atividadesConcluidas = concluidas;
            registroExistente.percentualConclusao = (concluidas / atividades.length) * 100;
            registroExistente.status = registroExistente.percentualConclusao >= 95 ? 'Completo' : 
                                       registroExistente.percentualConclusao >= 80 ? 'Bom' :
                                       registroExistente.percentualConclusao >= 50 ? 'Parcial' : 'Crítico';
            
            this.storage.updateItem('vpoSemanal', registroExistente.id, registroExistente);
            totalSalvos++;
        }
    });
    
    // Limpar registro temporário
    this.vpoRegistroTemporario = {};
    
    // Ocultar indicador de alterações não salvas
    const warning = document.getElementById('vpoUnsavedWarning');
    if (warning) warning.style.display = 'none';
    
    // Atualizar interface
    this.renderVPO();
    
    // Notificação de sucesso
    this.notification.show('success', '💾 Salvo com Sucesso!', 
        `${totalSalvos} registro(s) salvo(s) para a Semana ${semanaSelecionada}!`);
};

// Atualizar informação da semana selecionada
AppManager.prototype.atualizarInfoSemanaVPO = function() {
    const semanaSelecionada = parseInt(document.getElementById('vpoSemanaSelecionada').value);
    const infoSpan = document.getElementById('vpoInfoSemana');
    
    if (!infoSpan) return;
    
    // Calcular datas da semana
    const hoje = new Date();
    const diasOffset = (semanaSelecionada - 1) * 7;
    const fimSemana = new Date(hoje);
    fimSemana.setDate(fimSemana.getDate() - diasOffset);
    const inicioSemana = new Date(fimSemana);
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    
    const inicioFormatado = inicioSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const fimFormatado = fimSemana.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    infoSpan.textContent = `(${inicioFormatado} - ${fimFormatado})`;
};

// ============================================
// ANÁLISE SEMANAL VPO
// ============================================

// Calcular análise semanal
AppManager.prototype.calcularAnaliseVPOSemanal = function() {
    const hoje = new Date();
    const diasSemana = 7;
    const registros = this.storage.getModule('vpo');
    const colaboradores = this.storage.getModule('qlp').filter(c => c.status === 'Ativo');
    
    const resultado = {
        semanaAtual: this.getNumeroSemana(hoje),
        ano: hoje.getFullYear(),
        dataInicio: null,
        dataFim: null,
        colaboradores: [],
        mediaGeral: 0,
        totalAtividades: 0,
        atividadesConcluidas: 0,
        diasTrabalhados: 0
    };
    
    // Calcular início e fim da semana (últimos 7 dias)
    const dataFim = new Date(hoje);
    const dataInicio = new Date(hoje);
    dataInicio.setDate(dataInicio.getDate() - 6);
    
    resultado.dataInicio = dataInicio.toISOString().split('T')[0];
    resultado.dataFim = dataFim.toISOString().split('T')[0];
    
    // Análise por colaborador
    colaboradores.forEach(colab => {
        const atividades = this.getAtividadesPorFuncao(colab.funcao);
        const registrosColab = registros.filter(r => 
            r.colaboradorId === colab.id && 
            r.data >= resultado.dataInicio && 
            r.data <= resultado.dataFim
        );
        
        let totalPossivel = 0;
        let totalConcluidas = 0;
        const diasComRegistro = new Set();
        
        registrosColab.forEach(reg => {
            diasComRegistro.add(reg.data);
            totalPossivel += atividades.length;
            totalConcluidas += reg.atividadesConcluidas || 0;
        });
        
        const percentualSemanal = totalPossivel > 0 ? (totalConcluidas / totalPossivel) * 100 : 0;
        
        resultado.colaboradores.push({
            id: colab.id,
            nome: colab.nome,
            funcao: colab.funcao,
            diasTrabalhados: diasComRegistro.size,
            totalAtividades: totalPossivel,
            atividadesConcluidas: totalConcluidas,
            percentual: percentualSemanal,
            status: percentualSemanal >= 95 ? 'Excelente' : 
                    percentualSemanal >= 80 ? 'Bom' : 
                    percentualSemanal >= 60 ? 'Regular' : 'Crítico'
        });
        
        resultado.totalAtividades += totalPossivel;
        resultado.atividadesConcluidas += totalConcluidas;
    });
    
    resultado.mediaGeral = resultado.totalAtividades > 0 ? 
        (resultado.atividadesConcluidas / resultado.totalAtividades) * 100 : 0;
    
    // Contar dias únicos trabalhados
    const diasUnicos = new Set();
    registros.forEach(r => {
        if (r.data >= resultado.dataInicio && r.data <= resultado.dataFim) {
            diasUnicos.add(r.data);
        }
    });
    resultado.diasTrabalhados = diasUnicos.size;
    
    return resultado;
};

// Obter número da semana no ano
AppManager.prototype.getNumeroSemana = function(data) {
    const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// ============================================
// GRÁFICO DE DESEMPENHO INDIVIDUAL
// ============================================

// Renderizar gráfico de desempenho individual (compacto)
AppManager.prototype.renderVPOGraficoIndividual = function() {
    const canvasId = 'chartVPOIndividual';
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) return;
    
    // Destruir gráfico anterior
    if (this.chartVPOIndividual) {
        this.chartVPOIndividual.destroy();
    }
    
    const analise = this.calcularAnaliseVPOSemanal();
    
    // Ordenar por percentual (maior para menor)
    const colaboradores = analise.colaboradores.sort((a, b) => b.percentual - a.percentual);
    
    const labels = colaboradores.map(c => c.nome.split(' ')[0]); // Apenas primeiro nome
    const data = colaboradores.map(c => c.percentual);
    const cores = colaboradores.map(c => {
        if (c.percentual >= 95) return 'rgba(16, 185, 129, 0.8)'; // Verde
        if (c.percentual >= 80) return 'rgba(59, 130, 246, 0.8)'; // Azul
        if (c.percentual >= 60) return 'rgba(245, 158, 11, 0.8)'; // Amarelo
        return 'rgba(239, 68, 68, 0.8)'; // Vermelho
    });
    
    this.chartVPOIndividual = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Conformidade Semanal (%)',
                data: data,
                backgroundColor: cores,
                borderColor: cores.map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const colab = colaboradores[context.dataIndex];
                            return [
                                `Conformidade: ${colab.percentual.toFixed(1)}%`,
                                `Concluídas: ${colab.atividadesConcluidas}/${colab.totalAtividades}`,
                                `Dias: ${colab.diasTrabalhados}`,
                                `Status: ${colab.status}`
                            ];
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { size: 11, weight: '500' },
                        maxRotation: 0,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
};

// ============================================
// FILTROS AVANÇADOS VPO
// ============================================

// Variáveis globais de filtro
AppManager.prototype.vpoFiltrosAtivos = {
    data: '',
    turno: '',
    colaborador: '',
    status: ''
};

// Toggle painel de filtros
AppManager.prototype.toggleFiltrosVPO = function() {
    const painel = document.getElementById('vpoPainelFiltros');
    if (painel.style.display === 'none' || painel.style.display === '') {
        painel.style.display = 'block';
        this.carregarOpcoesColaboradores();
        this.preencherFiltrosAtuais();
    } else {
        painel.style.display = 'none';
    }
};

// Carregar opções de colaboradores no filtro
AppManager.prototype.carregarOpcoesColaboradores = function() {
    const select = document.getElementById('vpoFiltroColaborador');
    if (!select) return;
    
    const colaboradores = this.storage.getModule('qlp').filter(c => c.status === 'Ativo');
    
    // Limpar e reconstruir
    select.innerHTML = '<option value="">Todos</option>';
    colaboradores.forEach(colab => {
        const option = document.createElement('option');
        option.value = colab.id;
        option.textContent = colab.nome;
        select.appendChild(option);
    });
};

// Preencher filtros com valores atuais
AppManager.prototype.preencherFiltrosAtuais = function() {
    document.getElementById('vpoFiltroData').value = this.vpoFiltrosAtivos.data || '';
    document.getElementById('vpoFiltroTurno').value = this.vpoFiltrosAtivos.turno || '';
    document.getElementById('vpoFiltroColaborador').value = this.vpoFiltrosAtivos.colaborador || '';
    document.getElementById('vpoFiltroStatus').value = this.vpoFiltrosAtivos.status || '';
};

// Aplicar filtros avançados
AppManager.prototype.aplicarFiltrosVPO = function() {
    // Ler valores dos filtros
    this.vpoFiltrosAtivos.data = document.getElementById('vpoFiltroData').value;
    this.vpoFiltrosAtivos.turno = document.getElementById('vpoFiltroTurno').value;
    this.vpoFiltrosAtivos.colaborador = document.getElementById('vpoFiltroColaborador').value;
    this.vpoFiltrosAtivos.status = document.getElementById('vpoFiltroStatus').value;
    
    // Atualizar indicador de filtros ativos
    this.atualizarIndicadorFiltros();
    
    // Re-renderizar VPO com filtros
    this.renderVPO();
    
    // Fechar painel de filtros
    document.getElementById('vpoPainelFiltros').style.display = 'none';
    
    // Notificação
    this.notification.show('success', 'Filtros Aplicados', 'VPO atualizado com os filtros selecionados!');
};

// Limpar todos os filtros
AppManager.prototype.limparFiltrosVPO = function() {
    this.vpoFiltrosAtivos = {
        data: '',
        turno: '',
        colaborador: '',
        status: ''
    };
    
    // Limpar campos
    document.getElementById('vpoFiltroData').value = '';
    document.getElementById('vpoFiltroTurno').value = '';
    document.getElementById('vpoFiltroColaborador').value = '';
    document.getElementById('vpoFiltroStatus').value = '';
    
    // Atualizar indicador
    this.atualizarIndicadorFiltros();
    
    // Re-renderizar
    this.renderVPO();
    
    // Notificação
    this.notification.show('info', 'Filtros Limpos', 'Todos os filtros foram removidos!');
};

// Atualizar indicador de filtros ativos
AppManager.prototype.atualizarIndicadorFiltros = function() {
    const indicador = document.getElementById('vpoFiltrosAtivos');
    if (!indicador) return;
    
    const filtrosAtivos = [];
    
    if (this.vpoFiltrosAtivos.data) {
        const dataFormatada = new Date(this.vpoFiltrosAtivos.data + 'T00:00:00').toLocaleDateString('pt-BR');
        filtrosAtivos.push(`Data: ${dataFormatada}`);
    }
    
    if (this.vpoFiltrosAtivos.turno) {
        filtrosAtivos.push(`Turno: ${this.vpoFiltrosAtivos.turno}º`);
    }
    
    if (this.vpoFiltrosAtivos.colaborador) {
        const colab = this.storage.getModule('qlp').find(c => c.id === this.vpoFiltrosAtivos.colaborador);
        if (colab) {
            filtrosAtivos.push(`Colaborador: ${colab.nome.split(' ')[0]}`);
        }
    }
    
    if (this.vpoFiltrosAtivos.status) {
        filtrosAtivos.push(`Status: ${this.vpoFiltrosAtivos.status}`);
    }
    
    if (filtrosAtivos.length > 0) {
        indicador.textContent = filtrosAtivos.join(' • ');
        indicador.style.color = '#3b82f6';
        indicador.style.fontWeight = '600';
    } else {
        indicador.textContent = 'Nenhum filtro ativo';
        indicador.style.color = 'var(--text-secondary)';
        indicador.style.fontWeight = 'normal';
    }
};

// ============================================
// GRÁFICO COM FILTRO DE PERÍODO
// ============================================

// Atualizar gráfico com período selecionado
AppManager.prototype.atualizarGraficoVPOPeriodo = function() {
    const periodo = parseInt(document.getElementById('vpoPeriodoGrafico').value) || 7;
    this.renderVPOGraficoIndividual(periodo);
};

// Renderizar gráfico de desempenho individual com período customizável
AppManager.prototype.renderVPOGraficoIndividual = function(diasPeriodo = 7) {
    const canvasId = 'chartVPOIndividual';
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) return;
    
    // Destruir gráfico anterior
    if (this.chartVPOIndividual) {
        this.chartVPOIndividual.destroy();
    }
    
    const analise = this.calcularAnaliseVPOPeriodo(diasPeriodo);
    
    // Ordenar por percentual (maior para menor)
    const colaboradores = analise.colaboradores.sort((a, b) => b.percentual - a.percentual);
    
    const labels = colaboradores.map(c => c.nome.split(' ')[0]); // Apenas primeiro nome
    const data = colaboradores.map(c => c.percentual);
    const cores = colaboradores.map(c => {
        if (c.percentual >= 95) return 'rgba(16, 185, 129, 0.8)'; // Verde
        if (c.percentual >= 80) return 'rgba(59, 130, 246, 0.8)'; // Azul
        if (c.percentual >= 60) return 'rgba(245, 158, 11, 0.8)'; // Amarelo
        return 'rgba(239, 68, 68, 0.8)'; // Vermelho
    });
    
    this.chartVPOIndividual = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Conformidade (${diasPeriodo} dias) %`,
                data: data,
                backgroundColor: cores,
                borderColor: cores.map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const colab = colaboradores[context.dataIndex];
                            return [
                                `Conformidade: ${colab.percentual.toFixed(1)}%`,
                                `Concluídas: ${colab.atividadesConcluidas}/${colab.totalAtividades}`,
                                `Dias: ${colab.diasTrabalhados}`,
                                `Status: ${colab.status}`
                            ];
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { size: 11, weight: '500' },
                        maxRotation: 0,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
};

// Calcular análise VPO com período customizável
AppManager.prototype.calcularAnaliseVPOPeriodo = function(diasPeriodo = 7) {
    const hoje = new Date();
    const registros = this.storage.getModule('vpo');
    const colaboradores = this.storage.getModule('qlp').filter(c => c.status === 'Ativo');
    
    const resultado = {
        diasPeriodo: diasPeriodo,
        dataInicio: null,
        dataFim: null,
        colaboradores: [],
        mediaGeral: 0,
        totalAtividades: 0,
        atividadesConcluidas: 0,
        diasTrabalhados: 0
    };
    
    // Calcular início e fim do período
    const dataFim = new Date(hoje);
    const dataInicio = new Date(hoje);
    dataInicio.setDate(dataInicio.getDate() - (diasPeriodo - 1));
    
    resultado.dataInicio = dataInicio.toISOString().split('T')[0];
    resultado.dataFim = dataFim.toISOString().split('T')[0];
    
    // Análise por colaborador
    colaboradores.forEach(colab => {
        const atividades = this.getAtividadesPorFuncao(colab.funcao);
        const registrosColab = registros.filter(r => 
            r.colaboradorId === colab.id && 
            r.data >= resultado.dataInicio && 
            r.data <= resultado.dataFim
        );
        
        let totalPossivel = 0;
        let totalConcluidas = 0;
        const diasComRegistro = new Set();
        
        registrosColab.forEach(reg => {
            diasComRegistro.add(reg.data);
            totalPossivel += atividades.length;
            totalConcluidas += reg.atividadesConcluidas || 0;
        });
        
        const percentualPeriodo = totalPossivel > 0 ? (totalConcluidas / totalPossivel) * 100 : 0;
        
        resultado.colaboradores.push({
            id: colab.id,
            nome: colab.nome,
            funcao: colab.funcao,
            diasTrabalhados: diasComRegistro.size,
            totalAtividades: totalPossivel,
            atividadesConcluidas: totalConcluidas,
            percentual: percentualPeriodo,
            status: percentualPeriodo >= 95 ? 'Excelente' : 
                    percentualPeriodo >= 80 ? 'Bom' : 
                    percentualPeriodo >= 60 ? 'Regular' : 'Crítico'
        });
        
        resultado.totalAtividades += totalPossivel;
        resultado.atividadesConcluidas += totalConcluidas;
    });
    
    resultado.mediaGeral = resultado.totalAtividades > 0 ? 
        (resultado.atividadesConcluidas / resultado.totalAtividades) * 100 : 0;
    
    // Contar dias únicos trabalhados
    const diasUnicos = new Set();
    registros.forEach(r => {
        if (r.data >= resultado.dataInicio && r.data <= resultado.dataFim) {
            diasUnicos.add(r.data);
        }
    });
    resultado.diasTrabalhados = diasUnicos.size;
    
    return resultado;
};

// ============================================
// TABELAS SEMANAIS (4 SEMANAS) - REMOVIDO
// ============================================

/*
// Renderizar tabelas semanais
AppManager.prototype.renderTabelasSemanais = function() {
    const container = document.getElementById('vpoTabelasSemanais');
    if (!container) return;
    
    const hoje = new Date();
    const semanas = [];
    
    // Gerar 4 semanas
    for (let i = 0; i < 4; i++) {
        const fimSemana = new Date(hoje);
        fimSemana.setDate(fimSemana.getDate() - (i * 7));
        
        const inicioSemana = new Date(fimSemana);
        inicioSemana.setDate(inicioSemana.getDate() - 6);
        
        semanas.push({
            numero: 4 - i,
            inicio: inicioSemana,
            fim: fimSemana,
            dados: this.calcularDadosSemana(inicioSemana, fimSemana)
        });
    }
    
    // Renderizar tabelas
    container.innerHTML = semanas.map(semana => this.renderTabelaSemana(semana)).join('');
};

// Calcular dados de uma semana
AppManager.prototype.calcularDadosSemana = function(dataInicio, dataFim) {
    const registrosSemanais = this.storage.getModule('vpoSemanal');
    const registrosDiarios = this.storage.getModule('vpo');
    const colaboradores = this.storage.getModule('qlp').filter(c => c.status === 'Ativo');
    
    const inicioStr = dataInicio.toISOString().split('T')[0];
    const fimStr = dataFim.toISOString().split('T')[0];
    
    const hoje = new Date();
    const diffTime = Math.abs(hoje - dataFim);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const numeroSemana = Math.floor(diffDays / 7) + 1;
    
    const resultado = {
        colaboradores: [],
        totalAtividades: 0,
        atividadesConcluidas: 0,
        conformidade: 0
    };
    
    colaboradores.forEach(colab => {
        const atividades = this.getAtividadesPorFuncao(colab.funcao);
        
        const registroSalvo = registrosSemanais.find(r => 
            r.colaboradorId === colab.id && 
            r.semana === numeroSemana
        );
        
        let totalPossivel = atividades.length;
        let totalConcluidas = 0;
        
        if (registroSalvo) {
            totalConcluidas = registroSalvo.atividadesConcluidas || 0;
        } else {
            const registrosColab = registrosDiarios.filter(r => 
                r.colaboradorId === colab.id && 
                r.data >= inicioStr && 
                r.data <= fimStr &&
                !r.semana
            );
            
            registrosColab.forEach(reg => {
                totalConcluidas += reg.atividadesConcluidas || 0;
            });
            
            if (registrosColab.length > 0) {
                totalPossivel = atividades.length;
            }
        }
        
        const percentual = totalPossivel > 0 ? (totalConcluidas / totalPossivel) * 100 : 0;
        
        resultado.colaboradores.push({
            nome: colab.nome,
            funcao: colab.funcao,
            concluidas: totalConcluidas,
            total: totalPossivel,
            percentual: percentual,
            comRegistroSalvo: !!registroSalvo
        });
        
        resultado.totalAtividades += totalPossivel;
        resultado.atividadesConcluidas += totalConcluidas;
    });
    
    resultado.conformidade = resultado.totalAtividades > 0 ? 
        (resultado.atividadesConcluidas / resultado.totalAtividades) * 100 : 0;
    
    return resultado;
};

// Renderizar tabela de uma semana
AppManager.prototype.renderTabelaSemana = function(semana) {
    const inicioFormatado = semana.inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const fimFormatado = semana.fim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    const corConformidade = semana.dados.conformidade >= 95 ? '#10b981' : 
                            semana.dados.conformidade >= 80 ? '#3b82f6' : 
                            semana.dados.conformidade >= 60 ? '#f59e0b' : '#ef4444';
    
    return `
        <div style="background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid var(--border-color); padding: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h5 style="color: var(--text-primary); margin: 0; font-size: 14px; font-weight: 600;">
                    📅 Semana ${semana.numero}
                </h5>
                <span style="color: var(--text-secondary); font-size: 12px;">
                    ${inicioFormatado} - ${fimFormatado}
                </span>
            </div>
            
            <div style="background: rgba(59, 130, 246, 0.1); padding: 10px; border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-secondary); font-size: 12px; font-weight: 500;">
                    Conformidade Geral
                </span>
                <span style="color: ${corConformidade}; font-size: 16px; font-weight: 700;">
                    ${semana.dados.conformidade.toFixed(1)}%
                </span>
            </div>
            
            <div style="max-height: 180px; overflow-y: auto;">
                <table style="width: 100%; font-size: 12px;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <th style="text-align: left; padding: 6px 4px; color: var(--text-secondary); font-weight: 600;">Colaborador</th>
                            <th style="text-align: center; padding: 6px 4px; color: var(--text-secondary); font-weight: 600;">Atividades</th>
                            <th style="text-align: right; padding: 6px 4px; color: var(--text-secondary); font-weight: 600;">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${semana.dados.colaboradores.map(colab => {
                            const cor = colab.percentual >= 95 ? '#10b981' : 
                                       colab.percentual >= 80 ? '#3b82f6' : 
                                       colab.percentual >= 60 ? '#f59e0b' : '#ef4444';
                            const icone = colab.comRegistroSalvo ? '💾' : '📊';
                            const tooltip = colab.comRegistroSalvo ? 'Registro salvo manualmente' : 'Dados calculados automaticamente';
                            return `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <td style="padding: 6px 4px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;" title="${tooltip}">
                                        <span style="font-size: 12px;">${icone}</span>
                                        ${colab.nome.split(' ')[0]}
                                    </td>
                                    <td style="padding: 6px 4px; text-align: center; color: var(--text-secondary); font-size: 11px;">
                                        ${colab.concluidas}/${colab.total}
                                    </td>
                                    <td style="padding: 6px 4px; text-align: right; color: ${cor}; font-weight: 600;">
                                        ${colab.percentual.toFixed(0)}%
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary);">
                <span>Total: ${semana.dados.atividadesConcluidas}/${semana.dados.totalAtividades}</span>
                <span>${semana.dados.colaboradores.length} colaboradores</span>
            </div>
        </div>
    `;
};

// Atualizar tabelas semanais
AppManager.prototype.atualizarTabelasSemanais = function() {
    this.renderTabelasSemanais();
    this.notification.show('success', 'Atualizado', 'Tabelas semanais atualizadas!');
};
*/

// ============================================
// SALVAR REGISTROS POR SEMANA
// ============================================

// Obter datas da semana selecionada
AppManager.prototype.getDatasSemanaSelecionada = function(numeroSemana) {
    const hoje = new Date();
    
    // Calcular semana baseado no número (1 = atual, 2 = semana passada, etc.)
    const fimSemana = new Date(hoje);
    fimSemana.setDate(fimSemana.getDate() - ((numeroSemana - 1) * 7));
    
    const inicioSemana = new Date(fimSemana);
    inicioSemana.setDate(inicioSemana.getDate() - 6);
    
    return {
        inicio: inicioSemana,
        fim: fimSemana,
        inicioStr: inicioSemana.toISOString().split('T')[0],
        fimStr: fimSemana.toISOString().split('T')[0]
    };
};

// Atualizar informação da semana selecionada
AppManager.prototype.atualizarInfoSemana = function() {
    const select = document.getElementById('vpoSemanaSelecionada');
    const info = document.getElementById('vpoInfoSemana');
    
    if (!select || !info) return;
    
    const numeroSemana = parseInt(select.value);
    const datas = this.getDatasSemanaSelecionada(numeroSemana);
    
    const inicioFormatado = datas.inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const fimFormatado = datas.fim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    
    info.textContent = `${inicioFormatado} a ${fimFormatado}`;
};

// Inicializar eventos da semana
AppManager.prototype.inicializarEventosSemanasVPO = function() {
    const select = document.getElementById('vpoSemanaSelecionada');
    if (select) {
        // Atualizar info ao mudar semana
        select.addEventListener('change', () => {
            this.atualizarInfoSemana();
        });
        
        // Atualizar info inicial
        this.atualizarInfoSemana();
    }
};

