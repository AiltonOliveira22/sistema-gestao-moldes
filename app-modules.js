// Continuação dos métodos do AppManager

// Itens Críticos
AppManager.prototype.showItemCriticoForm = function(item = null) {
    const content = `
        <form id="itemCriticoForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Código *</label>
                    <input type="text" name="codigo" value="${item && item.codigo || ''}" required>
                </div>
                <div class="form-group">
                    <label>Descrição *</label>
                    <input type="text" name="descricao" value="${item && item.descricao || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Quantidade *</label>
                    <input type="number" name="quantidade" value="${item && item.quantidade || ''}" required min="0" step="1">
                </div>
                <div class="form-group">
                    <label>Unidade *</label>
                    <select name="unidade" required>
                        <option value="UN" ${item && item.unidade === 'UN' ? 'selected' : ''}>UN</option>
                        <option value="KG" ${item && item.unidade === 'KG' ? 'selected' : ''}>KG</option>
                        <option value="L" ${item && item.unidade === 'L' ? 'selected' : ''}>L</option>
                        <option value="M" ${item && item.unidade === 'M' ? 'selected' : ''}>M</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Estoque Mínimo *</label>
                    <input type="number" name="estoqueMinimo" value="${item && item.estoqueMinimo || ''}" required min="0" step="1">
                </div>
                <div class="form-group">
                    <label>Consumo Mensal *</label>
                    <input type="number" name="consumoMensal" value="${item && item.consumoMensal || ''}" required min="0" step="0.01" placeholder="Ex: 15.5">
                </div>
            </div>
            <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
                <div class="form-group">
                    <label>Lead Time (dias) *</label>
                    <input type="number" name="leadTime" value="${item && item.leadTime || ''}" required min="0" step="1" placeholder="Ex: 15">
                </div>
                <div class="form-group">
                    <label>Tempo Estoque (dias)</label>
                    <input type="number" name="tempoEstoque" value="${item && item.tempoEstoque || ''}" readonly style="background: #f1f5f9; cursor: not-allowed;" placeholder="Calculado auto.">
                </div>
                <div class="form-group">
                    <label>Localização *</label>
                    <input type="text" name="localizacao" value="${item && item.localizacao || ''}" required placeholder="Ex: Prateleira A3">
                </div>
            </div>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 10px;">
                <strong style="color: #2563eb;">ℹ️ Tempo de Estoque</strong>
                <p style="margin: 5px 0 0 0; color: #475569; font-size: 13px;">
                    Calculado automaticamente: <strong>Quantidade / Consumo Mensal × 30 dias</strong>
                </p>
            </div>
        </form>
    `;

    this.modal.show(item ? 'Editar Item' : 'Adicionar Item', content, () => {
        const form = document.getElementById('itemCriticoForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        const formData = new FormData(form);
        const quantidade = parseInt(formData.get('quantidade'));
        const consumoMensal = parseFloat(formData.get('consumoMensal'));
        const leadTime = parseInt(formData.get('leadTime'));
        
        // Calcular Tempo de Estoque: Quantidade / Consumo Mensal × 30
        const tempoEstoque = consumoMensal > 0 ? Math.round((quantidade / consumoMensal) * 30) : 0;
        
        const data = {
            codigo: formData.get('codigo'),
            descricao: formData.get('descricao'),
            quantidade: quantidade,
            unidade: formData.get('unidade'),
            estoqueMinimo: parseInt(formData.get('estoqueMinimo')),
            consumoMensal: consumoMensal,
            leadTime: leadTime,
            tempoEstoque: tempoEstoque,
            localizacao: formData.get('localizacao')
        };

        if (item) {
            this.storage.updateItem('itensCriticos', item.id, data);
            this.notification.show('success', 'Sucesso', 'Item atualizado com sucesso!');
        } else {
            this.storage.addItem('itensCriticos', data);
            this.notification.show('success', 'Sucesso', 'Item adicionado com sucesso!');
        }

        this.renderItensCriticos();
        this.renderItensCriticosDashboard();
        this.updateDashboard();
        return true;
    });
};

AppManager.prototype.renderItensCriticos = function() {
    const items = this.storage.getModule('itensCriticos');
    const tbody = document.getElementById('itensCriticosTable');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="empty-message">Nenhum item cadastrado</td></tr>';
        this.renderItensCriticosDashboard();
        return;
    }

    tbody.innerHTML = items.map(item => {
        const status = item.quantidade <= item.estoqueMinimo ? 'Crítico' : 
                      item.quantidade <= item.estoqueMinimo * 1.5 ? 'Baixo' : 'Normal';
        const statusClass = status === 'Normal' ? 'success' : status === 'Baixo' ? 'warning' : 'danger';
        
        // Badge de alerta para tempo de estoque baixo
        let badgeTempoEstoque = '';
        const tempoEstoque = item.tempoEstoque || 0;
        const leadTime = item.leadTime || 0;
        
        if (tempoEstoque < leadTime) {
            badgeTempoEstoque = `<span style="color: #ef4444; font-weight: bold;">${tempoEstoque} ⚠️</span>`;
        } else if (tempoEstoque < leadTime * 2) {
            badgeTempoEstoque = `<span style="color: #f59e0b; font-weight: bold;">${tempoEstoque} ⚡</span>`;
        } else {
            badgeTempoEstoque = `<span style="color: #10b981;">${tempoEstoque}</span>`;
        }
        
        return `
            <tr>
                <td><strong>${item.codigo}</strong></td>
                <td>${item.descricao}</td>
                <td style="text-align: center;"><strong>${item.quantidade}</strong></td>
                <td>${item.unidade}</td>
                <td style="text-align: center;">${item.estoqueMinimo}</td>
                <td style="text-align: center;">${item.consumoMensal || 0}</td>
                <td style="text-align: center;">${item.leadTime || 0}</td>
                <td style="text-align: center;">${badgeTempoEstoque}</td>
                <td>${item.localizacao}</td>
                <td><span class="badge badge-${statusClass}">${status}</span></td>
                <td style="white-space: nowrap;">
                    <button class="btn btn-sm btn-primary" onclick="window.app.editItemCritico('${item.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteItemCritico('${item.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    this.renderItensCriticosDashboard();
};

AppManager.prototype.renderItensCriticosDashboard = function() {
    const items = this.storage.getModule('itensCriticos');
    
    // Calcular KPIs
    const totalItens = items.length;
    const itensAlerta = items.filter(i => i.quantidade <= i.estoqueMinimo * 1.5).length;
    const itensNormais = items.filter(i => i.quantidade > i.estoqueMinimo * 1.5).length;
    const consumoMedio = items.length > 0 
        ? Math.round(items.reduce((sum, i) => sum + (parseFloat(i.consumoMensal) || 0), 0) / items.length)
        : 0;
    
    // Novos KPIs: Lead Time Médio e Tempo Estoque Médio
    const leadTimeTotal = items.reduce((sum, i) => sum + (parseInt(i.leadTime) || 0), 0);
    const leadTimeMedio = items.length > 0 ? Math.round(leadTimeTotal / items.length) : 0;
    
    const tempoEstoqueTotal = items.reduce((sum, i) => sum + (parseInt(i.tempoEstoque) || 0), 0);
    const tempoEstoqueMedio = items.length > 0 ? Math.round(tempoEstoqueTotal / items.length) : 0;
    
    // Atualizar KPIs
    document.getElementById('totalItensIC').textContent = totalItens;
    document.getElementById('itensAlertaIC').textContent = itensAlerta;
    document.getElementById('itensNormaisIC').textContent = itensNormais;
    document.getElementById('consumoMedioIC').textContent = consumoMedio + ' un';
    document.getElementById('leadTimeMedioIC').textContent = leadTimeMedio + 'd';
    document.getElementById('tempoEstoqueMedioIC').textContent = tempoEstoqueMedio + 'd';
    
    if (items.length === 0) return;
    
    // Gráfico 1: Status dos Itens (Doughnut)
    const canvasStatus = document.getElementById('chartStatusItensIC');
    if (canvasStatus) {
        const ctxStatus = canvasStatus.getContext('2d');
        if (this.chartStatusItensIC) this.chartStatusItensIC.destroy();
        
        const criticos = items.filter(i => i.quantidade <= i.estoqueMinimo).length;
        const baixos = items.filter(i => i.quantidade > i.estoqueMinimo && i.quantidade <= i.estoqueMinimo * 1.5).length;
        const normais = items.filter(i => i.quantidade > i.estoqueMinimo * 1.5).length;
        
        this.chartStatusItensIC = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Crítico', 'Baixo', 'Normal'],
                datasets: [{
                    data: [criticos, baixos, normais],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderColor: '#1e293b',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        display: true, 
                        position: 'bottom',
                        labels: { color: '#e2e8f0', font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico 2: Itens por Localização (Bar)
    const canvasLoc = document.getElementById('chartLocalizacaoIC');
    if (canvasLoc) {
        const ctxLoc = canvasLoc.getContext('2d');
        if (this.chartLocalizacaoIC) this.chartLocalizacaoIC.destroy();
        
        const localizacoes = {};
        items.forEach(item => {
            const loc = item.localizacao || 'Sem Localização';
            localizacoes[loc] = (localizacoes[loc] || 0) + 1;
        });
        
        const locLabels = Object.keys(localizacoes);
        const locValues = Object.values(localizacoes);
        
        this.chartLocalizacaoIC = new Chart(ctxLoc, {
            type: 'bar',
            data: {
                labels: locLabels,
                datasets: [{
                    label: 'Quantidade',
                    data: locValues,
                    backgroundColor: '#3b82f6',
                    borderColor: '#2563eb',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Itens: ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { color: '#94a3b8', stepSize: 1 },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: { 
                        ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 },
                        grid: { display: false }
                    }
                }
            }
        });
    }
};

AppManager.prototype.deleteItemCritico = function(id) {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        this.storage.deleteItem('itensCriticos', id);
        this.notification.show('success', 'Sucesso', 'Item excluído com sucesso!');
        this.renderItensCriticos();
    }
};

// Inventário de Moldes
AppManager.prototype.showInventarioMoldesForm = function(item = null) {
    const content = `
        <form id="inventarioForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Código *</label>
                    <input type="text" name="codigo" value="${item && item.codigo || ''}" required placeholder="Ex: MOL-001">
                </div>
                <div class="form-group">
                    <label>Tipo *</label>
                    <select name="tipo" required>
                        <option value="">Selecione...</option>
                        <option value="Set Moldes" ${item && item.tipo === 'Set Moldes' ? 'selected' : ''}>Set Moldes</option>
                        <option value="Coroas" ${item && item.tipo === 'Coroas' ? 'selected' : ''}>Coroas</option>
                        <option value="Punção" ${item && item.tipo === 'Punção' ? 'selected' : ''}>Punção</option>
                        <option value="Tubo Resfriador" ${item && item.tipo === 'Tubo Resfriador' ? 'selected' : ''}>Tubo Resfriador</option>
                        <option value="Garra de Bronze" ${item && item.tipo === 'Garra de Bronze' ? 'selected' : ''}>Garra de Bronze</option>
                        <option value="Garra de Grafite" ${item && item.tipo === 'Garra de Grafite' ? 'selected' : ''}>Garra de Grafite</option>
                        <option value="Grafite" ${item && item.tipo === 'Grafite' ? 'selected' : ''}>Grafite</option>
                        <option value="Postiço" ${item && item.tipo === 'Postiço' ? 'selected' : ''}>Postiço</option>
                        <option value="Fundo de Molde" ${item && item.tipo === 'Fundo de Molde' ? 'selected' : ''}>Fundo de Molde</option>
                        <option value="Anel Reserva" ${item && item.tipo === 'Anel Reserva' ? 'selected' : ''}>Anel Reserva</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Descrição *</label>
                <input type="text" name="descricao" value="${item && item.descricao || ''}" required placeholder="Descrição detalhada do item">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Quantidade *</label>
                    <input type="number" name="quantidade" value="${item && item.quantidade || ''}" required min="0" step="1">
                </div>
                <div class="form-group">
                    <label>Unidade *</label>
                    <select name="unidade" required>
                        <option value="un" ${item && item.unidade === 'un' ? 'selected' : ''}>Unidade (un)</option>
                        <option value="kg" ${item && item.unidade === 'kg' ? 'selected' : ''}>Quilograma (kg)</option>
                        <option value="m" ${item && item.unidade === 'm' ? 'selected' : ''}>Metro (m)</option>
                        <option value="cm" ${item && item.unidade === 'cm' ? 'selected' : ''}>Centímetro (cm)</option>
                        <option value="mm" ${item && item.unidade === 'mm' ? 'selected' : ''}>Milímetro (mm)</option>
                        <option value="jogo" ${item && item.unidade === 'jogo' ? 'selected' : ''}>Jogo</option>
                        <option value="conjunto" ${item && item.unidade === 'conjunto' ? 'selected' : ''}>Conjunto</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Localização *</label>
                    <input type="text" name="localizacao" value="${item && item.localizacao || ''}" required placeholder="Ex: Prateleira A3">
                </div>
                <div class="form-group">
                    <label>Fornecedor</label>
                    <input type="text" name="fornecedor" value="${item && item.fornecedor || ''}" placeholder="Nome do fornecedor">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Status *</label>
                    <select name="status" required>
                        <option value="Disponível" ${item && item.status === 'Disponível' ? 'selected' : ''}>Disponível</option>
                        <option value="Em Uso" ${item && item.status === 'Em Uso' ? 'selected' : ''}>Em Uso</option>
                        <option value="Manutenção" ${item && item.status === 'Manutenção' ? 'selected' : ''}>Manutenção</option>
                        <option value="Danificado" ${item && item.status === 'Danificado' ? 'selected' : ''}>Danificado</option>
                        <option value="Descartado" ${item && item.status === 'Descartado' ? 'selected' : ''}>Descartado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Data de Entrada *</label>
                    <input type="date" name="dataEntrada" value="${item && item.dataEntrada || ''}" required>
                </div>
            </div>
            <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
                <div class="form-group">
                    <label>Consumo Médio/Mês *</label>
                    <input type="number" name="consumoMedio" value="${item && item.consumoMedio || ''}" required min="0" step="0.01" placeholder="0">
                </div>
                <div class="form-group">
                    <label>Lead Time (dias) *</label>
                    <input type="number" name="leadTime" value="${item && item.leadTime || ''}" required min="0" step="1" placeholder="0">
                </div>
                <div class="form-group">
                    <label>Tempo Estoque (dias)</label>
                    <input type="number" name="tempoEstoque" value="${item && item.tempoEstoque || ''}" readonly style="background: #f1f5f9; cursor: not-allowed;" placeholder="Calculado auto.">
                </div>
            </div>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <strong style="color: #2563eb;">ℹ️ Tempo de Estoque</strong>
                <p style="margin: 5px 0 0 0; color: #475569; font-size: 13px;">
                    Calculado automaticamente: <strong>Quantidade / Consumo Médio</strong> (em dias)
                </p>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea name="observacoes" rows="3" placeholder="Observações adicionais...">${item && item.observacoes || ''}</textarea>
            </div>
        </form>
    `;

    this.modal.show(item ? 'Editar Item' : 'Adicionar Item ao Inventário', content, () => {
        const form = document.getElementById('inventarioForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        const formData = new FormData(form);
        const quantidade = parseFloat(formData.get('quantidade'));
        const consumoMedio = parseFloat(formData.get('consumoMedio'));
        
        // Calcular Tempo de Estoque: Quantidade / Consumo Médio (em dias)
        const tempoEstoque = consumoMedio > 0 ? Math.round((quantidade / consumoMedio) * 30) : 0;
        
        const data = {
            codigo: formData.get('codigo'),
            tipo: formData.get('tipo'),
            descricao: formData.get('descricao'),
            quantidade: quantidade,
            unidade: formData.get('unidade'),
            consumoMedio: consumoMedio,
            leadTime: parseInt(formData.get('leadTime')),
            tempoEstoque: tempoEstoque,
            localizacao: formData.get('localizacao'),
            fornecedor: formData.get('fornecedor'),
            status: formData.get('status'),
            dataEntrada: formData.get('dataEntrada'),
            observacoes: formData.get('observacoes')
        };

        if (item) {
            this.storage.updateItem('inventarioMoldes', item.id, data);
            this.notification.show('success', 'Sucesso', 'Item atualizado com sucesso!');
        } else {
            this.storage.addItem('inventarioMoldes', data);
            this.notification.show('success', 'Sucesso', 'Item adicionado ao inventário!');
        }

        this.renderInventarioMoldes();
        this.renderInventarioMoldesDashboard();
        this.updateDashboard();
        return true;
    });
};

AppManager.prototype.renderInventarioMoldes = function() {
    const items = this.storage.getModule('inventarioMoldes');
    const tbody = document.getElementById('inventarioTable');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="empty-message">Nenhum item cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => {
        // Badge de status
        const statusColors = {
            'Disponível': 'background: linear-gradient(135deg, #10b981, #059669); color: #fff;',
            'Em Uso': 'background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff;',
            'Manutenção': 'background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;',
            'Danificado': 'background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;',
            'Descartado': 'background: linear-gradient(135deg, #64748b, #475569); color: #fff;'
        };
        const badgeStatus = `<span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; ${statusColors[item.status] || 'background: #64748b; color: #fff;'}">${item.status}</span>`;
        
        // Badge de alerta para tempo de estoque baixo
        let badgeTempoEstoque = '';
        const tempoEstoque = item.tempoEstoque || 0;
        const leadTime = item.leadTime || 0;
        
        if (tempoEstoque < leadTime) {
            badgeTempoEstoque = `<span style="color: #ef4444; font-weight: bold;">${tempoEstoque} ⚠️</span>`;
        } else if (tempoEstoque < leadTime * 2) {
            badgeTempoEstoque = `<span style="color: #f59e0b; font-weight: bold;">${tempoEstoque} ⚡</span>`;
        } else {
            badgeTempoEstoque = `<span style="color: #10b981;">${tempoEstoque}</span>`;
        }
        
        return `
            <tr>
                <td><strong>${item.codigo}</strong></td>
                <td>${item.tipo}</td>
                <td>${item.descricao}</td>
                <td style="text-align: center;"><strong>${item.quantidade}</strong></td>
                <td>${item.unidade}</td>
                <td style="text-align: center;">${item.consumoMedio || 0}</td>
                <td style="text-align: center;">${item.leadTime || 0}</td>
                <td style="text-align: center;">${badgeTempoEstoque}</td>
                <td>${item.localizacao}</td>
                <td>${item.fornecedor || '-'}</td>
                <td>${badgeStatus}</td>
                <td>${this.formatDate(item.dataEntrada)}</td>
                <td style="white-space: nowrap;">
                    <button class="btn btn-sm btn-primary" onclick="window.app.editInventarioMoldes('${item.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteInventarioMoldes('${item.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};

AppManager.prototype.editInventarioMoldes = function(id) {
    const item = this.storage.getModule('inventarioMoldes').find(i => i.id === id);
    if (item) this.showInventarioMoldesForm(item);
};

AppManager.prototype.deleteInventarioMoldes = function(id) {
    if (confirm('Tem certeza que deseja excluir este item do inventário?')) {
        this.storage.deleteItem('inventarioMoldes', id);
        this.notification.show('success', 'Sucesso', 'Item excluído do inventário!');
        this.renderInventarioMoldes();
        this.renderInventarioMoldesDashboard();
        this.updateDashboard();
    }
};

// Dashboard de Inventário de Moldes
AppManager.prototype.renderInventarioMoldesDashboard = function() {
    const items = this.storage.getModule('inventarioMoldes');
    
    // Calcular KPIs
    const totalItens = items.length;
    const itensDisponiveis = items.filter(i => i.status === 'Disponível').length;
    const itensManutencao = items.filter(i => i.status === 'Manutenção' || i.status === 'Danificado').length;
    
    // Tipo mais comum
    const tipos = {};
    items.forEach(i => {
        tipos[i.tipo] = (tipos[i.tipo] || 0) + 1;
    });
    const tipoMaisComum = Object.keys(tipos).length > 0 
        ? Object.entries(tipos).sort((a, b) => b[1] - a[1])[0][0]
        : '-';
    
    // Novos KPIs: Consumo Médio, Lead Time Médio, Tempo de Estoque Médio
    const consumoTotal = items.reduce((sum, i) => sum + (parseFloat(i.consumoMedio) || 0), 0);
    const consumoMedioGeral = items.length > 0 ? (consumoTotal / items.length).toFixed(1) : 0;
    
    const leadTimeTotal = items.reduce((sum, i) => sum + (parseInt(i.leadTime) || 0), 0);
    const leadTimeMedio = items.length > 0 ? Math.round(leadTimeTotal / items.length) : 0;
    
    const tempoEstoqueTotal = items.reduce((sum, i) => sum + (parseInt(i.tempoEstoque) || 0), 0);
    const tempoEstoqueMedio = items.length > 0 ? Math.round(tempoEstoqueTotal / items.length) : 0;
    
    // Atualizar KPIs no HTML
    document.getElementById('totalItensInventario').textContent = totalItens;
    document.getElementById('itensDisponiveis').textContent = itensDisponiveis;
    document.getElementById('itensManutencao').textContent = itensManutencao;
    document.getElementById('tiposMaisComuns').textContent = tipoMaisComum;
    document.getElementById('consumoMedioGeral').textContent = consumoMedioGeral;
    document.getElementById('leadTimeMedio').textContent = leadTimeMedio + 'd';
    document.getElementById('tempoEstoqueMedio').textContent = tempoEstoqueMedio + 'd';
};

// Funcionários
// QLP
AppManager.prototype.showQlpForm = function(item = null) {
    const content = `
        <form id="qlpForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Matrícula *</label>
                    <input type="text" name="matricula" value="${item && item.matricula || ''}" required>
                </div>
                <div class="form-group">
                    <label>Nome *</label>
                    <input type="text" name="nome" value="${item && item.nome || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Função *</label>
                    <input type="text" name="funcao" value="${item && item.funcao || ''}" required placeholder="Ex: Técnico, Coordenador">
                </div>
                <div class="form-group">
                    <label>Data de Entrada *</label>
                    <input type="date" name="dataEntrada" value="${item && item.dataEntrada || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Rua</label>
                    <input type="text" name="rua" value="${item && item.rua || ''}" placeholder="Ex: Rua das Flores">
                </div>
                <div class="form-group">
                    <label>Número</label>
                    <input type="text" name="numero" value="${item && item.numero || ''}" placeholder="Ex: 123">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Bairro</label>
                    <input type="text" name="bairro" value="${item && item.bairro || ''}">
                </div>
                <div class="form-group">
                    <label>Cidade</label>
                    <input type="text" name="cidade" value="${item && item.cidade || ''}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Escolaridade *</label>
                    <select name="escolaridade" required>
                        <option value="">Selecione...</option>
                        <option value="Ensino Médio" ${item && item.escolaridade === 'Ensino Médio' ? 'selected' : ''}>Ensino Médio</option>
                        <option value="Técnico" ${item && item.escolaridade === 'Técnico' ? 'selected' : ''}>Técnico</option>
                        <option value="Graduação" ${item && item.escolaridade === 'Graduação' ? 'selected' : ''}>Graduação</option>
                        <option value="Pós" ${item && item.escolaridade === 'Pós' ? 'selected' : ''}>Pós</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Status *</label>
                    <select name="status" required>
                        <option value="Ativo" ${item && item.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                        <option value="Férias" ${item && item.status === 'Férias' ? 'selected' : ''}>Férias</option>
                        <option value="Afastado" ${item && item.status === 'Afastado' ? 'selected' : ''}>Afastado</option>
                        <option value="Inativo" ${item && item.status === 'Inativo' ? 'selected' : ''}>Inativo</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Informações</label>
                <textarea name="informacoes" rows="3" placeholder="Informações adicionais...">${item && item.informacoes || ''}</textarea>
            </div>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <strong style="color: #2563eb;">ℹ️ Tempo de Empresa será calculado automaticamente</strong>
                <p style="margin: 5px 0 0 0; color: #475569;">Baseado na Data de Entrada até a data atual</p>
            </div>
        </form>
    `;

    this.modal.show(item ? 'Editar QLP' : 'Adicionar QLP', content, () => {
        const form = document.getElementById('qlpForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        const formData = new FormData(form);
        const data = {
            matricula: formData.get('matricula'),
            nome: formData.get('nome'),
            funcao: formData.get('funcao'),
            dataEntrada: formData.get('dataEntrada'),
            rua: formData.get('rua'),
            numero: formData.get('numero'),
            bairro: formData.get('bairro'),
            cidade: formData.get('cidade'),
            escolaridade: formData.get('escolaridade'),
            informacoes: formData.get('informacoes'),
            status: formData.get('status')
        };

        if (item) {
            this.storage.updateItem('qlp', item.id, data);
            this.notification.show('success', 'Sucesso', 'QLP atualizado com sucesso!');
        } else {
            this.storage.addItem('qlp', data);
            this.notification.show('success', 'Sucesso', 'QLP adicionado com sucesso!');
        }

        this.renderQlp();
        this.updateDashboard();
        return true;
    });
};

AppManager.prototype.renderQlp = function() {
    const items = this.storage.getModule('qlp');
    const tbody = document.getElementById('qlpTable');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="empty-message">Nenhum QLP cadastrado</td></tr>';
        // Atualizar Dashboard e Gráficos mesmo sem dados
        this.updateDashboardQLP([]);
        this.renderGraficosQLP([]);
        return;
    }

    tbody.innerHTML = items.map(item => {
        const statusClass = item.status === 'Ativo' ? 'success' : item.status === 'Férias' ? 'info' : 'warning';
        
        // Calcular Tempo de Empresa
        const tempoEmpresa = item.dataEntrada ? this.calculos.calcularTempoEmpresa(item.dataEntrada) : '-';
        
        return `
            <tr>
                <td><strong>${item.matricula}</strong></td>
                <td>${item.nome}</td>
                <td>${item.funcao}</td>
                <td>${item.dataEntrada ? this.formatDate(item.dataEntrada) : '-'}</td>
                <td>${tempoEmpresa}</td>
                <td>${item.rua || '-'}</td>
                <td>${item.numero || '-'}</td>
                <td>${item.bairro || '-'}</td>
                <td>${item.cidade || '-'}</td>
                <td><span class="badge badge-info">${item.escolaridade || '-'}</span></td>
                <td>${item.informacoes || '-'}</td>
                <td><span class="badge badge-${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.app.editQlp('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteQlp('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Atualizar Dashboard e Gráficos
    this.updateDashboardQLP(items);
    this.renderGraficosQLP(items);
};

AppManager.prototype.updateDashboardQLP = function(items) {
    // KPIs
    const totalPessoasEl = document.getElementById('totalPessoasQLP');
    const pessoasAtivasEl = document.getElementById('pessoasAtivasQLP');
    const tempoMedioEl = document.getElementById('tempoMedioQLP');
    const funcaoPrincipalEl = document.getElementById('funcaoPrincipalQLP');
    
    if (!totalPessoasEl) return; // Não está na aba QLP
    
    // Total de pessoas
    totalPessoasEl.textContent = items.length;
    
    // Pessoas ativas
    const pessoasAtivas = items.filter(p => p.status === 'Ativo');
    pessoasAtivasEl.textContent = pessoasAtivas.length;
    
    // Tempo médio de empresa
    if (items.length > 0) {
        let somaAnos = 0;
        items.forEach(item => {
            if (item.dataEntrada) {
                const dataEntrada = new Date(item.dataEntrada);
                const hoje = new Date();
                const diffTime = Math.abs(hoje - dataEntrada);
                const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
                somaAnos += diffYears;
            }
        });
        const media = (somaAnos / items.length).toFixed(1);
        tempoMedioEl.textContent = media;
    } else {
        tempoMedioEl.textContent = '0';
    }
    
    // Função mais comum
    const funcoes = {};
    items.forEach(item => {
        funcoes[item.funcao] = (funcoes[item.funcao] || 0) + 1;
    });
    
    let funcaoMaisComum = '-';
    let maxCount = 0;
    Object.keys(funcoes).forEach(funcao => {
        if (funcoes[funcao] > maxCount) {
            maxCount = funcoes[funcao];
            funcaoMaisComum = funcao;
        }
    });
    funcaoPrincipalEl.textContent = funcaoMaisComum;
};

AppManager.prototype.renderGraficosQLP = function(items) {
    this.renderGraficoPessoasPorStatus(items);
    this.renderGraficoPessoasPorFuncao(items);
    this.renderGraficoTempoEmpresa(items);
    this.renderGraficoEscolaridade(items);
};

AppManager.prototype.renderGraficoPessoasPorStatus = function(items) {
    const canvas = document.getElementById('chartPessoasPorStatus');
    if (!canvas) return;
    
    // Destruir gráfico anterior
    if (this.chartPessoasPorStatus) {
        this.chartPessoasPorStatus.destroy();
    }
    
    // Agrupar por status
    const status = {};
    items.forEach(item => {
        status[item.status] = (status[item.status] || 0) + 1;
    });
    
    const ctx = canvas.getContext('2d');
    this.chartPessoasPorStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(status),
            datasets: [{
                data: Object.values(status),
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
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
};

AppManager.prototype.renderGraficoPessoasPorFuncao = function(items) {
    const canvas = document.getElementById('chartPessoasPorFuncao');
    if (!canvas) return;
    
    // Destruir gráfico anterior
    if (this.chartPessoasPorFuncao) {
        this.chartPessoasPorFuncao.destroy();
    }
    
    // Agrupar por função
    const funcoes = {};
    items.forEach(item => {
        funcoes[item.funcao] = (funcoes[item.funcao] || 0) + 1;
    });
    
    // Cores variadas
    const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const backgroundColor = Object.keys(funcoes).map((_, i) => cores[i % cores.length]);
    
    const ctx = canvas.getContext('2d');
    this.chartPessoasPorFuncao = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(funcoes),
            datasets: [{
                label: 'Pessoas',
                data: Object.values(funcoes),
                backgroundColor: backgroundColor,
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
};

AppManager.prototype.renderGraficoTempoEmpresa = function(items) {
    const canvas = document.getElementById('chartTempoEmpresa');
    if (!canvas) return;
    
    // Destruir gráfico anterior
    if (this.chartTempoEmpresa) {
        this.chartTempoEmpresa.destroy();
    }
    
    // Calcular tempo de empresa para cada pessoa
    const dados = items.map(item => {
        if (item.dataEntrada) {
            const dataEntrada = new Date(item.dataEntrada);
            const hoje = new Date();
            const diffTime = Math.abs(hoje - dataEntrada);
            const diffYears = (diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
            return {
                nome: item.nome,
                anos: parseFloat(diffYears)
            };
        }
        return null;
    }).filter(d => d !== null);
    
    // Ordenar por tempo (maior para menor)
    dados.sort((a, b) => b.anos - a.anos);
    
    const labels = dados.map(d => d.nome);
    const values = dados.map(d => d.anos);
    
    const ctx = canvas.getContext('2d');
    this.chartTempoEmpresa = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Anos na Empresa',
                data: values,
                backgroundColor: '#3b82f6',
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y', // Barras horizontais
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return 'Tempo: ' + context.parsed.x.toFixed(1) + ' anos';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11 },
                        callback: function(value) {
                            return value + ' anos';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 11 }
                    },
                    grid: { display: false }
                }
            }
        }
    });
};

AppManager.prototype.renderGraficoEscolaridade = function(items) {
    const canvas = document.getElementById('chartEscolaridade');
    if (!canvas) return;
    
    // Destruir gráfico anterior
    if (this.chartEscolaridade) {
        this.chartEscolaridade.destroy();
    }
    
    // Agrupar por escolaridade
    const escolaridade = {};
    items.forEach(item => {
        const esc = item.escolaridade || 'Não Informado';
        escolaridade[esc] = (escolaridade[esc] || 0) + 1;
    });
    
    // Cores para escolaridade
    const coresEscolaridade = {
        'Ensino Fundamental': '#ef4444',
        'Ensino Médio': '#f59e0b',
        'Ensino Superior': '#10b981',
        'Pós-Graduação': '#3b82f6',
        'Mestrado': '#8b5cf6',
        'Doutorado': '#ec4899',
        'Não Informado': '#6b7280'
    };
    
    const backgroundColor = Object.keys(escolaridade).map(esc => coresEscolaridade[esc] || '#6b7280');
    
    const ctx = canvas.getContext('2d');
    this.chartEscolaridade = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(escolaridade),
            datasets: [{
                data: Object.values(escolaridade),
                backgroundColor: backgroundColor,
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
                        font: { size: 11 },
                        padding: 10
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
    
    // Atualizar resumo de escolaridade
    const resumoEl = document.getElementById('resumoEscolaridade');
    if (resumoEl) {
        const total = items.length;
        resumoEl.innerHTML = Object.keys(escolaridade).map(esc => {
            const count = escolaridade[esc];
            const percent = ((count / total) * 100).toFixed(1);
            const cor = coresEscolaridade[esc] || '#6b7280';
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 6px; border-left: 3px solid ${cor};">
                    <span style="color: var(--text-primary); font-size: 13px;">${esc}</span>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="color: ${cor}; font-weight: 600; font-size: 14px;">${count}</span>
                        <span style="color: var(--text-secondary); font-size: 12px;">(${percent}%)</span>
                    </div>
                </div>
            `;
        }).join('');
    }
};

AppManager.prototype.deleteQlp = function(id) {
    if (confirm('Tem certeza que deseja excluir este QLP?')) {
        this.storage.deleteItem('qlp', id);
        this.notification.show('success', 'Sucesso', 'QLP excluído com sucesso!');
        this.renderQlp();
        this.updateDashboard();
    }
};

AppManager.prototype.editQlp = function(id) {
    const items = this.storage.getModule('qlp');
    const item = items.find(i => i.id === id);
    if (item) this.showQlpForm(item);
};

// Gases (Cilindros)
AppManager.prototype.showGasForm = function(item = null) {
    const content = `
        <form id="gasForm">
            <div class="form-group">
                <label>Tipo de Gás *</label>
                <select name="tipoGas" required>
                    <option value="OXIGÊNIO" ${item && item.tipoGas === 'OXIGÊNIO' ? 'selected' : ''}>OXIGÊNIO</option>
                    <option value="ACETILENO" ${item && item.tipoGas === 'ACETILENO' ? 'selected' : ''}>ACETILENO</option>
                    <option value="ARGÔNIO" ${item && item.tipoGas === 'ARGÔNIO' ? 'selected' : ''}>ARGÔNIO</option>
                </select>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Data Pedido *</label>
                    <input type="date" name="dataPedido" value="${item && item.dataPedido || ''}" required>
                </div>
                <div class="form-group">
                    <label>Data Montagem *</label>
                    <input type="date" name="dataMontagem" value="${item && item.dataMontagem || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Data Saída *</label>
                    <input type="date" name="dataSaida" value="${item && item.dataSaida || ''}" required>
                </div>
                <div class="form-group">
                    <label>Responsável *</label>
                    <input type="text" name="responsavel" value="${item && item.responsavel || ''}" required>
                </div>
            </div>
            <div class="form-group">
                <label>Status *</label>
                <select name="status" required>
                    <option value="Reserva" ${item && item.status === 'Reserva' ? 'selected' : ''}>Reserva</option>
                    <option value="Montado" ${item && item.status === 'Montado' ? 'selected' : ''}>Montado</option>
                    <option value="Encerrado" ${item && item.status === 'Encerrado' ? 'selected' : ''}>Encerrado</option>
                </select>
            </div>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <strong style="color: #2563eb;">ℹ️ Duração será calculada automaticamente</strong>
                <p style="margin: 5px 0 0 0; color: #475569;">Duração = Data Saída - Data Montagem</p>
            </div>
        </form>
    `;

    this.modal.show(item ? 'Editar Registro' : 'Registrar Cilindro', content, () => {
        const form = document.getElementById('gasForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        if (item) {
            this.storage.updateItem('gases', item.id, data);
            this.notification.show('success', 'Sucesso', 'Registro atualizado com sucesso!');
        } else {
            this.storage.addItem('gases', data);
            this.notification.show('success', 'Sucesso', 'Cilindro registrado com sucesso!');
        }

        this.renderGases();
        this.updateDashboard();
        return true;
    });
};

AppManager.prototype.renderGases = function() {
    const items = this.storage.getModule('gases');
    const tbody = document.getElementById('gasesTable');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-message">Nenhum registro de cilindro</td></tr>';
        this.renderGasesDashboard();
        return;
    }

    tbody.innerHTML = items.map(item => {
        const duracao = CalculosMoldes.calcularDuracaoGas(item.dataMontagem, item.dataSaida);
        
        // Definir cor do badge conforme status
        const statusClass = item.status === 'Montado' ? 'success' : 
                           item.status === 'Reserva' ? 'warning' : 'danger';
        
        return `
            <tr>
                <td><strong>${item.tipoGas}</strong></td>
                <td>${this.formatDate(item.dataPedido)}</td>
                <td>${this.formatDate(item.dataMontagem)}</td>
                <td>${this.formatDate(item.dataSaida)}</td>
                <td><span class="badge badge-info">${duracao} dias</span></td>
                <td>${item.responsavel}</td>
                <td><span class="badge badge-${statusClass}">${item.status || 'Montado'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.app.editGas('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteGas('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    this.renderGasesDashboard();
};

AppManager.prototype.renderGasesDashboard = function() {
    const items = this.storage.getModule('gases');
    
    // Calcular KPIs
    const totalCilindros = items.length;
    const cilindrosAtivos = items.filter(i => i.status === 'Montado').length;
    
    // Calcular duração média
    const duracoes = items
        .filter(i => i.dataMontagem && i.dataSaida)
        .map(i => CalculosMoldes.calcularDuracaoGas(i.dataMontagem, i.dataSaida));
    const duracaoMedia = duracoes.length > 0 
        ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length)
        : 0;
    
    // Próxima troca prevista (cilindro ativo mais antigo)
    const cilindrosOrdenados = items
        .filter(i => i.status === 'Montado' && i.dataMontagem)
        .sort((a, b) => new Date(a.dataMontagem) - new Date(b.dataMontagem));
    
    let proximaTroca = '-';
    if (cilindrosOrdenados.length > 0 && duracaoMedia > 0) {
        const maisAntigo = cilindrosOrdenados[0];
        const dataMontagem = new Date(maisAntigo.dataMontagem);
        const dataPrevisao = new Date(dataMontagem);
        dataPrevisao.setDate(dataPrevisao.getDate() + duracaoMedia);
        proximaTroca = dataPrevisao.toLocaleDateString('pt-BR');
    }
    
    // Atualizar KPIs
    document.getElementById('totalCilindros').textContent = totalCilindros;
    document.getElementById('cilindrosAtivos').textContent = cilindrosAtivos;
    document.getElementById('duracaoMedia').textContent = duracaoMedia;
    document.getElementById('proximaTroca').textContent = proximaTroca;
    
    if (items.length === 0) return;
    
    // Gráfico 1: Tipos de Gás (Doughnut)
    const canvasTipos = document.getElementById('chartTiposGas');
    if (canvasTipos) {
        const ctxTipos = canvasTipos.getContext('2d');
        if (this.chartTiposGas) this.chartTiposGas.destroy();
        
        const tipos = {};
        items.forEach(item => {
            tipos[item.tipoGas] = (tipos[item.tipoGas] || 0) + 1;
        });
        
        const labels = Object.keys(tipos);
        const data = Object.values(tipos);
        const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        
        this.chartTiposGas = new Chart(ctxTipos, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: cores.slice(0, labels.length),
                    borderColor: '#1e293b',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        display: true, 
                        position: 'bottom',
                        labels: { color: '#e2e8f0', font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + ' cilindros';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico 2: Status dos Cilindros (Bar)
    const canvasStatus = document.getElementById('chartStatusGas');
    if (canvasStatus) {
        const ctxStatus = canvasStatus.getContext('2d');
        if (this.chartStatusGas) this.chartStatusGas.destroy();
        
        const status = {};
        items.forEach(item => {
            const st = item.status || 'Montado';
            status[st] = (status[st] || 0) + 1;
        });
        
        const statusLabels = Object.keys(status);
        const statusData = Object.values(status);
        const statusCores = statusLabels.map(s => 
            s === 'Montado' ? '#10b981' : s === 'Reserva' ? '#f59e0b' : '#ef4444'
        );
        
        this.chartStatusGas = new Chart(ctxStatus, {
            type: 'bar',
            data: {
                labels: statusLabels,
                datasets: [{
                    label: 'Quantidade',
                    data: statusData,
                    backgroundColor: statusCores,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Cilindros: ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { color: '#94a3b8', stepSize: 1 },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: { 
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });
    }
};

AppManager.prototype.deleteGas = function(id) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        this.storage.deleteItem('gases', id);
        this.notification.show('success', 'Sucesso', 'Registro excluído com sucesso!');
        this.renderGases();
    }
};

// Treinamentos
AppManager.prototype.showTreinamentoForm = function(item = null) {
    const content = `
        <form id="treinamentoForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Data *</label>
                    <input type="date" name="data" value="${item && item.data || ''}" required>
                </div>
                <div class="form-group">
                    <label>Tipo *</label>
                    <select name="tipo" required>
                        <option value="Técnico" ${item && item.tipo === 'Técnico' ? 'selected' : ''}>Técnico</option>
                        <option value="Segurança" ${item && item.tipo === 'Segurança' ? 'selected' : ''}>Segurança</option>
                        <option value="Qualidade" ${item && item.tipo === 'Qualidade' ? 'selected' : ''}>Qualidade</option>
                        <option value="Operacional" ${item && item.tipo === 'Operacional' ? 'selected' : ''}>Operacional</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Título *</label>
                <input type="text" name="titulo" value="${item && item.titulo || ''}" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Instrutor *</label>
                    <input type="text" name="instrutor" value="${item && item.instrutor || ''}" required>
                </div>
                <div class="form-group">
                    <label>Nº de Participantes *</label>
                    <input type="number" name="participantes" value="${item && item.participantes || ''}" required>
                </div>
            </div>
            <div class="form-group">
                <label>Status *</label>
                <select name="status" required>
                    <option value="Agendado" ${item && item.status === 'Agendado' ? 'selected' : ''}>Agendado</option>
                    <option value="Em Andamento" ${item && item.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                    <option value="Concluído" ${item && item.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                    <option value="Cancelado" ${item && item.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </div>
        </form>
    `;

    this.modal.show(item ? 'Editar Treinamento' : 'Agendar Treinamento', content, () => {
        const form = document.getElementById('treinamentoForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        data.participantes = parseInt(data.participantes);

        if (item) {
            this.storage.updateItem('treinamentos', item.id, data);
            this.notification.show('success', 'Sucesso', 'Treinamento atualizado com sucesso!');
        } else {
            this.storage.addItem('treinamentos', data);
            this.notification.show('success', 'Sucesso', 'Treinamento agendado com sucesso!');
        }

        this.renderTreinamentos();
        this.updateDashboard();
        return true;
    });
};

AppManager.prototype.renderTreinamentos = function() {
    const items = this.storage.getModule('treinamentos');
    const tbody = document.getElementById('treinamentosTable');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-message">Nenhum treinamento agendado</td></tr>';
        this.renderTreinamentosDashboard();
        return;
    }

    tbody.innerHTML = items.map(item => {
        const statusClass = item.status === 'Concluído' ? 'success' : 
                           item.status === 'Em Andamento' ? 'info' : 
                           item.status === 'Cancelado' ? 'danger' : 'warning';
        
        return `
            <tr>
                <td>${this.formatDate(item.data)}</td>
                <td><strong>${item.titulo}</strong></td>
                <td>${item.tipo}</td>
                <td>${item.instrutor}</td>
                <td>${item.participantes}</td>
                <td><span class="badge badge-${statusClass}">${item.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.app.editTreinamento('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteTreinamento('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    this.renderTreinamentosDashboard();
};

AppManager.prototype.renderTreinamentosDashboard = function() {
    const items = this.storage.getModule('treinamentos');
    
    // Calcular KPIs
    const totalTreinamentos = items.length;
    const hoje = new Date();
    const seteDias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
    const treinamentosProximos = items.filter(i => {
        const data = new Date(i.data);
        return data >= hoje && data <= seteDias;
    }).length;
    const treinamentosConcluidos = items.filter(i => i.status === 'Concluído').length;
    const instrutores = new Set(items.map(i => i.instrutor)).size;
    
    // Atualizar KPIs
    document.getElementById('totalTreinamentos').textContent = totalTreinamentos;
    document.getElementById('treinamentosProximos').textContent = treinamentosProximos;
    document.getElementById('treinamentosConcluidos').textContent = treinamentosConcluidos;
    document.getElementById('instrutoresAtivos').textContent = instrutores;
    
    if (items.length === 0) return;
    
    // Gráfico 1: Tipos de Treinamento (Doughnut)
    const canvasTipos = document.getElementById('chartTiposTreinamento');
    if (canvasTipos) {
        const ctxTipos = canvasTipos.getContext('2d');
        if (this.chartTiposTreinamento) this.chartTiposTreinamento.destroy();
        
        const tipos = {};
        items.forEach(item => {
            tipos[item.tipo] = (tipos[item.tipo] || 0) + 1;
        });
        
        const labels = Object.keys(tipos);
        const data = Object.values(tipos);
        const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
        
        this.chartTiposTreinamento = new Chart(ctxTipos, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: cores.slice(0, labels.length),
                    borderColor: '#1e293b',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        display: true, 
                        position: 'bottom',
                        labels: { color: '#e2e8f0', font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + ' treinamentos';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico 2: Status (Bar)
    const canvasStatus = document.getElementById('chartStatusTreinamento');
    if (canvasStatus) {
        const ctxStatus = canvasStatus.getContext('2d');
        if (this.chartStatusTreinamento) this.chartStatusTreinamento.destroy();
        
        const status = {};
        items.forEach(item => {
            const st = item.status || 'Agendado';
            status[st] = (status[st] || 0) + 1;
        });
        
        const statusLabels = Object.keys(status);
        const statusData = Object.values(status);
        const statusCores = statusLabels.map(s => 
            s === 'Concluído' ? '#10b981' : s === 'Em Andamento' ? '#3b82f6' : s === 'Cancelado' ? '#ef4444' : '#f59e0b'
        );
        
        this.chartStatusTreinamento = new Chart(ctxStatus, {
            type: 'bar',
            data: {
                labels: statusLabels,
                datasets: [{
                    label: 'Quantidade',
                    data: statusData,
                    backgroundColor: statusCores,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Treinamentos: ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { color: '#94a3b8', stepSize: 1 },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: { 
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                }
            }
        });
    }
};

AppManager.prototype.deleteTreinamento = function(id) {
    if (confirm('Tem certeza que deseja excluir este treinamento?')) {
        this.storage.deleteItem('treinamentos', id);
        this.notification.show('success', 'Sucesso', 'Treinamento excluído com sucesso!');
        this.renderTreinamentos();
    }
};

// Reuniões
AppManager.prototype.showReuniaoForm = function(item = null) {
    const content = `
        <form id="reuniaoForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Data *</label>
                    <input type="date" name="data" value="${item && item.data || ''}" required>
                </div>
                <div class="form-group">
                    <label>Tipo *</label>
                    <select name="tipo" required>
                        <option value="DDS" ${item && item.tipo === 'DDS' ? 'selected' : ''}>DDS</option>
                        <option value="Produção" ${item && item.tipo === 'Produção' ? 'selected' : ''}>Produção</option>
                        <option value="Qualidade" ${item && item.tipo === 'Qualidade' ? 'selected' : ''}>Qualidade</option>
                        <option value="Manutenção" ${item && item.tipo === 'Manutenção' ? 'selected' : ''}>Manutenção</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Participantes *</label>
                <input type="number" name="participantes" value="${item && item.participantes || ''}" required min="0">
            </div>
            
            <div class="form-section">
                <h3 style="margin-top: 15px; color: #e74c3c;">🚨 Segurança</h3>
                <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
                    <div class="form-group">
                        <label>Condição Insegura</label>
                        <input type="number" name="condicaoInsegura" value="${item && item.condicaoInsegura || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Incidente</label>
                        <input type="number" name="incidente" value="${item && item.incidente || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Ato Inseguro</label>
                        <input type="number" name="atoInseguro" value="${item && item.atoInseguro || 0}" min="0">
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3 style="margin-top: 15px; color: #3498db;">🏭 Produção</h3>
                <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
                    <div class="form-group">
                        <label>Moldes Recebidos</label>
                        <input type="number" name="moldesRecebidos" value="${item && item.moldesRecebidos || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Peças Limpas</label>
                        <input type="number" name="pecasLimpas" value="${item && item.pecasLimpas || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Moldes Reparados</label>
                        <input type="number" name="moldesReparados" value="${item && item.moldesReparados || 0}" min="0">
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3 style="margin-top: 15px; color: #27ae60;">🔧 Componentes - Coroas</h3>
                <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
                    <div class="form-group">
                        <label>Coroas Recebidas</label>
                        <input type="number" name="coroasRecebidas" value="${item && item.coroasRecebidas || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Coroas Reparadas</label>
                        <input type="number" name="coroasReparadas" value="${item && item.coroasReparadas || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Coroas Inspecionadas</label>
                        <input type="number" name="coroasInspecionadas" value="${item && item.coroasInspecionadas || 0}" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Coroas Segregadas</label>
                    <input type="number" name="coroasSegregadas" value="${item && item.coroasSegregadas || 0}" min="0">
                </div>
            </div>

            <div class="form-section">
                <h3 style="margin-top: 15px; color: #e67e22;">⚙️ Componentes - Punções</h3>
                <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
                    <div class="form-group">
                        <label>Punções Recebidos</label>
                        <input type="number" name="puncoesRecebidos" value="${item && item.puncoesRecebidos || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Punções Reparados</label>
                        <input type="number" name="puncoesReparados" value="${item && item.puncoesReparados || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Punções Segregados</label>
                        <input type="number" name="puncoesSegregados" value="${item && item.puncoesSegregados || 0}" min="0">
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3 style="margin-top: 15px; color: #9b59b6;">📊 Inspeção e Volume</h3>
                <div class="form-row" style="grid-template-columns: 1fr 1fr;">
                    <div class="form-group">
                        <label>Volume Inspecionado</label>
                        <input type="number" name="volumeInspecionado" value="${item && item.volumeInspecionado || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Volume Segregado</label>
                        <input type="number" name="volumeSegregado" value="${item && item.volumeSegregado || 0}" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Insertos Segregados</label>
                    <input type="number" name="insertosSegregados" value="${item && item.insertosSegregados || 0}" min="0">
                </div>
            </div>

            <div class="form-group">
                <label>Tópicos Discutidos</label>
                <textarea name="topicos" rows="3" placeholder="Opcional">${item && item.topicos || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Ações Definidas</label>
                <textarea name="acoes" rows="3" placeholder="Opcional">${item && item.acoes || ''}</textarea>
            </div>
        </form>
    `;

    this.modal.show(item ? 'Editar Reunião' : 'Nova Reunião', content, () => {
        const form = document.getElementById('reuniaoForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        const formData = new FormData(form);
        const data = {
            data: formData.get('data'),
            tipo: formData.get('tipo'),
            participantes: parseInt(formData.get('participantes')),
            condicaoInsegura: parseInt(formData.get('condicaoInsegura')) || 0,
            incidente: parseInt(formData.get('incidente')) || 0,
            atoInseguro: parseInt(formData.get('atoInseguro')) || 0,
            moldesRecebidos: parseInt(formData.get('moldesRecebidos')) || 0,
            pecasLimpas: parseInt(formData.get('pecasLimpas')) || 0,
            moldesReparados: parseInt(formData.get('moldesReparados')) || 0,
            coroasRecebidas: parseInt(formData.get('coroasRecebidas')) || 0,
            coroasReparadas: parseInt(formData.get('coroasReparadas')) || 0,
            coroasInspecionadas: parseInt(formData.get('coroasInspecionadas')) || 0,
            coroasSegregadas: parseInt(formData.get('coroasSegregadas')) || 0,
            puncoesRecebidos: parseInt(formData.get('puncoesRecebidos')) || 0,
            puncoesReparados: parseInt(formData.get('puncoesReparados')) || 0,
            puncoesSegregados: parseInt(formData.get('puncoesSegregados')) || 0,
            volumeInspecionado: parseInt(formData.get('volumeInspecionado')) || 0,
            volumeSegregado: parseInt(formData.get('volumeSegregado')) || 0,
            insertosSegregados: parseInt(formData.get('insertosSegregados')) || 0,
            topicos: formData.get('topicos'),
            acoes: formData.get('acoes')
        };

        if (item) {
            this.storage.updateItem('reunioes', item.id, data);
            this.notification.show('success', 'Sucesso', 'Reunião atualizada com sucesso!');
        } else {
            this.storage.addItem('reunioes', data);
            this.notification.show('success', 'Sucesso', 'Reunião registrada com sucesso!');
        }

        this.renderReunioes();
        this.renderReunioesDashboard();
        this.updateDashboard();
        return true;
    });
};

AppManager.prototype.renderReunioes = function() {
    const items = this.storage.getModule('reunioes');
    const tbody = document.getElementById('reunioesTable');

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">Nenhuma reunião registrada</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => {
        // Calcular totais por categoria
        const segurancaTotal = (item.condicaoInsegura || 0) + (item.incidente || 0) + (item.atoInseguro || 0);
        const producaoTotal = (item.moldesRecebidos || 0) + (item.pecasLimpas || 0) + (item.moldesReparados || 0);
        const componentesTotal = (item.coroasRecebidas || 0) + (item.coroasReparadas || 0) + (item.coroasInspecionadas || 0) + 
                                 (item.coroasSegregadas || 0) + (item.puncoesRecebidos || 0) + (item.puncoesReparados || 0) + 
                                 (item.puncoesSegregados || 0);
        const inspecaoTotal = (item.volumeInspecionado || 0) + (item.volumeSegregado || 0) + (item.insertosSegregados || 0);
        
        // Badge para tipo de reunião
        const coresTipo = {
            'DDS': 'background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff;',
            'Produção': 'background: linear-gradient(135deg, #10b981, #059669); color: #fff;',
            'Qualidade': 'background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;',
            'Manutenção': 'background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff;'
        };
        const badgeTipo = `<span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; ${coresTipo[item.tipo] || 'background: #64748b; color: #fff;'}">${item.tipo}</span>`;
        
        // Badge para indicadores de segurança
        let badgeSeguranca = '';
        let corSeguranca = '';
        if (segurancaTotal === 0) {
            corSeguranca = 'background: linear-gradient(135deg, #10b981, #059669); color: #fff;';
            badgeSeguranca = '<i class="fas fa-check-circle"></i> OK';
        } else if (segurancaTotal <= 5) {
            corSeguranca = 'background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;';
            badgeSeguranca = '<i class="fas fa-exclamation-triangle"></i> ' + segurancaTotal;
        } else if (segurancaTotal <= 10) {
            corSeguranca = 'background: linear-gradient(135deg, #fb923c, #f97316); color: #fff;';
            badgeSeguranca = '<i class="fas fa-exclamation-circle"></i> ' + segurancaTotal;
        } else {
            corSeguranca = 'background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;';
            badgeSeguranca = '<i class="fas fa-times-circle"></i> ' + segurancaTotal;
        }
        const badgeSegurancaHtml = `<span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; ${corSeguranca}">${badgeSeguranca}</span>`;
        
        // Resumo resumido (primeiros 60 chars dos tópicos)
        const resumo = item.topicos ? (item.topicos.length > 60 ? item.topicos.substring(0, 60) + '...' : item.topicos) : 'Sem tópicos';
        
        return `
            <tr>
                <td>${this.formatDate(item.data)}</td>
                <td>${badgeTipo}</td>
                <td style="text-align: center;"><strong>${item.participantes}</strong></td>
                <td style="text-align: center;">${badgeSegurancaHtml}</td>
                <td style="text-align: center;"><strong style="color: #3b82f6;">${producaoTotal}</strong></td>
                <td style="text-align: center;"><strong style="color: #10b981;">${componentesTotal}</strong></td>
                <td style="text-align: center;"><strong style="color: #8b5cf6;">${inspecaoTotal.toLocaleString('pt-BR')}</strong></td>
                <td style="font-size: 12px; color: #cbd5e1;">${resumo}</td>
                <td style="white-space: nowrap;">
                    <button class="btn btn-sm btn-primary" onclick="window.app.editReuniao('${item.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteReuniao('${item.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
};


AppManager.prototype.deleteReuniao = function(id) {
    if (confirm('Tem certeza que deseja excluir esta reunião?')) {
        this.storage.deleteItem('reunioes', id);
        this.notification.show('success', 'Sucesso', 'Reunião excluída com sucesso!');
        this.renderReunioes();
        this.renderReunioesDashboard();
        this.updateDashboard();
    }
};

// Dashboard de Reuniões
AppManager.prototype.renderReunioesDashboard = function() {
    const items = this.storage.getModule('reunioes');
    
    // Calcular KPIs
    const totalReunioes = items.length;
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    const reunioesEsteMes = items.filter(i => {
        const dataReuniao = new Date(i.data);
        return dataReuniao.getMonth() === mesAtual && dataReuniao.getFullYear() === anoAtual;
    }).length;
    
    const participacaoMedia = items.length > 0 
        ? Math.round(items.reduce((sum, i) => sum + (parseInt(i.participantes) || 0), 0) / items.length)
        : 0;
    
    const totalIndicadoresSeguranca = items.reduce((sum, i) => 
        sum + (parseInt(i.condicaoInsegura) || 0) + (parseInt(i.incidente) || 0) + (parseInt(i.atoInseguro) || 0), 0
    );
    
    // Atualizar KPIs
    document.getElementById('totalReunioes').textContent = totalReunioes;
    document.getElementById('reunioesEsteMes').textContent = reunioesEsteMes;
    document.getElementById('participacaoMedia').textContent = participacaoMedia;
    document.getElementById('totalIndicadoresSeguranca').textContent = totalIndicadoresSeguranca;
    
    // Calcular totais por categoria para os cards
    const totais = items.reduce((acc, item) => {
        // Segurança
        acc.condicaoInsegura += parseInt(item.condicaoInsegura) || 0;
        acc.incidente += parseInt(item.incidente) || 0;
        acc.atoInseguro += parseInt(item.atoInseguro) || 0;
        
        // Produção
        acc.moldesRecebidos += parseInt(item.moldesRecebidos) || 0;
        acc.pecasLimpas += parseInt(item.pecasLimpas) || 0;
        acc.moldesReparados += parseInt(item.moldesReparados) || 0;
        
        // Componentes
        acc.coroas += (parseInt(item.coroasRecebidas) || 0) + (parseInt(item.coroasReparadas) || 0) + 
                      (parseInt(item.coroasInspecionadas) || 0) + (parseInt(item.coroasSegregadas) || 0);
        acc.puncoes += (parseInt(item.puncoesRecebidos) || 0) + (parseInt(item.puncoesReparados) || 0) + 
                       (parseInt(item.puncoesSegregados) || 0);
        
        // Inspeção
        acc.volumeInspecionado += parseInt(item.volumeInspecionado) || 0;
        acc.volumeSegregado += parseInt(item.volumeSegregado) || 0;
        acc.insertosSegregados += parseInt(item.insertosSegregados) || 0;
        
        return acc;
    }, {
        condicaoInsegura: 0, incidente: 0, atoInseguro: 0,
        moldesRecebidos: 0, pecasLimpas: 0, moldesReparados: 0,
        coroas: 0, puncoes: 0,
        volumeInspecionado: 0, volumeSegregado: 0, insertosSegregados: 0
    });
    
    // Atualizar Cards de Resumo
    document.getElementById('totalCondicaoInsegura').textContent = totais.condicaoInsegura;
    document.getElementById('totalIncidentes').textContent = totais.incidente;
    document.getElementById('totalAtosInseguros').textContent = totais.atoInseguro;
    document.getElementById('totalSeguranca').textContent = totais.condicaoInsegura + totais.incidente + totais.atoInseguro;
    
    document.getElementById('totalMoldesRecebidos').textContent = totais.moldesRecebidos;
    document.getElementById('totalPecasLimpas').textContent = totais.pecasLimpas;
    document.getElementById('totalMoldesReparados').textContent = totais.moldesReparados;
    document.getElementById('totalProducao').textContent = totais.moldesRecebidos + totais.pecasLimpas + totais.moldesReparados;
    
    document.getElementById('totalCoroas').textContent = totais.coroas;
    document.getElementById('totalPuncoes').textContent = totais.puncoes;
    document.getElementById('totalComponentes').textContent = totais.coroas + totais.puncoes;
    
    document.getElementById('totalVolumeInspecionado').textContent = totais.volumeInspecionado.toLocaleString('pt-BR');
    document.getElementById('totalVolumeSegregado').textContent = totais.volumeSegregado.toLocaleString('pt-BR');
    document.getElementById('totalInsertosSegregados').textContent = totais.insertosSegregados;
    document.getElementById('totalInspecao').textContent = (totais.volumeInspecionado + totais.volumeSegregado + totais.insertosSegregados).toLocaleString('pt-BR');
    
    if (items.length === 0) return;
    
    // Gráfico 1: Reuniões por Tipo (Doughnut)
    const canvasTipos = document.getElementById('chartTiposReuniao');
    if (canvasTipos) {
        const ctxTipos = canvasTipos.getContext('2d');
        if (this.chartTiposReuniao) this.chartTiposReuniao.destroy();
        
        const tipos = {};
        items.forEach(item => {
            tipos[item.tipo] = (tipos[item.tipo] || 0) + 1;
        });
        
        const coresTipos = {
            'DDS': '#3b82f6',
            'Produção': '#10b981',
            'Qualidade': '#f59e0b',
            'Manutenção': '#8b5cf6'
        };
        
        this.chartTiposReuniao = new Chart(ctxTipos, {
            type: 'doughnut',
            data: {
                labels: Object.keys(tipos),
                datasets: [{
                    data: Object.values(tipos),
                    backgroundColor: Object.keys(tipos).map(t => coresTipos[t] || '#64748b'),
                    borderColor: '#1e293b',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        display: true, 
                        position: 'bottom',
                        labels: { color: '#e2e8f0', font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico 2: Evolução Mensal (Line)
    const canvasMes = document.getElementById('chartReunioesMes');
    if (canvasMes) {
        const ctxMes = canvasMes.getContext('2d');
        if (this.chartReunioesMes) this.chartReunioesMes.destroy();
        
        // Agrupar por mês
        const meses = {};
        items.forEach(item => {
            const data = new Date(item.data);
            const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            meses[mesAno] = (meses[mesAno] || 0) + 1;
        });
        
        // Ordenar e pegar últimos 6 meses
        const mesesOrdenados = Object.keys(meses).sort().slice(-6);
        const valores = mesesOrdenados.map(m => meses[m]);
        const labels = mesesOrdenados.map(m => {
            const [ano, mes] = m.split('-');
            const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            return mesesNomes[parseInt(mes) - 1] + '/' + ano.slice(2);
        });
        
        this.chartReunioesMes = new Chart(ctxMes, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Reuniões',
                    data: valores,
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        display: true,
                        labels: { color: '#e2e8f0', font: { size: 12 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Reuniões: ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: { color: '#94a3b8', stepSize: 1 },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        title: { display: true, text: 'Quantidade', color: '#e2e8f0' }
                    },
                    x: { 
                        ticks: { color: '#94a3b8', font: { size: 10 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }
};


// Helper methods para edição por ID
AppManager.prototype.editItemCritico = function(id) {
    const items = this.storage.getModule('itensCriticos');
    const item = items.find(i => i.id === id);
    if (item) this.showItemCriticoForm(item);
};


AppManager.prototype.editGas = function(id) {
    const items = this.storage.getModule('gases');
    const item = items.find(i => i.id === id);
    if (item) this.showGasForm(item);
};

AppManager.prototype.editTreinamento = function(id) {
    const items = this.storage.getModule('treinamentos');
    const item = items.find(i => i.id === id);
    if (item) this.showTreinamentoForm(item);
};

AppManager.prototype.editReuniao = function(id) {
    const items = this.storage.getModule('reunioes');
    const item = items.find(i => i.id === id);
    if (item) this.showReuniaoForm(item);
};

// Custos
AppManager.prototype.showCustoForm = function(item = null) {
    const content = `
        <form id="custoForm">
            <div class="form-row">
                <div class="form-group">
                    <label>SKU *</label>
                    <input type="text" name="sku" value="${item && item.sku || ''}" required placeholder="Ex: Stella">
                </div>
                <div class="form-group">
                    <label>Item (Número) *</label>
                    <input type="number" name="item" value="${item && item.item || ''}" required>
                </div>
            </div>
            <div class="form-group">
                <label>Tipo de Molde *</label>
                <input type="text" name="tipoMolde" value="${item && item.tipoMolde || ''}" required placeholder="Ex: BLOW MOULD">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tradução *</label>
                    <input type="text" name="traducao" value="${item && item.traducao || ''}" required placeholder="Ex: MOLDE">
                </div>
                <div class="form-group">
                    <label>Classificação *</label>
                    <select name="classificacao" required>
                        <option value="">Selecione...</option>
                        <option value="MOULD" ${item && item.classificacao === 'MOULD' ? 'selected' : ''}>MOULD (Molde)</option>
                        <option value="ACESSÓRIO" ${item && item.classificacao === 'ACESSÓRIO' ? 'selected' : ''}>ACESSÓRIO</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Fornecedor *</label>
                <input type="text" name="fornecedor" value="${item && item.fornecedor || ''}" required placeholder="Ex: Fornecedor ABC">
            </div>
            <div class="form-group">
                <label>Quantidade *</label>
                <input type="number" name="quantidade" value="${item && item.quantidade || ''}" required min="1">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Moeda *</label>
                    <select name="moeda" required>
                        <option value="EUR" ${!item || item.moeda === 'EUR' ? 'selected' : ''}>€ Euro</option>
                        <option value="USD" ${item && item.moeda === 'USD' ? 'selected' : ''}>$ Dólar</option>
                        <option value="BRL" ${item && item.moeda === 'BRL' ? 'selected' : ''}>R$ Real</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Valor Unitário *</label>
                    <input type="number" name="valorUnitario" value="${item && item.valorUnitario || ''}" required min="0" step="0.01" placeholder="0.00">
                </div>
            </div>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <strong style="color: #2563eb;">ℹ️ Cálculo Automático</strong>
                <p style="margin: 5px 0 0 0; color: #475569;">O Valor Total será calculado automaticamente: Quantidade × Valor Unitário</p>
            </div>
        </form>
    `;

    this.modal.show(item ? 'Editar Item de Custo' : 'Adicionar Item de Custo', content, () => {
        const form = document.getElementById('custoForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Converter números
        data.item = parseInt(data.item);
        data.quantidade = parseInt(data.quantidade);
        data.valorUnitario = parseFloat(data.valorUnitario);
        data.valorTotal = data.quantidade * data.valorUnitario;

        if (item) {
            this.storage.updateItem('custos', item.id, data);
            this.notification.show('success', 'Sucesso', 'Item atualizado com sucesso!');
        } else {
            this.storage.addItem('custos', data);
            this.notification.show('success', 'Sucesso', 'Item adicionado com sucesso!');
        }

        this.renderCustos();
        return true;
    });
};

AppManager.prototype.renderCustos = function() {
    const items = this.storage.getModule('custos');
    const tbody = document.getElementById('custosTable');
    
    // Renderizar tabela
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">Nenhum item cadastrado</td></tr>';
        this.updateCustosStats(items);
        return;
    }

    tbody.innerHTML = items.map(item => {
        const classificacaoBadge = item.classificacao === 'MOULD' ? 'danger' : 'info';
        const moeda = item.moeda || 'EUR';
        const simboloMoeda = { 'EUR': '€', 'USD': '$', 'BRL': 'R$' }[moeda] || '€';
        
        return `
            <tr>
                <td><strong>${item.sku}</strong></td>
                <td><span class="badge badge-secondary">#${item.item}</span></td>
                <td>${item.tipoMolde}<br><small style="color: var(--text-secondary);">${item.traducao}</small></td>
                <td><span class="badge badge-${classificacaoBadge}">${item.classificacao}</span></td>
                <td><span class="badge badge-warning">${item.fornecedor || 'N/A'}</span></td>
                <td><strong>${item.quantidade}</strong> un.</td>
                <td style="text-align: right;">${simboloMoeda} ${item.valorUnitario.toFixed(2)}</td>
                <td style="text-align: right;"><strong style="color: #10b981;">${simboloMoeda} ${item.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.app.editCusto('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteCusto('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Atualizar estatísticas e gráfico
    this.updateCustosStats(items);
};

AppManager.prototype.updateCustosStats = function(items) {
    // Popular dropdown de fornecedores
    const fornecedorFilter = document.getElementById('fornecedorFilter');
    if (fornecedorFilter) {
        const fornecedores = [...new Set(items.map(item => item.fornecedor).filter(f => f))];
        const currentValue = fornecedorFilter.value;
        
        fornecedorFilter.innerHTML = '<option value="">Todos os Fornecedores</option>' + 
            fornecedores.map(f => `<option value="${f}" ${currentValue === f ? 'selected' : ''}>${f}</option>`).join('');
        
        // Adicionar evento de mudança se ainda não existe
        if (!fornecedorFilter.dataset.listenerAdded) {
            fornecedorFilter.addEventListener('change', () => {
                this.renderCustos();
            });
            fornecedorFilter.dataset.listenerAdded = 'true';
        }
        
        // Filtrar itens pelo fornecedor selecionado
        if (fornecedorFilter.value) {
            items = items.filter(item => item.fornecedor === fornecedorFilter.value);
        }
    }
    
    // Calcular estatísticas (em EUR por padrão)
    const totalInvestido = items.reduce((sum, item) => sum + item.valorTotal, 0);
    const custoMedio = items.length > 0 ? totalInvestido / items.length : 0;
    
    let moldeBarato = { valorTotal: Infinity, moeda: 'EUR' };
    let moldeCaro = { valorTotal: 0, moeda: 'EUR' };
    
    items.forEach(item => {
        if (item.valorTotal < moldeBarato.valorTotal) moldeBarato = item;
        if (item.valorTotal > moldeCaro.valorTotal) moldeCaro = item;
    });
    
    // Símbolo EUR padrão para dashboard
    const simbolo = '€';
    
    // Atualizar cards
    const totalInvestidoEl = document.getElementById('totalInvestido');
    const custoMedioEl = document.getElementById('custoMedio');
    const moldeBaratoEl = document.getElementById('moldeBarato');
    const moldeCaroEl = document.getElementById('moldeCaro');
    
    if (totalInvestidoEl) totalInvestidoEl.textContent = `${simbolo} ${totalInvestido.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (custoMedioEl) custoMedioEl.textContent = `${simbolo} ${custoMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (moldeBaratoEl) moldeBaratoEl.textContent = moldeBarato.valorTotal !== Infinity ? `${simbolo} ${moldeBarato.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : `${simbolo} 0`;
    if (moldeCaroEl) moldeCaroEl.textContent = moldeCaro.valorTotal > 0 ? `${simbolo} ${moldeCaro.valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : `${simbolo} 0`;
    
    // Criar gráfico
    this.renderCustosChart(items);
};

AppManager.prototype.renderCustosChart = function(items) {
    const canvas = document.getElementById('custosChart');
    if (!canvas) return;
    
    // Destruir gráfico existente
    if (window.custosChartInstance) {
        window.custosChartInstance.destroy();
    }
    
    if (items.length === 0) {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    
    // Preparar dados (Top 10 mais caros)
    const sorted = [...items].sort((a, b) => b.valorTotal - a.valorTotal).slice(0, 10);
    const labels = sorted.map(item => item.traducao);
    const valores = sorted.map(item => item.valorTotal);
    const cores = sorted.map(item => item.classificacao === 'MOULD' ? '#ef4444' : '#2563eb');
    
    // Criar gráfico
    window.custosChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valor Total (€)',
                data: valores,
                backgroundColor: cores,
                borderColor: cores,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Top 10 Itens Mais Caros',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#e8e9ed'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Valor Total: € ' + context.parsed.y.toLocaleString('pt-BR', {minimumFractionDigits: 2});
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '€ ' + value.toLocaleString('pt-BR');
                        },
                        font: {
                            size: 11
                        },
                        color: '#8b92ab'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11,
                            weight: 'bold'
                        },
                        color: '#8b92ab',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
};

AppManager.prototype.deleteCusto = function(id) {
    if (confirm('Tem certeza que deseja excluir este item de custo?')) {
        this.storage.deleteItem('custos', id);
        this.notification.show('success', 'Sucesso', 'Item excluído com sucesso!');
        this.renderCustos();
    }
};

AppManager.prototype.editCusto = function(id) {
    const items = this.storage.getModule('custos');
    const item = items.find(i => i.id === id);
    if (item) this.showCustoForm(item);
};

// Calculadora de Moldes
AppManager.prototype.calcularDimensionamento = function() {
    // Obter valores dos inputs
    const params = {
        numeroMaquinas: parseFloat(document.getElementById('calc_numero_maquinas').value) || 0,
        velocidadeGpm: parseFloat(document.getElementById('calc_velocidade_gpm').value) || 0,
        minutosPorDia: parseFloat(document.getElementById('calc_minutos_por_dia').value) || 0,
        vidroTonDia: parseFloat(document.getElementById('calc_vidro_ton_dia').value) || 0,
        pesoMedio: parseFloat(document.getElementById('calc_peso_medio').value) || 0,
        diasMes: parseFloat(document.getElementById('calc_dias_mes').value) || 0,
        diasAno: parseFloat(document.getElementById('calc_dias_ano').value) || 0,
        cavidadesMaq: parseFloat(document.getElementById('calc_cavidades_maq').value) || 0,
        setsAno: parseFloat(document.getElementById('calc_sets_ano').value) || 0,
        vidaCoroa: parseFloat(document.getElementById('calc_vida_coroa').value) || 0,
        vidaAnel: parseFloat(document.getElementById('calc_vida_anel').value) || 0
    };

    // Validação
    if (params.numeroMaquinas === 0 || params.velocidadeGpm === 0) {
        this.notification.show('error', 'Erro', 'Por favor, preencha todos os campos obrigatórios!');
        return;
    }

    // Cálculos conforme planilha ATUALIZADA
    const cavidadesTotais = params.numeroMaquinas * params.cavidadesMaq;
    const garrafasDiaMaquina = params.velocidadeGpm * params.minutosPorDia;
    const garrafasDiaVidro = (params.vidroTonDia * 1000000) / params.pesoMedio; // ton para g
    const garrafasDiaLimitante = Math.min(garrafasDiaMaquina, garrafasDiaVidro);
    const garrafasAno = garrafasDiaLimitante * params.diasAno;
    const gargalo = garrafasDiaMaquina < garrafasDiaVidro ? 'MÁQUINA' : 'VIDRO';

    // NOVOS CÁLCULOS DE MOLDES
    const vidaUtilPorMolde = 1000000; // 1 milhão de garrafas por molde
    const tamanhoSetMolde = 144; // 144 moldes por set
    const vidaUtilSetMoldes = vidaUtilPorMolde * tamanhoSetMolde; // 144.000.000 garrafas
    const setsDeMoldesAno = garrafasAno / vidaUtilSetMoldes; // Sets necessários por ano

    // Coroas e Anéis
    const coroasSet = cavidadesTotais * 2; // 2 coroas por cavidade
    const aneisSet = cavidadesTotais * 2; // 2 anéis por cavidade
    const coroasAno = Math.ceil((garrafasAno / params.vidaCoroa));
    const aneisAno = Math.ceil((garrafasAno / params.vidaAnel));
    const setsEquivCoroa = coroasAno / coroasSet;
    const setsEquivAnel = aneisAno / aneisSet;

    // Salvar resultados no storage
    const calcData = {
        params: params,
        resultados: {
            cavidadesTotais,
            garrafasDiaMaquina,
            garrafasDiaVidro,
            garrafasDiaLimitante,
            garrafasAno,
            gargalo,
            vidaUtilPorMolde,
            tamanhoSetMolde,
            vidaUtilSetMoldes,
            setsDeMoldesAno,
            coroasSet,
            aneisSet,
            coroasAno,
            aneisAno,
            setsEquivCoroa,
            setsEquivAnel
        }
    };
    
    localStorage.setItem('calculadoraMoldes_resultados', JSON.stringify(calcData));

    // Atualizar interface
    document.getElementById('calc_cavidades_totais').textContent = cavidadesTotais;
    document.getElementById('calc_cap_dia_maq').textContent = garrafasDiaMaquina.toLocaleString('pt-BR');
    document.getElementById('calc_cap_dia_vidro').textContent = garrafasDiaVidro.toLocaleString('pt-BR', {maximumFractionDigits: 0});
    document.getElementById('calc_prod_limitante').textContent = garrafasDiaLimitante.toLocaleString('pt-BR', {maximumFractionDigits: 0});
    document.getElementById('calc_prod_ano').textContent = garrafasAno.toLocaleString('pt-BR', {maximumFractionDigits: 0});
    document.getElementById('calc_gargalo').textContent = gargalo;
    
    // Mostrar cálculos de MOLDES
    document.getElementById('calc_vida_util_molde').textContent = vidaUtilPorMolde.toLocaleString('pt-BR');
    document.getElementById('calc_tamanho_set').textContent = tamanhoSetMolde;
    document.getElementById('calc_vida_util_set').textContent = vidaUtilSetMoldes.toLocaleString('pt-BR');
    document.getElementById('calc_sets_moldes_ano').textContent = setsDeMoldesAno.toFixed(4);
    
    document.getElementById('calc_coroas_set').textContent = coroasSet;
    document.getElementById('calc_aneis_set').textContent = aneisSet;
    document.getElementById('calc_coroas_ano').textContent = coroasAno.toLocaleString('pt-BR');
    document.getElementById('calc_aneis_ano').textContent = aneisAno.toLocaleString('pt-BR');
    document.getElementById('calc_sets_coroa').textContent = setsEquivCoroa.toFixed(8);
    document.getElementById('calc_sets_anel').textContent = setsEquivAnel.toFixed(8);

    // Mostrar seção de resultados
    document.getElementById('calc_resultados').style.display = 'block';

    // Recalcular resumo financeiro se houver itens
    this.calcularResumoFinanceiro();

    this.notification.show('success', 'Sucesso', 'Dimensionamento calculado com sucesso!');
};

AppManager.prototype.showItemMoldeForm = function(item = null) {
    const content = `
        <form id="itemMoldeForm">
            <div class="form-row">
                <div class="form-group">
                    <label>Item *</label>
                    <input type="number" name="item" value="${item && item.item || ''}" required min="1">
                </div>
                <div class="form-group">
                    <label>Tipo de Molde *</label>
                    <input type="text" name="tipoMolde" value="${item && item.tipoMolde || ''}" required placeholder="Ex: BLOW MOULD">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tradução *</label>
                    <input type="text" name="traducao" value="${item && item.traducao || ''}" required placeholder="Ex: MOLDE">
                </div>
                <div class="form-group">
                    <label>Classificação *</label>
                    <select name="classificacao" required>
                        <option value="">Selecione...</option>
                        <option value="MOULD" ${item && item.classificacao === 'MOULD' ? 'selected' : ''}>MOULD (Molde)</option>
                        <option value="ACESSÓRIO" ${item && item.classificacao === 'ACESSÓRIO' ? 'selected' : ''}>ACESSÓRIO</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Quantidade por SET *</label>
                    <input type="number" name="quantidadeSet" value="${item && item.quantidadeSet || ''}" required min="1">
                </div>
                <div class="form-group">
                    <label>Valor Unitário (€) *</label>
                    <input type="number" name="valorUnitario" value="${item && item.valorUnitario || ''}" required min="0" step="0.01" placeholder="0.00">
                </div>
            </div>
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <strong style="color: #2563eb;">ℹ️ Cálculo Automático</strong>
                <p style="margin: 5px 0 0 0; color: #475569;">Os valores totais serão calculados automaticamente com base no dimensionamento</p>
            </div>
        </form>
    `;

    this.modal.show(item ? 'Editar Item' : 'Adicionar Item', content, () => {
        const form = document.getElementById('itemMoldeForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }

        const formData = new FormData(form);
        const data = {
            item: parseInt(formData.get('item')),
            tipoMolde: formData.get('tipoMolde'),
            traducao: formData.get('traducao'),
            classificacao: formData.get('classificacao'),
            quantidadeSet: parseInt(formData.get('quantidadeSet')),
            valorUnitario: parseFloat(formData.get('valorUnitario'))
        };

        if (item) {
            this.storage.updateItem('itensMolde', item.id, data);
            this.notification.show('success', 'Sucesso', 'Item atualizado com sucesso!');
        } else {
            this.storage.addItem('itensMolde', data);
            this.notification.show('success', 'Sucesso', 'Item adicionado com sucesso!');
        }

        this.renderItensMolde();
        this.calcularResumoFinanceiro();
        return true;
    });
};

AppManager.prototype.renderItensMolde = function() {
    const items = this.storage.getModule('itensMolde');
    const tbody = document.getElementById('itensMoldeTable');
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-message">Nenhum item cadastrado</td></tr>';
        document.getElementById('calc_resumo_financeiro').style.display = 'none';
        return;
    }

    // Obter resultados do dimensionamento
    const calcDataStr = localStorage.getItem('calculadoraMoldes_resultados');
    const setsAno = calcDataStr ? JSON.parse(calcDataStr).params.setsAno : 5;

    tbody.innerHTML = items.map(item => {
        const classificacaoBadge = item.classificacao === 'MOULD' ? 'danger' : 'info';
        const valorTotalEur = item.quantidadeSet * item.valorUnitario;
        const quantidadeAno = item.quantidadeSet * setsAno;
        const valorTotalAnoEur = valorTotalEur * setsAno;
        
        return `
            <tr>
                <td><span class="badge badge-secondary">#${item.item}</span></td>
                <td>${item.tipoMolde}</td>
                <td>${item.traducao}</td>
                <td><span class="badge badge-${classificacaoBadge}">${item.classificacao}</span></td>
                <td><strong>${item.quantidadeSet}</strong></td>
                <td style="text-align: right;">€ ${item.valorUnitario.toFixed(2)}</td>
                <td style="text-align: right;"><strong style="color: #10b981;">€ ${valorTotalEur.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td><strong>${quantidadeAno}</strong></td>
                <td style="text-align: right;"><strong style="color: #ef4444;">€ ${valorTotalAnoEur.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.app.editItemMolde('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.deleteItemMolde('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Mostrar resumo financeiro
    document.getElementById('calc_resumo_financeiro').style.display = 'block';
};

AppManager.prototype.calcularResumoFinanceiro = function() {
    const items = this.storage.getModule('itensMolde');
    
    if (items.length === 0) {
        document.getElementById('calc_resumo_financeiro').style.display = 'none';
        return;
    }

    // Obter resultados do dimensionamento
    const calcDataStr = localStorage.getItem('calculadoraMoldes_resultados');
    if (!calcDataStr) {
        return;
    }

    const calcData = JSON.parse(calcDataStr);
    const setsAno = calcData.params.setsAno;
    const garrafasAno = calcData.resultados.garrafasAno;

    let totalSet = 0;
    let totalAno = 0;
    let mouldSet = 0;
    let acessorioSet = 0;
    let mouldAno = 0;
    let acessorioAno = 0;

    items.forEach(item => {
        const valorTotalItem = item.quantidadeSet * item.valorUnitario;
        const valorAnoItem = valorTotalItem * setsAno;
        
        totalSet += valorTotalItem;
        totalAno += valorAnoItem;

        if (item.classificacao === 'MOULD') {
            mouldSet += valorTotalItem;
            mouldAno += item.quantidadeSet * setsAno;
        } else {
            acessorioSet += valorTotalItem;
            acessorioAno += item.quantidadeSet * setsAno;
        }
    });

    const custoPorGarrafa = garrafasAno > 0 ? totalAno / garrafasAno : 0;

    // Atualizar interface
    document.getElementById('calc_total_set').textContent = `€ ${totalSet.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('calc_total_ano').textContent = `€ ${totalAno.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('calc_custo_garrafa').textContent = `€ ${custoPorGarrafa.toFixed(4)}`;
    document.getElementById('calc_mould_set').textContent = `€ ${mouldSet.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('calc_acessorio_set').textContent = `€ ${acessorioSet.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('calc_mould_ano').textContent = mouldAno.toLocaleString('pt-BR');
    document.getElementById('calc_acessorio_ano').textContent = acessorioAno.toLocaleString('pt-BR');

    document.getElementById('calc_resumo_financeiro').style.display = 'block';
};

AppManager.prototype.deleteItemMolde = function(id) {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        this.storage.deleteItem('itensMolde', id);
        this.notification.show('success', 'Sucesso', 'Item excluído com sucesso!');
        this.renderItensMolde();
        this.calcularResumoFinanceiro();
    }
};

AppManager.prototype.editItemMolde = function(id) {
    const items = this.storage.getModule('itensMolde');
    const item = items.find(i => i.id === id);
    if (item) this.showItemMoldeForm(item);
};

// Calculadora de COROAS
AppManager.prototype.calcularDimensionamentoCoroas = function() {
    // Obter valores dos inputs
    const params = {
        numeroMaquinas: parseFloat(document.getElementById('calc_coroa_numero_maquinas').value) || 0,
        velocidadeGpm: parseFloat(document.getElementById('calc_coroa_velocidade_gpm').value) || 0,
        minutosPorDia: parseFloat(document.getElementById('calc_coroa_minutos_dia').value) || 0,
        vidroTonDia: parseFloat(document.getElementById('calc_coroa_vidro_ton_dia').value) || 0,
        pesoMedio: parseFloat(document.getElementById('calc_coroa_peso_medio').value) || 0,
        diasAno: parseFloat(document.getElementById('calc_coroa_dias_ano').value) || 0,
        cavidadesMaq: parseFloat(document.getElementById('calc_coroa_cavidades_maq').value) || 0,
        vidaUtilCoroa: parseFloat(document.getElementById('calc_coroa_vida_util').value) || 0
    };

    // Validação
    if (params.numeroMaquinas === 0 || params.velocidadeGpm === 0) {
        this.notification.show('error', 'Erro', 'Por favor, preencha todos os campos obrigatórios!');
        return;
    }

    // Cálculos
    const cavidadesTotais = params.numeroMaquinas * params.cavidadesMaq;
    const garrafasDiaMaquina = params.velocidadeGpm * params.minutosPorDia;
    const garrafasDiaVidro = (params.vidroTonDia * 1000000) / params.pesoMedio;
    const garrafasDiaLimitante = Math.min(garrafasDiaMaquina, garrafasDiaVidro);
    const garrafasAno = garrafasDiaLimitante * params.diasAno;
    const gargalo = garrafasDiaMaquina < garrafasDiaVidro ? 'MÁQUINA' : 'VIDRO';

    // Cálculos específicos de COROAS
    const coroasPorCavidade = 2; // 2 coroas por cavidade
    const coroasNoSet = cavidadesTotais * coroasPorCavidade;
    const coroasNecessariasAno = Math.ceil(garrafasAno / params.vidaUtilCoroa);
    const setsEquivalentes = coroasNecessariasAno / coroasNoSet;

    // Salvar resultados no storage
    const calcData = {
        params: params,
        resultados: {
            cavidadesTotais,
            garrafasDiaMaquina,
            garrafasDiaVidro,
            garrafasDiaLimitante,
            garrafasAno,
            gargalo,
            coroasPorCavidade,
            coroasNoSet,
            coroasNecessariasAno,
            setsEquivalentes
        }
    };
    
    localStorage.setItem('calculadoraCoroas_resultados', JSON.stringify(calcData));

    // Atualizar interface
    document.getElementById('calc_coroa_cavidades_totais').textContent = cavidadesTotais;
    document.getElementById('calc_coroa_prod_dia').textContent = garrafasDiaLimitante.toLocaleString('pt-BR', {maximumFractionDigits: 0});
    document.getElementById('calc_coroa_prod_ano').textContent = garrafasAno.toLocaleString('pt-BR', {maximumFractionDigits: 0});
    document.getElementById('calc_coroa_gargalo').textContent = gargalo;
    
    document.getElementById('calc_coroa_por_cavidade').textContent = coroasPorCavidade;
    document.getElementById('calc_coroa_no_set').textContent = coroasNoSet;
    document.getElementById('calc_coroa_vida_util_display').textContent = params.vidaUtilCoroa.toLocaleString('pt-BR');
    document.getElementById('calc_coroa_necessarias_ano').textContent = coroasNecessariasAno.toLocaleString('pt-BR');
    document.getElementById('calc_coroa_sets_equiv').textContent = setsEquivalentes.toFixed(4);

    // Mostrar seção de resultados
    document.getElementById('calc_coroa_resultados').style.display = 'block';

    this.notification.show('success', 'Sucesso', 'Dimensionamento de COROAS calculado com sucesso!');
};

// ==================== SAÍDA DE MOLDES ====================

// ==========================================
// SAÍDA DE MOLDES - SISTEMA SIMPLIFICADO
// ==========================================
// SAÍDA DE MOLDES - NOVO FORMATO SIMPLIFICADO
// ==========================================

// Inicializar formulário de Saída de Moldes (novo formato)
AppManager.prototype.initSaidaMoldesForm = function() {
    // Definir data atual
    const inputData = document.getElementById('inputData');
    if (inputData) {
        inputData.value = new Date().toISOString().split('T')[0];
    }
    
    // Zerar todos os campos de quantidade
    const campos = ['qtdMolde', 'qtdPreMolde', 'qtdCoroa', 'qtdPuncao', 'qtdPostico'];
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = '0';
    });
    
    // Adicionar listeners para atualizar resumo
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('input', () => this.atualizarResumo());
        }
    });
    
    this.atualizarResumo();
};

// Atualizar resumo rápido
AppManager.prototype.atualizarResumo = function() {
    const qtdMolde = parseInt(document.getElementById('qtdMolde').value) || 0;
    const qtdPreMolde = parseInt(document.getElementById('qtdPreMolde').value) || 0;
    const qtdCoroa = parseInt(document.getElementById('qtdCoroa').value) || 0;
    const qtdPuncao = parseInt(document.getElementById('qtdPuncao').value) || 0;
    const qtdPostico = parseInt(document.getElementById('qtdPostico').value) || 0;
    
    const total = qtdMolde + qtdPreMolde + qtdCoroa + qtdPuncao + qtdPostico;
    
    const resumoDiv = document.getElementById('resumoRapido');
    const textoResumo = document.getElementById('textoResumo');
    
    if (total > 0) {
        resumoDiv.style.display = 'block';
        
        let itensComQuantidade = [];
        if (qtdMolde > 0) itensComQuantidade.push(`${qtdMolde} Molde(s)`);
        if (qtdPreMolde > 0) itensComQuantidade.push(`${qtdPreMolde} Pré Molde(s)`);
        if (qtdCoroa > 0) itensComQuantidade.push(`${qtdCoroa} Coroa(s)`);
        if (qtdPuncao > 0) itensComQuantidade.push(`${qtdPuncao} Punção(ões)`);
        if (qtdPostico > 0) itensComQuantidade.push(`${qtdPostico} Postiço(s)`);
        
        textoResumo.innerHTML = `<strong>Total: ${total} unidades</strong> → ${itensComQuantidade.join(' + ')}`;
    } else {
        resumoDiv.style.display = 'none';
    }
};

// Limpar formulário novo
AppManager.prototype.limparFormularioSaidaNovo = function() {
    document.getElementById('inputData').value = new Date().toISOString().split('T')[0];
    document.getElementById('inputMaquina').value = '';
    
    const campos = ['qtdMolde', 'qtdPreMolde', 'qtdCoroa', 'qtdPuncao', 'qtdPostico'];
    campos.forEach(id => {
        document.getElementById(id).value = '0';
    });
    
    this.atualizarResumo();
};

// Salvar saída completa (novo formato)
AppManager.prototype.salvarSaidaCompletaNovo = function() {
    const data = document.getElementById('inputData').value;
    const maquina = document.getElementById('inputMaquina').value;
    
    // Validar data e máquina
    if (!data || !maquina) {
        this.showNotification('Selecione a data e a máquina', 'error');
        return;
    }
    
    // Pegar quantidades
    const qtdMolde = parseInt(document.getElementById('qtdMolde').value) || 0;
    const qtdPreMolde = parseInt(document.getElementById('qtdPreMolde').value) || 0;
    const qtdCoroa = parseInt(document.getElementById('qtdCoroa').value) || 0;
    const qtdPuncao = parseInt(document.getElementById('qtdPuncao').value) || 0;
    const qtdPostico = parseInt(document.getElementById('qtdPostico').value) || 0;
    
    // Validar se há pelo menos um item
    const total = qtdMolde + qtdPreMolde + qtdCoroa + qtdPuncao + qtdPostico;
    if (total === 0) {
        this.showNotification('Informe pelo menos uma quantidade', 'warning');
        return;
    }
    
    // Pegar registros existentes do localStorage
    let saidas = [];
    try {
        const stored = localStorage.getItem('moldes_management');
        if (stored) {
            const allData = JSON.parse(stored);
            saidas = allData.saidaMoldes || [];
        }
    } catch (e) {
        saidas = [];
    }
    
    // Criar registros para cada item com quantidade > 0
    const itens = [
        { nome: 'Molde', qtd: qtdMolde },
        { nome: 'Pré Molde', qtd: qtdPreMolde },
        { nome: 'Coroa', qtd: qtdCoroa },
        { nome: 'Punção', qtd: qtdPuncao },
        { nome: 'Postiço', qtd: qtdPostico }
    ];
    
    let registrosCriados = 0;
    itens.forEach(item => {
        if (item.qtd > 0) {
            const registro = {
                id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
                data: data,
                maquina: maquina,
                item: item.nome,
                quantidade: item.qtd,
                created_at: new Date().toISOString()
            };
            saidas.push(registro);
            registrosCriados++;
        }
    });
    
    // Salvar no localStorage
    try {
        const stored = localStorage.getItem('moldes_management');
        const allData = stored ? JSON.parse(stored) : {};
        allData.saidaMoldes = saidas;
        localStorage.setItem('moldes_management', JSON.stringify(allData));
    } catch (e) {
        this.showNotification('Erro ao salvar: ' + e.message, 'error');
        return;
    }
    
    // Atualizar storage interno
    this.storage.data.saidaMoldes = saidas;
    
    // Limpar formulário
    this.limparFormularioSaidaNovo();
    
    // Atualizar visualizações
    this.renderSaidaMoldes();
    
    // Notificação de sucesso
    this.showNotification(
        `✅ Saída registrada! ${registrosCriados} tipo(s) de item | ${total} unidades | Data: ${new Date(data).toLocaleDateString('pt-BR')} | Máquina ${maquina}`,
        'success'
    );
};

// ==========================================
// FUNÇÕES ANTIGAS (manter compatibilidade)
// ==========================================

// Array temporário para armazenar itens antes de salvar
AppManager.prototype.itensTemporarios = [];
AppManager.prototype.adicionarItemTemporario = function() {
    const item = document.getElementById('inputItem').value;
    const quantidade = document.getElementById('inputQuantidade').value;
    
    if (!item) {
        this.showNotification('Selecione um item', 'warning');
        return;
    }
    
    if (!quantidade || quantidade <= 0) {
        this.showNotification('Informe uma quantidade válida', 'warning');
        return;
    }
    
    // Adicionar ao array temporário
    this.itensTemporarios.push({
        item: item,
        quantidade: parseInt(quantidade)
    });
    
    // Limpar campos de item e quantidade
    document.getElementById('inputItem').value = '';
    document.getElementById('inputQuantidade').value = '1';
    
    // Renderizar lista
    this.renderItensTemporarios();
    
    // Habilitar botão salvar
    document.getElementById('btnSalvarSaida').disabled = false;
    
    this.showNotification('Item adicionado! Adicione mais ou clique em "Salvar Tudo"', 'success');
};

// Renderizar lista de itens temporários
AppManager.prototype.renderItensTemporarios = function() {
    const container = document.getElementById('listaItensTemporarios');
    
    if (this.itensTemporarios.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary); font-style: italic;">
                <i class="fas fa-inbox"></i> Nenhum item adicionado ainda
            </div>
        `;
        return;
    }
    
    let html = '<div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 15px;">';
    html += '<h5 style="color: var(--text-primary); margin-bottom: 12px; font-size: 14px; font-weight: 600;">Itens a serem salvos:</h5>';
    html += '<div style="display: flex; flex-direction: column; gap: 8px;">';
    
    this.itensTemporarios.forEach((item, index) => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--dark-bg-tertiary); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
                <div style="display: flex; gap: 15px; align-items: center;">
                    <span style="color: var(--text-primary); font-weight: 500;">
                        <i class="fas fa-box" style="color: #3b82f6; margin-right: 8px;"></i>
                        ${item.item}
                    </span>
                    <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">
                        ${item.quantidade} un
                    </span>
                </div>
                <button onclick="window.app.removerItemTemporario(${index})" 
                        style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;"
                        onmouseover="this.style.background='rgba(239, 68, 68, 0.3)'"
                        onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">
                    <i class="fas fa-trash"></i> Remover
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Resumo
    const totalItens = this.itensTemporarios.length;
    const totalQuantidade = this.itensTemporarios.reduce((sum, item) => sum + item.quantidade, 0);
    
    html += `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: var(--text-secondary);">
                <i class="fas fa-layer-group"></i> Total de tipos: <strong style="color: var(--text-primary);">${totalItens}</strong>
            </span>
            <span style="color: var(--text-secondary);">
                <i class="fas fa-cubes"></i> Total de unidades: <strong style="color: var(--text-primary);">${totalQuantidade}</strong>
            </span>
        </div>
    `;
    
    html += '</div>';
    container.innerHTML = html;
};

// Remover item temporário
AppManager.prototype.removerItemTemporario = function(index) {
    this.itensTemporarios.splice(index, 1);
    this.renderItensTemporarios();
    
    // Desabilitar botão salvar se não houver itens
    if (this.itensTemporarios.length === 0) {
        document.getElementById('btnSalvarSaida').disabled = true;
    }
    
    this.showNotification('Item removido', 'info');
};

// Salvar toda a saída completa
AppManager.prototype.salvarSaidaCompleta = function() {
    const data = document.getElementById('inputData').value;
    const maquina = document.getElementById('inputMaquina').value;
    
    // Validar data e máquina
    if (!data || !maquina) {
        this.showNotification('Selecione a data e a máquina primeiro', 'error');
        return;
    }
    
    // Validar se há itens
    if (this.itensTemporarios.length === 0) {
        this.showNotification('Adicione pelo menos um item antes de salvar', 'warning');
        return;
    }
    
    // Pegar registros existentes do localStorage
    let saidas = [];
    try {
        const stored = localStorage.getItem('moldes_management');
        if (stored) {
            const allData = JSON.parse(stored);
            saidas = allData.saidaMoldes || [];
        }
    } catch (e) {
        saidas = [];
    }
    
    // Criar um registro para cada item
    this.itensTemporarios.forEach(itemTemp => {
        const registro = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            data: data,
            maquina: maquina,
            item: itemTemp.item,
            quantidade: itemTemp.quantidade,
            created_at: new Date().toISOString()
        };
        saidas.push(registro);
    });
    
    // Salvar no localStorage
    try {
        const stored = localStorage.getItem('moldes_management');
        const allData = stored ? JSON.parse(stored) : {};
        allData.saidaMoldes = saidas;
        localStorage.setItem('moldes_management', JSON.stringify(allData));
    } catch (e) {
        this.showNotification('Erro ao salvar: ' + e.message, 'error');
        return;
    }
    
    // Atualizar storage interno
    this.storage.data.saidaMoldes = saidas;
    
    // Limpar tudo
    this.limparFormularioSaida();
    
    // Atualizar visualizações
    this.renderSaidaMoldes();
    
    // Notificação de sucesso
    const totalItens = this.itensTemporarios.length;
    const totalUnidades = this.itensTemporarios.reduce((sum, item) => sum + item.quantidade, 0);
    
    this.showNotification(
        `✅ Saída registrada com sucesso!\n${totalItens} tipo(s) de item | ${totalUnidades} unidades totais\nData: ${new Date(data).toLocaleDateString('pt-BR')} | Máquina ${maquina}`,
        'success'
    );
};

// Limpar formulário
AppManager.prototype.limparFormularioSaida = function() {
    // Limpar campos
    document.getElementById('inputData').value = new Date().toISOString().split('T')[0];
    document.getElementById('inputMaquina').value = '';
    document.getElementById('inputItem').value = '';
    document.getElementById('inputQuantidade').value = '1';
    
    // Limpar array temporário
    this.itensTemporarios = [];
    this.renderItensTemporarios();
    
    // Desabilitar botão salvar
    document.getElementById('btnSalvarSaida').disabled = true;
};

// Editar registro existente (via modal)
AppManager.prototype.editarSaidaMolde = function(id) {
    console.log('✏️ Editando registro:', id);
    
    const saidas = this.storage.getModule('saidaMoldes') || [];
    const registro = saidas.find(s => s.id === id);
    
    if (!registro) {
        this.notification.show('error', 'Erro', 'Registro não encontrado');
        return;
    }
    
    const formHtml = `
        <form id="formEditarSaida">
            <div class="form-row">
                <div class="form-group">
                    <label>Data *</label>
                    <input type="date" id="editData" value="${registro.data}" required>
                </div>
                <div class="form-group">
                    <label>Máquina *</label>
                    <select id="editMaquina" required>
                        <option value="591" ${registro.maquina === '591' ? 'selected' : ''}>Máquina 591</option>
                        <option value="592" ${registro.maquina === '592' ? 'selected' : ''}>Máquina 592</option>
                        <option value="593" ${registro.maquina === '593' ? 'selected' : ''}>Máquina 593</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Item *</label>
                    <select id="editItem" required>
                        <option value="Molde" ${registro.item === 'Molde' ? 'selected' : ''}>Molde</option>
                        <option value="Pré Molde" ${registro.item === 'Pré Molde' ? 'selected' : ''}>Pré Molde</option>
                        <option value="Coroa" ${registro.item === 'Coroa' ? 'selected' : ''}>Coroa</option>
                        <option value="Punção" ${registro.item === 'Punção' ? 'selected' : ''}>Punção</option>
                        <option value="Postiço" ${registro.item === 'Postiço' ? 'selected' : ''}>Postiço</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantidade *</label>
                    <input type="number" id="editQuantidade" value="${registro.quantidade}" min="1" required>
                </div>
            </div>
        </form>
    `;
    
    this.modal.show('Editar Registro', formHtml, () => {
        const form = document.getElementById('formEditarSaida');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }
        
        // Atualizar dados
        registro.data = document.getElementById('editData').value;
        registro.maquina = document.getElementById('editMaquina').value;
        registro.item = document.getElementById('editItem').value;
        registro.quantidade = parseInt(document.getElementById('editQuantidade').value);
        registro.updated_at = new Date().toISOString();
        
        // Salvar
        this.storage.saveModule('saidaMoldes', saidas);
        this.renderSaidaMoldes();
        this.notification.show('success', 'Sucesso', 'Registro atualizado com sucesso!');
        
        return true;
    });
};

// Excluir registro
AppManager.prototype.deleteSaidaMolde = function(id) {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    
    console.log('🗑️ Excluindo registro:', id);
    
    const saidas = this.storage.getModule('saidaMoldes') || [];
    const filtered = saidas.filter(s => s.id !== id);
    
    this.storage.saveModule('saidaMoldes', filtered);
    this.renderSaidaMoldes();
    this.notification.show('success', 'Sucesso', 'Registro excluído com sucesso!');
};

// Renderizar tabela com filtros
AppManager.prototype.renderSaidaMoldes = function(filtrarDados = null) {
    console.log('🔄 Renderizando tabela...');
    
    const tbody = document.getElementById('saidaMoldesTable');
    if (!tbody) {
        console.log('⚠️ Tabela não encontrada');
        return;
    }
    
    // Pegar dados do localStorage
    let saidas = [];
    try {
        const stored = localStorage.getItem('moldes_management');
        if (stored) {
            const allData = JSON.parse(stored);
            saidas = allData.saidaMoldes || [];
        }
    } catch (e) {
        console.log('⚠️ Erro ao ler dados');
        saidas = [];
    }
    
    console.log('📊 Registros encontrados:', saidas.length);
    
    // Aplicar filtros se fornecidos
    if (filtrarDados) {
        saidas = saidas.filter(s => {
            if (filtrarDados.data && s.data !== filtrarDados.data) return false;
            if (filtrarDados.maquina && s.maquina !== filtrarDados.maquina) return false;
            if (filtrarDados.item && s.item !== filtrarDados.item) return false;
            return true;
        });
    }
    
    if (saidas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">Nenhum registro encontrado.</td></tr>';
        this.updateDashboardSaidaMoldes([]);
        return;
    }
    
    // Ordenar por data
    saidas.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Renderizar linhas
    tbody.innerHTML = saidas.map(saida => {
        const dataFormatada = new Date(saida.data + 'T00:00:00').toLocaleDateString('pt-BR');
        return `
            <tr>
                <td><strong>${dataFormatada}</strong></td>
                <td><span class="badge badge-info">Máquina ${saida.maquina}</span></td>
                <td><strong style="color: var(--primary-color);">${saida.item}</strong></td>
                <td><span class="badge badge-success">${saida.quantidade} un</span></td>
                <td class="actions">
                    <button class="btn-icon btn-edit" onclick="app.editarSaidaMolde('${saida.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="app.excluirSaida('${saida.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Atualizar dashboard
    this.updateDashboardSaidaMoldes(saidas);
    
    console.log('✅ Tabela renderizada');
};

// Editar registro
AppManager.prototype.editarSaidaMolde = function(id) {
    try {
        const stored = localStorage.getItem('moldes_management');
        const allData = stored ? JSON.parse(stored) : {};
        const saidas = allData.saidaMoldes || [];
        const registro = saidas.find(s => s.id === id);
        
        if (!registro) {
            alert('Registro não encontrado!');
            return;
        }
        
        const data = prompt('Data (AAAA-MM-DD):', registro.data);
        if (!data) return;
        
        const maquina = prompt('Máquina (591, 592 ou 593):', registro.maquina);
        if (!maquina) return;
        
        const item = prompt('Item:', registro.item);
        if (!item) return;
        
        const quantidade = prompt('Quantidade:', registro.quantidade);
        if (!quantidade) return;
        
        // Atualizar
        registro.data = data;
        registro.maquina = maquina;
        registro.item = item;
        registro.quantidade = parseInt(quantidade);
        registro.updated_at = new Date().toISOString();
        
        allData.saidaMoldes = saidas;
        localStorage.setItem('moldes_management', JSON.stringify(allData));
        
        this.renderSaidaMoldes();
        alert('Registro atualizado!');
    } catch (e) {
        alert('Erro ao editar: ' + e.message);
    }
};

// Filtros - Toggle painel
AppManager.prototype.toggleFiltrosSaida = function() {
    const painel = document.getElementById('painelFiltrosSaida');
    if (painel) {
        painel.style.display = painel.style.display === 'none' ? 'block' : 'none';
    }
};

// Aplicar filtros
AppManager.prototype.aplicarFiltrosSaida = function() {
    const filtroData = document.getElementById('filtroData').value;
    const filtroMaquina = document.getElementById('filtroMaquina').value;
    const filtroItem = document.getElementById('filtroItem').value;
    
    const filtros = {
        data: filtroData || null,
        maquina: filtroMaquina || null,
        item: filtroItem || null
    };
    
    this.renderSaidaMoldes(filtros);
};

// Limpar filtros
AppManager.prototype.limparFiltrosSaida = function() {
    document.getElementById('filtroData').value = '';
    document.getElementById('filtroMaquina').value = '';
    document.getElementById('filtroItem').value = '';
    this.renderSaidaMoldes();
};

// Filtro Global de Item para Gráficos
AppManager.prototype.aplicarFiltroGlobalGraficos = function() {
    console.log('🔍 Aplicando filtro global de item nos gráficos...');
    
    const filtroItem = document.getElementById('filtroGlobalItem').value;
    console.log('📦 Item selecionado:', filtroItem || 'Todos');
    
    // Obter todos os dados
    let saidas = [];
    try {
        const stored = localStorage.getItem('moldes_management');
        if (stored) {
            const allData = JSON.parse(stored);
            saidas = allData.saidaMoldes || [];
        }
    } catch (e) {
        console.log('⚠️ Erro ao ler dados');
        saidas = [];
    }
    
    // Aplicar filtro de item se selecionado
    if (filtroItem) {
        saidas = saidas.filter(s => s.item === filtroItem);
        console.log(`✅ Dados filtrados: ${saidas.length} registros do item "${filtroItem}"`);
    } else {
        console.log(`✅ Todos os itens: ${saidas.length} registros`);
    }
    
    // Calcular o valor máximo de todos os gráficos para sincronizar a escala Y
    const maxY = this.calcularMaximoGraficosTendencia(saidas);
    console.log('📊 Escala Y máxima unificada:', maxY);
    
    // Redesenhar os 4 gráficos de tendência com os dados filtrados e escala Y sincronizada
    this.renderGraficoTendenciaTotal(saidas, maxY);
    this.renderGraficoTendenciaMaquina(saidas, '591', 'chartTendenciaMaq591', '#3b82f6', maxY);
    this.renderGraficoTendenciaMaquina(saidas, '592', 'chartTendenciaMaq592', '#10b981', maxY);
    this.renderGraficoTendenciaMaquina(saidas, '593', 'chartTendenciaMaq593', '#f59e0b', maxY);
    
    console.log('✅ Gráficos atualizados com filtro de item e escala Y sincronizada');
};

// Calcular o valor máximo para sincronizar a escala Y dos gráficos de tendência
AppManager.prototype.calcularMaximoGraficosTendencia = function(saidas) {
    // Últimos 30 dias
    const hoje = new Date();
    const dias = {};
    
    // Inicializar últimos 30 dias com zero
    for (let i = 29; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        dias[dataStr] = 0;
    }
    
    // Calcular valores para cada gráfico
    let maxTotal = 0;
    let max591 = 0;
    let max592 = 0;
    let max593 = 0;
    
    // 1. Gráfico Total (soma de todas as máquinas por dia)
    const diasTotal = {...dias};
    saidas.forEach(s => {
        if (diasTotal.hasOwnProperty(s.data)) {
            diasTotal[s.data] += s.quantidade;
        }
    });
    maxTotal = Math.max(...Object.values(diasTotal));
    
    // 2. Gráfico Máquina 591
    const dias591 = {...dias};
    saidas.filter(s => s.maquina === '591').forEach(s => {
        if (dias591.hasOwnProperty(s.data)) {
            dias591[s.data] += s.quantidade;
        }
    });
    max591 = Math.max(...Object.values(dias591));
    
    // 3. Gráfico Máquina 592
    const dias592 = {...dias};
    saidas.filter(s => s.maquina === '592').forEach(s => {
        if (dias592.hasOwnProperty(s.data)) {
            dias592[s.data] += s.quantidade;
        }
    });
    max592 = Math.max(...Object.values(dias592));
    
    // 4. Gráfico Máquina 593
    const dias593 = {...dias};
    saidas.filter(s => s.maquina === '593').forEach(s => {
        if (dias593.hasOwnProperty(s.data)) {
            dias593[s.data] += s.quantidade;
        }
    });
    max593 = Math.max(...Object.values(dias593));
    
    // Retornar o máximo entre todos os gráficos + margem de 10%
    const maxGeral = Math.max(maxTotal, max591, max592, max593);
    const maxComMargem = Math.ceil(maxGeral * 1.1); // +10% de margem
    
    // Arredondar para múltiplo de 10 para eixo Y mais limpo
    return Math.ceil(maxComMargem / 10) * 10;
};

// Excluir registro
AppManager.prototype.excluirSaida = function(id) {
    if (!confirm('Excluir este registro?')) return;
    
    try {
        const stored = localStorage.getItem('moldes_management');
        const allData = stored ? JSON.parse(stored) : {};
        const saidas = allData.saidaMoldes || [];
        
        allData.saidaMoldes = saidas.filter(s => s.id !== id);
        localStorage.setItem('moldes_management', JSON.stringify(allData));
        
        this.renderSaidaMoldes();
        alert('Registro excluído!');
    } catch (e) {
        alert('Erro ao excluir: ' + e.message);
    }
};

AppManager.prototype.updateDashboardSaidaMoldes = function(saidas) {
    // KPIs
    const totalSaidasEl = document.getElementById('totalSaidas');
    const totalItensEl = document.getElementById('totalItens');
    const saidasMesEl = document.getElementById('saidasMes');
    const itemMaisFrequenteEl = document.getElementById('itemMaisFrequente');
    
    if (!totalSaidasEl) return; // Se não estiver na aba, sair
    
    // Total de saídas
    totalSaidasEl.textContent = saidas.length;
    
    // Total de itens
    const totalItens = saidas.reduce((sum, s) => sum + s.quantidade, 0);
    totalItensEl.textContent = totalItens.toLocaleString('pt-BR');
    
    // Saídas este mês
    const now = new Date();
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();
    const saidasMes = saidas.filter(s => {
        const data = new Date(s.data);
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });
    saidasMesEl.textContent = saidasMes.length;
    
    // Item mais frequente
    if (saidas.length > 0) {
        const itemCount = {};
        saidas.forEach(s => {
            itemCount[s.item] = (itemCount[s.item] || 0) + 1;
        });
        const maisFrequente = Object.keys(itemCount).reduce((a, b) => 
            itemCount[a] > itemCount[b] ? a : b
        );
        itemMaisFrequenteEl.textContent = maisFrequente;
    } else {
        itemMaisFrequenteEl.textContent = '-';
    }
    
    // Gráficos
    this.renderGraficoSaidasPorItem(saidas);
    this.renderGraficoSaidasPorMaquina(saidas);
    
    // Calcular o valor máximo de todos os gráficos para sincronizar a escala Y
    const maxY = this.calcularMaximoGraficosTendencia(saidas);
    
    // Gráfico TOTAL (soma das 3 máquinas) com escala Y sincronizada
    this.renderGraficoTendenciaTotal(saidas, maxY);
    
    // Gráficos de tendência por máquina com escala Y sincronizada
    this.renderGraficoTendenciaMaquina(saidas, '591', 'chartTendenciaMaq591', '#3b82f6', maxY);
    this.renderGraficoTendenciaMaquina(saidas, '592', 'chartTendenciaMaq592', '#10b981', maxY);
    this.renderGraficoTendenciaMaquina(saidas, '593', 'chartTendenciaMaq593', '#f59e0b', maxY);
};

AppManager.prototype.renderGraficoSaidasPorItem = function(saidas) {
    const canvas = document.getElementById('chartSaidasPorItem');
    if (!canvas) return;
    
    // Destruir gráfico anterior se existir
    if (this.chartSaidasPorItem) {
        this.chartSaidasPorItem.destroy();
    }
    
    // Agrupar por item
    const itemData = {};
    saidas.forEach(s => {
        itemData[s.item] = (itemData[s.item] || 0) + s.quantidade;
    });
    
    const ctx = canvas.getContext('2d');
    this.chartSaidasPorItem = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(itemData),
            datasets: [{
                data: Object.values(itemData),
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#8b5cf6',
                    '#ef4444'
                ],
                borderWidth: 0
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
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + ' un';
                        }
                    }
                }
            }
        }
    });
};

AppManager.prototype.renderGraficoSaidasPorMaquina = function(saidas) {
    const canvas = document.getElementById('chartSaidasPorMaquina');
    if (!canvas) return;
    
    // Destruir gráfico anterior se existir
    if (this.chartSaidasPorMaquina) {
        this.chartSaidasPorMaquina.destroy();
    }
    
    // Agrupar por máquina
    const maquinaData = {};
    saidas.forEach(s => {
        const key = 'Máquina ' + s.maquina;
        maquinaData[key] = (maquinaData[key] || 0) + s.quantidade;
    });
    
    const ctx = canvas.getContext('2d');
    this.chartSaidasPorMaquina = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(maquinaData),
            datasets: [{
                label: 'Quantidade',
                data: Object.values(maquinaData),
                backgroundColor: '#3b82f6',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Quantidade: ' + context.parsed.y + ' un';
                        }
                    }
                }
            }
        }
    });
};

// Gráfico de Tendência por Máquina (estilo da imagem: linha suave com área preenchida)
// Gráfico de Tendência Total (Soma das 3 Máquinas)
AppManager.prototype.renderGraficoTendenciaTotal = function(saidas, maxY) {
    const canvas = document.getElementById('chartTendenciaTotal');
    if (!canvas) return;
    
    // Destruir gráfico anterior se existir
    if (this.chartTendenciaTotal) {
        this.chartTendenciaTotal.destroy();
    }
    
    // Últimos 30 dias
    const hoje = new Date();
    const dias = {};
    
    // Inicializar últimos 30 dias com zero
    for (let i = 29; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        dias[dataStr] = 0;
    }
    
    // Somar quantidades de TODAS as máquinas por dia
    saidas.forEach(s => {
        if (dias.hasOwnProperty(s.data)) {
            dias[s.data] += s.quantidade;
        }
    });
    
    // Preparar labels (formato dd/mm)
    const labels = Object.keys(dias).map(d => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    
    const valores = Object.values(dias);
    
    // Atualizar total geral no badge
    const totalGeralEl = document.getElementById('totalGeralMaq');
    if (totalGeralEl) {
        const totalGeral = saidas.reduce((sum, s) => sum + s.quantidade, 0);
        totalGeralEl.textContent = totalGeral.toLocaleString('pt-BR') + ' un';
    }
    
    // Criar gráfico: linha suave roxa com área preenchida
    const ctx = canvas.getContext('2d');
    this.chartTendenciaTotal = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Geral',
                data: valores,
                borderColor: '#8b5cf6',
                backgroundColor: '#8b5cf633', // 20% opacity
                borderWidth: 3,
                fill: true,
                tension: 0.4, // Linha suave/curva
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#1e293b',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#8b5cf6',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#8b5cf6',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: (context) => context[0].label,
                        label: (context) => 'Quantidade: ' + context.parsed.y + ' un'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: maxY || undefined, // Usar maxY sincronizado ou auto
                    ticks: {
                        color: '#64748b',
                        font: { size: 11 },
                        stepSize: maxY ? Math.ceil(maxY / 5) : 50, // Ajustar stepSize baseado no max
                        callback: (value) => value
                    },
                    grid: {
                        color: '#334155',
                        borderColor: 'transparent'
                    }
                },
                x: {
                    ticks: {
                        color: '#64748b',
                        font: { size: 10 },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 15
                    },
                    grid: {
                        display: false,
                        borderColor: 'transparent'
                    }
                }
            }
        }
    });
};

AppManager.prototype.renderGraficoTendenciaMaquina = function(saidas, maquina, canvasId, cor, maxY) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Destruir gráfico anterior se existir
    const chartKey = 'chart_' + canvasId;
    if (this[chartKey]) {
        this[chartKey].destroy();
    }
    
    // Filtrar saídas da máquina específica
    const saidasMaquina = saidas.filter(s => s.maquina === maquina);
    
    // Últimos 30 dias
    const hoje = new Date();
    const dias = {};
    
    // Inicializar últimos 30 dias com zero
    for (let i = 29; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        dias[dataStr] = 0;
    }
    
    // Contar saídas por dia
    saidasMaquina.forEach(s => {
        if (dias.hasOwnProperty(s.data)) {
            dias[s.data] += s.quantidade;
        }
    });
    
    // Preparar labels (formato dd/mm)
    const labels = Object.keys(dias).map(d => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    
    const valores = Object.values(dias);
    
    // Atualizar total da máquina no badge
    const totalMaqEl = document.getElementById('totalMaq' + maquina);
    if (totalMaqEl) {
        const totalMaq = saidasMaquina.reduce((sum, s) => sum + s.quantidade, 0);
        totalMaqEl.textContent = totalMaq.toLocaleString('pt-BR') + ' un';
    }
    
    // Criar gráfico estilo imagem: linha suave com área preenchida
    const ctx = canvas.getContext('2d');
    this[chartKey] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade',
                data: valores,
                borderColor: cor,
                backgroundColor: cor + '33', // 20% opacity
                borderWidth: 2.5,
                fill: true,
                tension: 0.4, // Linha suave/curva
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: cor,
                pointBorderColor: '#1e293b',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: cor,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: { 
                    display: false 
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#1e293b',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: cor,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            return 'Quantidade: ' + context.parsed.y + ' un';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: maxY || undefined, // Usar maxY sincronizado ou auto
                    ticks: { 
                        color: '#64748b',
                        font: {
                            size: 11
                        },
                        stepSize: maxY ? Math.ceil(maxY / 5) : 20, // Ajustar stepSize baseado no max
                        callback: function(value) {
                            return value;
                        }
                    },
                    grid: { 
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    border: {
                        display: false
                    }
                },
                x: {
                    ticks: { 
                        color: '#64748b',
                        font: {
                            size: 10
                        },
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 15
                    },
                    grid: { 
                        display: false 
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });
};

// Gráfico de Tendência TOTAL (soma das 3 máquinas)
AppManager.prototype.renderGraficoTendenciaTotal = function(saidas) {
    const canvas = document.getElementById('chartTendenciaTotal');
    if (!canvas) return;
    
    // Destruir gráfico anterior se existir
    const chartKey = 'chart_tendencia_total';
    if (this[chartKey]) {
        this[chartKey].destroy();
    }
    
    // Últimos 30 dias
    const hoje = new Date();
    const dias = {};
    
    // Inicializar últimos 30 dias com zero
    for (let i = 29; i >= 0; i--) {
        const data = new Date(hoje);
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        dias[dataStr] = 0;
    }
    
    // Somar todas as saídas (de todas as máquinas) por dia
    saidas.forEach(s => {
        if (dias.hasOwnProperty(s.data)) {
            dias[s.data] += s.quantidade;
        }
    });
    
    // Preparar labels (formato dd/mm)
    const labels = Object.keys(dias).map(d => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    
    const valores = Object.values(dias);
    
    // Atualizar total geral no badge
    const totalGeralEl = document.getElementById('totalGeralMaq');
    if (totalGeralEl) {
        const totalGeral = saidas.reduce((sum, s) => sum + s.quantidade, 0);
        totalGeralEl.textContent = totalGeral.toLocaleString('pt-BR') + ' un';
    }
    
    // Criar gráfico total (roxo)
    const ctx = canvas.getContext('2d');
    this[chartKey] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Geral',
                data: valores,
                borderColor: '#8b5cf6',
                backgroundColor: '#8b5cf633', // 20% opacity
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#1e293b',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#8b5cf6',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: { 
                    display: false 
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#1e293b',
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0',
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            return 'Total Geral: ' + context.parsed.y + ' un';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: '#64748b',
                        font: {
                            size: 11
                        },
                        stepSize: 30,
                        callback: function(value) {
                            return value;
                        }
                    },
                    grid: { 
                        color: 'rgba(139, 92, 246, 0.1)',
                        drawBorder: false
                    },
                    border: {
                        display: false
                    }
                },
                x: {
                    ticks: { 
                        color: '#64748b',
                        font: {
                            size: 10
                        },
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 15
                    },
                    grid: { 
                        display: false 
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });
};

// Initialize app
// Inicialização global
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppManager();
});