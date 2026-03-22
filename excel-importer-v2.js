/**
 * SISTEMA DE IMPORTAÇÃO EXCEL - VERSÃO 2.0
 * Data: 17/03/2026
 * 
 * Melhorias:
 * - Validação robusta de arquivos
 * - Mensagens de erro detalhadas
 * - Logs completos no console
 * - Tratamento de diferentes formatos Excel
 * - Merge inteligente de dados
 */

class ExcelImporterV2 {
    constructor(app) {
        this.app = app;
        this.supportedFormats = ['.xlsx', '.xls', '.csv'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.debugMode = true;
        
        this.log('✅ Sistema de Importação Excel V2 inicializado');
    }

    /**
     * Log para debug
     */
    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[ExcelImporter] ${message}`, data || '');
        }
    }

    /**
     * Log de erro
     */
    error(message, error = null) {
        console.error(`[ExcelImporter ERROR] ${message}`, error || '');
    }

    /**
     * Cria botão de importação para uma aba específica
     */
    createImportButton(moduleName, containerSelector) {
        this.log(`Criando botão de importação para: ${moduleName}`);
        
        const container = document.querySelector(containerSelector);
        if (!container) {
            this.error(`Container não encontrado: ${containerSelector}`);
            return;
        }

        const buttonHTML = `
            <div class="excel-import-panel" style="margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 15px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px;">
                        <h3 style="margin: 0 0 8px 0; color: white; font-size: 18px; font-weight: 600;">
                            📊 Importação Excel
                        </h3>
                        <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 14px; line-height: 1.5;">
                            Selecione um arquivo Excel (.xlsx, .xls, .csv) para preencher automaticamente os dados desta aba
                        </p>
                    </div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <input 
                            type="file" 
                            id="excel-file-${moduleName}" 
                            accept=".xlsx,.xls,.csv"
                            style="display: none;"
                        />
                        <button 
                            onclick="document.getElementById('excel-file-${moduleName}').click()"
                            class="btn-select-file"
                            style="
                                padding: 12px 24px;
                                background: white;
                                color: #667eea;
                                border: none;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: 600;
                                font-size: 14px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                                transition: all 0.3s ease;
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.15)'"
                        >
                            📁 Selecionar Arquivo
                        </button>
                        <button 
                            onclick="window.excelImporterV2.downloadTemplate('${moduleName}')"
                            class="btn-download-template"
                            style="
                                padding: 12px 24px;
                                background: rgba(255,255,255,0.2);
                                color: white;
                                border: 2px solid white;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: 600;
                                font-size: 14px;
                                transition: all 0.3s ease;
                            "
                            onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                            onmouseout="this.style.background='rgba(255,255,255,0.2)'"
                        >
                            📥 Baixar Template
                        </button>
                    </div>
                </div>
                <div id="import-status-${moduleName}" style="margin-top: 15px; display: none;"></div>
            </div>
        `;

        container.insertAdjacentHTML('afterbegin', buttonHTML);
        
        // Adicionar event listener
        const fileInput = document.getElementById(`excel-file-${moduleName}`);
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e, moduleName));
            this.log(`Event listener adicionado para ${moduleName}`);
        }
    }

    /**
     * Trata seleção de arquivo
     */
    async handleFileSelect(event, moduleName) {
        const file = event.target.files[0];
        
        this.log(`Arquivo selecionado para ${moduleName}:`, {
            nome: file?.name,
            tamanho: file?.size,
            tipo: file?.type
        });

        if (!file) {
            this.showStatus(moduleName, '⚠️ Nenhum arquivo selecionado', 'warning');
            return;
        }

        // Validar arquivo
        const validation = this.validateFile(file);
        if (!validation.valid) {
            this.showStatus(moduleName, `❌ ${validation.error}`, 'error');
            this.error('Validação falhou:', validation.error);
            return;
        }

        // Mostrar loading
        this.showStatus(moduleName, '⏳ Lendo arquivo...', 'loading');

        try {
            // Ler arquivo
            const workbook = await this.readFile(file);
            this.log('Workbook lido com sucesso:', workbook);

            // Converter para JSON
            const data = this.workbookToJson(workbook);
            this.log('Dados convertidos:', data);

            if (!data || data.length === 0) {
                throw new Error('Nenhum dado encontrado no arquivo. Verifique se a planilha não está vazia.');
            }

            // Importar dados
            await this.importData(moduleName, data);

            // Limpar input
            event.target.value = '';

        } catch (error) {
            this.error('Erro ao processar arquivo:', error);
            this.showStatus(moduleName, `❌ Erro: ${error.message}`, 'error');
            
            // Mostrar erro detalhado
            this.app.showNotification(`Erro ao importar: ${error.message}`, 'error');
        }
    }

    /**
     * Valida arquivo
     */
    validateFile(file) {
        // Verificar se é um arquivo
        if (!file) {
            return { valid: false, error: 'Nenhum arquivo foi selecionado' };
        }

        // Verificar tamanho
        if (file.size > this.maxFileSize) {
            return { 
                valid: false, 
                error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 10MB` 
            };
        }

        if (file.size === 0) {
            return { valid: false, error: 'Arquivo está vazio' };
        }

        // Verificar extensão
        const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
        if (!this.supportedFormats.includes(extension)) {
            return { 
                valid: false, 
                error: `Formato não suportado (${extension}). Use: ${this.supportedFormats.join(', ')}` 
            };
        }

        return { valid: true };
    }

    /**
     * Lê arquivo Excel
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    this.log('FileReader onload disparado');
                    
                    const data = new Uint8Array(e.target.result);
                    this.log('Dados lidos (bytes):', data.length);

                    // Verificar se XLSX está disponível
                    if (typeof XLSX === 'undefined') {
                        throw new Error('Biblioteca XLSX não carregada. Recarregue a página.');
                    }

                    const workbook = XLSX.read(data, { type: 'array' });
                    this.log('Workbook criado:', {
                        SheetNames: workbook.SheetNames,
                        totalSheets: workbook.SheetNames.length
                    });

                    resolve(workbook);
                } catch (error) {
                    this.error('Erro ao ler workbook:', error);
                    reject(new Error(`Erro ao processar Excel: ${error.message}`));
                }
            };

            reader.onerror = (error) => {
                this.error('Erro no FileReader:', error);
                reject(new Error('Erro ao ler arquivo. Tente novamente.'));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Converte workbook para JSON
     */
    workbookToJson(workbook) {
        try {
            const firstSheetName = workbook.SheetNames[0];
            this.log(`Lendo planilha: ${firstSheetName}`);

            const worksheet = workbook.Sheets[firstSheetName];
            
            // Converter para JSON
            const json = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                raw: false
            });

            this.log('JSON bruto:', json);

            if (json.length === 0) {
                throw new Error('Planilha está vazia');
            }

            // Primeira linha são os cabeçalhos
            const headers = json[0];
            this.log('Cabeçalhos encontrados:', headers);

            // Linhas de dados
            const rows = json.slice(1).filter(row => {
                // Filtrar linhas vazias
                return row.some(cell => cell !== null && cell !== undefined && cell !== '');
            });

            this.log(`Total de linhas válidas: ${rows.length}`);

            if (rows.length === 0) {
                throw new Error('Nenhuma linha de dados encontrada (apenas cabeçalhos)');
            }

            // Converter para objetos
            const data = rows.map((row, index) => {
                const obj = {};
                headers.forEach((header, i) => {
                    if (header) {
                        obj[header] = row[i] !== undefined ? row[i] : '';
                    }
                });
                return obj;
            });

            this.log('Dados finais:', data);
            return data;

        } catch (error) {
            this.error('Erro ao converter workbook:', error);
            throw error;
        }
    }

    /**
     * Importa dados para o módulo específico
     */
    async importData(moduleName, data) {
        this.log(`Importando ${data.length} registros para ${moduleName}`);

        const importMethods = {
            'inventarioMoldes': () => this.importMoldes(data),
            'vidaUtil': () => this.importVidaUtil(data),
            'qlp': () => this.importQLP(data),
            'itensCriticos': () => this.importItensCriticos(data),
            'gases': () => this.importGases(data),
            'treinamentos': () => this.importTreinamentos(data),
            'reunioes': () => this.importReunioes(data),
            'saidaMoldes': () => this.importSaidaMoldes(data)
        };

        const importMethod = importMethods[moduleName];
        
        if (!importMethod) {
            throw new Error(`Módulo "${moduleName}" não suporta importação`);
        }

        try {
            const result = await importMethod();
            this.log('Resultado da importação:', result);

            // Mostrar sucesso
            this.showStatus(
                moduleName, 
                `✅ ${result.imported} registro(s) importado(s) com sucesso!${result.errors > 0 ? ` (${result.errors} com erro)` : ''}`, 
                'success'
            );

            this.app.showNotification(
                `✅ ${result.imported} registro(s) importado(s) com sucesso!`, 
                'success'
            );

        } catch (error) {
            this.error('Erro na importação:', error);
            throw error;
        }
    }

    /**
     * Importa Moldes
     */
    importMoldes(data) {
        this.log('Importando moldes...');

        const moldes = data.map(row => ({
            id: this.generateId(),
            nome: row['Nome'] || row['nome'] || '',
            codigo: row['Código'] || row['Codigo'] || row['codigo'] || '',
            maquina: row['Máquina'] || row['Maquina'] || row['maquina'] || '',
            status: row['Status'] || row['status'] || 'Ativo',
            cavidades: parseInt(row['Cavidades'] || row['cavidades'] || 0),
            ciclosPrevistos: parseInt(row['Ciclos Previstos'] || row['ciclosPrevistos'] || 0),
            ciclosAtuais: parseInt(row['Ciclos Atuais'] || row['ciclosAtuais'] || 0),
            dataFabricacao: row['Data Fabricação'] || row['dataFabricacao'] || row['Data Fabricacao'] || '',
            fornecedor: row['Fornecedor'] || row['fornecedor'] || '',
            observacoes: row['Observações'] || row['Observacoes'] || row['observacoes'] || ''
        })).filter(m => m.nome || m.codigo);

        this.log(`Moldes válidos: ${moldes.length}`);

        // Salvar
        const existing = this.app.storage.getModule('inventarioMoldes') || [];
        const merged = [...existing, ...moldes];
        this.app.storage.updateModule('inventarioMoldes', merged);

        // Atualizar UI
        if (typeof this.app.renderInventarioMoldes === 'function') {
            this.app.renderInventarioMoldes();
        }

        return { imported: moldes.length, errors: data.length - moldes.length };
    }

    /**
     * Importa Vida Útil
     */
    importVidaUtil(data) {
        this.log('Importando vida útil...');

        const registros = data.map(row => ({
            id: this.generateId(),
            molde: row['Molde'] || row['molde'] || '',
            maquina: row['Máquina'] || row['Maquina'] || row['maquina'] || '',
            ciclosRealizados: parseInt(row['Ciclos'] || row['ciclos'] || row['Ciclos Realizados'] || 0),
            date: row['Data'] || row['data'] || new Date().toISOString().split('T')[0],
            turno: row['Turno'] || row['turno'] || '1',
            operador: row['Operador'] || row['operador'] || '',
            observacoes: row['Observações'] || row['Observacoes'] || row['observacoes'] || ''
        })).filter(r => r.molde);

        this.log(`Registros válidos: ${registros.length}`);

        const existing = this.app.storage.getModule('vidaUtil') || [];
        const merged = [...existing, ...registros];
        this.app.storage.updateModule('vidaUtil', merged);

        if (typeof this.app.renderVidaUtil === 'function') {
            this.app.renderVidaUtil();
        }

        return { imported: registros.length, errors: data.length - registros.length };
    }

    /**
     * Importa QLP (Funcionários)
     */
    importQLP(data) {
        this.log('Importando funcionários...');

        const funcionarios = data.map(row => ({
            id: this.generateId(),
            nome: row['Nome'] || row['nome'] || '',
            cargo: row['Cargo'] || row['cargo'] || '',
            setor: row['Setor'] || row['setor'] || '',
            dataAdmissao: row['Data Admissão'] || row['Data Admissao'] || row['dataAdmissao'] || '',
            email: row['Email'] || row['email'] || '',
            telefone: row['Telefone'] || row['telefone'] || '',
            ativo: (row['Ativo'] || row['ativo'] || 'Sim').toLowerCase() !== 'não' && (row['Ativo'] || row['ativo'] || 'Sim').toLowerCase() !== 'nao',
            observacoes: row['Observações'] || row['Observacoes'] || row['observacoes'] || ''
        })).filter(f => f.nome);

        this.log(`Funcionários válidos: ${funcionarios.length}`);

        const existing = this.app.storage.getModule('qlp') || [];
        const merged = [...existing, ...funcionarios];
        this.app.storage.updateModule('qlp', merged);

        if (typeof this.app.renderQLP === 'function') {
            this.app.renderQLP();
        }

        return { imported: funcionarios.length, errors: data.length - funcionarios.length };
    }

    /**
     * Importa Itens Críticos
     */
    importItensCriticos(data) {
        this.log('Importando itens críticos...');

        const itens = data.map(row => ({
            id: this.generateId(),
            nome: row['Nome'] || row['nome'] || '',
            molde: row['Molde'] || row['molde'] || '',
            quantidadeMinima: parseInt(row['Quantidade Mínima'] || row['Quantidade Minima'] || row['quantidadeMinima'] || 0),
            quantidadeAtual: parseInt(row['Quantidade Atual'] || row['quantidadeAtual'] || 0),
            fornecedor: row['Fornecedor'] || row['fornecedor'] || '',
            prazoEntrega: parseInt(row['Prazo Entrega'] || row['prazoEntrega'] || 0),
            status: row['Status'] || row['status'] || 'Normal',
            ultimaCompra: row['Última Compra'] || row['Ultima Compra'] || row['ultimaCompra'] || '',
            observacoes: row['Observações'] || row['Observacoes'] || row['observacoes'] || ''
        })).filter(i => i.nome);

        this.log(`Itens válidos: ${itens.length}`);

        const existing = this.app.storage.getModule('itensCriticos') || [];
        const merged = [...existing, ...itens];
        this.app.storage.updateModule('itensCriticos', merged);

        if (typeof this.app.renderItensCriticos === 'function') {
            this.app.renderItensCriticos();
        }

        return { imported: itens.length, errors: data.length - itens.length };
    }

    /**
     * Importa Gases
     */
    importGases(data) {
        this.log('Importando gases...');

        const gases = data.map(row => ({
            id: this.generateId(),
            tipo: row['Tipo'] || row['tipo'] || '',
            fornecedor: row['Fornecedor'] || row['fornecedor'] || '',
            capacidade: parseFloat(row['Capacidade'] || row['capacidade'] || 0),
            nivel: parseFloat(row['Nível'] || row['Nivel'] || row['nivel'] || 0),
            dataAbastecimento: row['Data Abastecimento'] || row['dataAbastecimento'] || '',
            proximaVerificacao: row['Próxima Verificação'] || row['Proxima Verificacao'] || row['proximaVerificacao'] || '',
            status: row['Status'] || row['status'] || 'Normal',
            observacoes: row['Observações'] || row['Observacoes'] || row['observacoes'] || ''
        })).filter(g => g.tipo);

        this.log(`Gases válidos: ${gases.length}`);

        const existing = this.app.storage.getModule('gases') || [];
        const merged = [...existing, ...gases];
        this.app.storage.updateModule('gases', merged);

        if (typeof this.app.renderGases === 'function') {
            this.app.renderGases();
        }

        return { imported: gases.length, errors: data.length - gases.length };
    }

    /**
     * Importa Treinamentos
     */
    importTreinamentos(data) {
        this.log('Importando treinamentos...');

        const treinamentos = data.map(row => ({
            id: this.generateId(),
            titulo: row['Título'] || row['Titulo'] || row['titulo'] || '',
            tipo: row['Tipo'] || row['tipo'] || '',
            instrutor: row['Instrutor'] || row['instrutor'] || '',
            data: row['Data'] || row['data'] || '',
            duracao: row['Duração'] || row['Duracao'] || row['duracao'] || '',
            participantes: row['Participantes'] || row['participantes'] || '',
            status: row['Status'] || row['status'] || 'Planejado',
            observacoes: row['Observações'] || row['Observacoes'] || row['observacoes'] || ''
        })).filter(t => t.titulo);

        this.log(`Treinamentos válidos: ${treinamentos.length}`);

        const existing = this.app.storage.getModule('treinamentos') || [];
        const merged = [...existing, ...treinamentos];
        this.app.storage.updateModule('treinamentos', merged);

        if (typeof this.app.renderTreinamentos === 'function') {
            this.app.renderTreinamentos();
        }

        return { imported: treinamentos.length, errors: data.length - treinamentos.length };
    }

    /**
     * Importa Reuniões
     */
    importReunioes(data) {
        this.log('Importando reuniões...');

        const reunioes = data.map(row => ({
            id: this.generateId(),
            titulo: row['Título'] || row['Titulo'] || row['titulo'] || '',
            data: row['Data'] || row['data'] || '',
            horario: row['Horário'] || row['Horario'] || row['horario'] || '',
            local: row['Local'] || row['local'] || '',
            participantes: row['Participantes'] || row['participantes'] || '',
            pauta: row['Pauta'] || row['pauta'] || '',
            responsavel: row['Responsável'] || row['Responsavel'] || row['responsavel'] || '',
            status: row['Status'] || row['status'] || 'Agendada',
            observacoes: row['Observações'] || row['Observacoes'] || row['observacoes'] || ''
        })).filter(r => r.titulo);

        this.log(`Reuniões válidas: ${reunioes.length}`);

        const existing = this.app.storage.getModule('reunioes') || [];
        const merged = [...existing, ...reunioes];
        this.app.storage.updateModule('reunioes', merged);

        if (typeof this.app.renderReunioes === 'function') {
            this.app.renderReunioes();
        }

        return { imported: reunioes.length, errors: data.length - reunioes.length };
    }

    /**
     * Importa Saída de Moldes
     */
    importSaidaMoldes(data) {
        this.log('Importando saída de moldes...');

        const saidas = data.map(row => ({
            id: this.generateId(),
            molde: row['Molde'] || row['molde'] || '',
            dataRetirada: row['Data Retirada'] || row['dataRetirada'] || '',
            dataDevolucao: row['Data Devolução'] || row['Data Devolucao'] || row['dataDevolucao'] || '',
            responsavel: row['Responsável'] || row['Responsavel'] || row['responsavel'] || '',
            motivo: row['Motivo'] || row['motivo'] || '',
            destino: row['Destino'] || row['destino'] || '',
            status: row['Status'] || row['status'] || 'Em uso',
            observacoes: row['Observações'] || row['Observacoes'] || row['observacoes'] || ''
        })).filter(s => s.molde);

        this.log(`Saídas válidas: ${saidas.length}`);

        const existing = this.app.storage.getModule('saidaMoldes') || [];
        const merged = [...existing, ...saidas];
        this.app.storage.updateModule('saidaMoldes', merged);

        if (typeof this.app.renderSaidaMoldes === 'function') {
            this.app.renderSaidaMoldes();
        }

        return { imported: saidas.length, errors: data.length - saidas.length };
    }

    /**
     * Mostra status da importação
     */
    showStatus(moduleName, message, type) {
        const statusDiv = document.getElementById(`import-status-${moduleName}`);
        if (!statusDiv) return;

        const colors = {
            'loading': '#3498db',
            'success': '#27ae60',
            'error': '#e74c3c',
            'warning': '#f39c12'
        };

        statusDiv.style.display = 'block';
        statusDiv.style.padding = '12px';
        statusDiv.style.background = colors[type] || '#3498db';
        statusDiv.style.color = 'white';
        statusDiv.style.borderRadius = '6px';
        statusDiv.style.fontSize = '14px';
        statusDiv.style.fontWeight = '500';
        statusDiv.innerHTML = message;

        // Auto-hide em 5 segundos se for sucesso
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Download template Excel
     */
    downloadTemplate(moduleName) {
        this.log(`Baixando template para: ${moduleName}`);

        const templates = {
            'inventarioMoldes': {
                filename: 'template_moldes.xlsx',
                headers: ['Nome', 'Código', 'Máquina', 'Status', 'Cavidades', 'Ciclos Previstos', 'Ciclos Atuais', 'Data Fabricação', 'Fornecedor', 'Observações'],
                example: ['Molde 001', 'M001', 'Máquina 1', 'Ativo', '4', '100000', '5000', '2024-01-01', 'Fornecedor A', 'Em bom estado']
            },
            'vidaUtil': {
                filename: 'template_vida_util.xlsx',
                headers: ['Molde', 'Máquina', 'Ciclos', 'Data', 'Turno', 'Operador', 'Observações'],
                example: ['Molde 001', 'Máquina 1', '500', '2024-03-17', '1', 'João Silva', 'Produção normal']
            },
            'qlp': {
                filename: 'template_funcionarios.xlsx',
                headers: ['Nome', 'Cargo', 'Setor', 'Data Admissão', 'Email', 'Telefone', 'Ativo', 'Observações'],
                example: ['João Silva', 'Operador', 'Produção', '2024-01-15', 'joao@email.com', '11999999999', 'Sim', '']
            },
            'itensCriticos': {
                filename: 'template_itens_criticos.xlsx',
                headers: ['Nome', 'Molde', 'Quantidade Mínima', 'Quantidade Atual', 'Fornecedor', 'Prazo Entrega', 'Status', 'Última Compra', 'Observações'],
                example: ['Pino Extrator', 'Molde 001', '10', '15', 'Fornecedor X', '15', 'Normal', '2024-02-01', '']
            },
            'gases': {
                filename: 'template_gases.xlsx',
                headers: ['Tipo', 'Fornecedor', 'Capacidade', 'Nível', 'Data Abastecimento', 'Próxima Verificação', 'Status', 'Observações'],
                example: ['Nitrogênio', 'Fornecedor Y', '50', '80', '2024-03-01', '2024-04-01', 'Normal', '']
            },
            'treinamentos': {
                filename: 'template_treinamentos.xlsx',
                headers: ['Título', 'Tipo', 'Instrutor', 'Data', 'Duração', 'Participantes', 'Status', 'Observações'],
                example: ['Segurança no Trabalho', 'Obrigatório', 'Carlos Santos', '2024-03-20', '4 horas', 'Todos operadores', 'Planejado', '']
            },
            'reunioes': {
                filename: 'template_reunioes.xlsx',
                headers: ['Título', 'Data', 'Horário', 'Local', 'Participantes', 'Pauta', 'Responsável', 'Status', 'Observações'],
                example: ['Reunião Mensal', '2024-03-20', '14:00', 'Sala 1', 'Gerentes', 'Resultados do mês', 'Ana Costa', 'Agendada', '']
            },
            'saidaMoldes': {
                filename: 'template_saida_moldes.xlsx',
                headers: ['Molde', 'Data Retirada', 'Data Devolução', 'Responsável', 'Motivo', 'Destino', 'Status', 'Observações'],
                example: ['Molde 001', '2024-03-17', '2024-03-20', 'Pedro Lima', 'Manutenção', 'Oficina Externa', 'Em uso', '']
            }
        };

        const template = templates[moduleName];
        if (!template) {
            this.error(`Template não encontrado para: ${moduleName}`);
            return;
        }

        try {
            // Criar workbook
            const wb = XLSX.utils.book_new();
            
            // Criar worksheet com cabeçalhos e exemplo
            const ws_data = [template.headers, template.example];
            const ws = XLSX.utils.aoa_to_sheet(ws_data);

            // Adicionar ao workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Dados');

            // Download
            XLSX.writeFile(wb, template.filename);
            
            this.log(`Template baixado: ${template.filename}`);
            this.app.showNotification(`✅ Template baixado: ${template.filename}`, 'success');

        } catch (error) {
            this.error('Erro ao gerar template:', error);
            this.app.showNotification('❌ Erro ao baixar template', 'error');
        }
    }

    /**
     * Gera ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Inicializa botões em todas as abas
     */
    initAll() {
        this.log('Inicializando botões em todas as abas...');

        const modules = [
            { name: 'inventarioMoldes', selector: '#inventarioMoldes .module-container' },
            { name: 'vidaUtil', selector: '#vidaUtil .module-container' },
            { name: 'qlp', selector: '#qlp .module-container' },
            { name: 'itensCriticos', selector: '#itensCriticos .module-container' },
            { name: 'gases', selector: '#gases .module-container' },
            { name: 'treinamentos', selector: '#treinamentos .module-container' },
            { name: 'reunioes', selector: '#reunioes .module-container' },
            { name: 'saidaMoldes', selector: '#saidaMoldes .module-container' }
        ];

        let created = 0;
        modules.forEach(module => {
            this.createImportButton(module.name, module.selector);
            created++;
        });

        this.log(`✅ ${created} botões de importação criados`);
    }
}

// Inicialização global
console.log('📦 ExcelImporterV2 carregado');
