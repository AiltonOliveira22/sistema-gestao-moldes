/**
 * SISTEMA DE IMPORTAÇÃO EXCEL - ATUALIZADO
 * Versão: 2.0.0
 * Data: 18/03/2026
 * 
 * Estrutura FIELMENTE baseada no arquivo Excel fornecido
 * 10 abas com campos corretos conforme especificado
 */

class ExcelImporterAtualizado {
    constructor(app) {
        this.app = app;
        this.supportedFormats = ['.xlsx', '.xls', '.csv'];
        
        // Mapeamento correto das abas do Excel para módulos do sistema
        this.sheetMapping = {
            'Funcionários': 'funcionarios',
            'Treinamentos': 'treinamentos',
            'Custos Moldes': 'custos',
            'Inventário Moldes': 'moldes',
            'Vida Útil': 'vidaUtil',
            'Itens Críticos': 'itensCriticos',
            'Gases': 'gases',
            'Reunião Diária': 'reunioes',
            'Plano Ação': 'planoAcao',
            'Saída Moldes': 'saidaMoldes'
        };
        
        // Templates com estrutura EXATA do Excel fornecido
        this.templates = {
            funcionarios: {
                name: 'Funcionários',
                filename: 'funcionarios.xlsx',
                icon: '👥',
                color: '#3b82f6',
                columns: ['N', 'ID', 'Nome', 'Champion', 'Função', 'Endereço', 'Bairro', 'Cidade', 'Status'],
                exampleRow: [1, 99847392, 'Ailton José Mariano de Oliveira', '', 'Coordenador', 'Rua Olga Aleda Cavagnari, 184', 'Jardim Carvalho', 'Ponta Grossa', 'Ativo'],
                columnCount: 9
            },
            treinamentos: {
                name: 'Treinamentos',
                filename: 'treinamentos.xlsx',
                icon: '📚',
                color: '#10b981',
                columns: ['Título', 'Instrutor', 'Data Início', 'Data Fim', 'Carga Horária', 'Participantes', 'Status', 'Local', 'Observações'],
                exampleRow: ['Segurança no Trabalho', 'Carlos Oliveira', '2026-01-01', '2026-02-01', 40, 'João Silva, Maria Santos', 'Planejado', 'Sala A', ''],
                columnCount: 9
            },
            custos: {
                name: 'Custos Moldes',
                filename: 'custos-moldes.xlsx',
                icon: '💰',
                color: '#f59e0b',
                columns: ['SKU', 'Lote', 'Item', 'Tipo de Molde', 'Tradução', 'Classificação', 'Quantidade', 'Valor Peça', 'Valor Total'],
                exampleRow: ['Stella', 'D', 1, 'BLOW MOULD', 'MOLDE', 'MOULD', 144, 308, '=H2*G2'],
                columnCount: 9,
                formulas: { 'Valor Total': (row) => (row['Valor Peça'] || 0) * (row['Quantidade'] || 0) }
            },
            moldes: {
                name: 'Inventário Moldes',
                filename: 'inventario-moldes.xlsx',
                icon: '📦',
                color: '#8b5cf6',
                columns: ['Data de Chegada', 'Item', 'Código', 'Quantidade', 'Unidade', 'Fornecedor', 'Preço', 'Custo Total Estoque', 'Observações'],
                exampleRow: ['2026-01-01', 'Molde Stella', 'D', 144, 'pç', 'Omco', 300, '=G2*D2', 'teste'],
                columnCount: 9,
                formulas: { 'Custo Total Estoque': (row) => (row['Preço'] || 0) * (row['Quantidade'] || 0) }
            },
            vidaUtil: {
                name: 'Vida Útil',
                filename: 'vida-util.xlsx',
                icon: '⏱️',
                color: '#06b6d4',
                columns: ['Linha', 'Produto', 'Set', 'Peças', 'Vel', 'Entrada', 'Saida', 'Dias', 'Cortes', 'C/Cavidade', 'Target', 'Eficiência', 'Status'],
                exampleRow: [591, 'Stella Artois', 'C', 144, 432, '2025-10-25', '2026-03-17', '=G2-F2', '=E2*H2*1440', '=I2/D2', 1200000, '=J2/K2', 'Máquina'],
                columnCount: 13,
                formulas: {
                    'Dias': (row) => {
                        if (!row['Saida'] || !row['Entrada']) return 0;
                        const entrada = new Date(row['Entrada']);
                        const saida = new Date(row['Saida']);
                        return Math.floor((saida - entrada) / (1000 * 60 * 60 * 24));
                    },
                    'Cortes': (row) => (row['Vel'] || 0) * (row['Dias'] || 0) * 1440,
                    'C/Cavidade': (row) => (row['Peças'] || 0) > 0 ? (row['Cortes'] || 0) / (row['Peças'] || 0) : 0,
                    'Eficiência': (row) => (row['Target'] || 0) > 0 ? (row['C/Cavidade'] || 0) / (row['Target'] || 0) : 0
                }
            },
            itensCriticos: {
                name: 'Itens Críticos',
                filename: 'itens-criticos.xlsx',
                icon: '⚠️',
                color: '#ef4444',
                columns: ['Código', 'Descrição', 'Classificação', 'Quantidade', 'Consumo Mensal', 'Lead Time', 'Estoque em dias', 'Fornecedor', 'Preço', 'Custo Total Estoque'],
                exampleRow: [50057885, 'Lima Chata Bastarda 8" K&F', 'Critico', 100, 25, 30, '=D2/E2*30', 'Teste', 100, '=I2*D2'],
                columnCount: 10,
                formulas: {
                    'Estoque em dias': (row) => (row['Consumo Mensal'] || 0) > 0 ? ((row['Quantidade'] || 0) / (row['Consumo Mensal'] || 0)) * 30 : 0,
                    'Custo Total Estoque': (row) => (row['Preço'] || 0) * (row['Quantidade'] || 0)
                }
            },
            gases: {
                name: 'Gases',
                filename: 'gases.xlsx',
                icon: '🔥',
                color: '#14b8a6',
                columns: ['Tipo', 'Fornecedor', 'Quantidade(Cilindro)', 'Pedido', 'Chegada', 'Entrada', 'Saida', 'Duração', 'Status', 'Localização'],
                exampleRow: ['Oxigênio', 'White Martins', 10, '', '2026-01-01', '2026-03-01', '2026-04-01', '=G2-F2', 'Montado', 'Molde'],
                columnCount: 10,
                formulas: {
                    'Duração': (row) => {
                        if (!row['Saida'] || !row['Entrada']) return 0;
                        const entrada = new Date(row['Entrada']);
                        const saida = new Date(row['Saida']);
                        return Math.floor((saida - entrada) / (1000 * 60 * 60 * 24));
                    }
                }
            },
            reunioes: {
                name: 'Reunião Diária',
                filename: 'reuniao-diaria.xlsx',
                icon: '📋',
                color: '#f97316',
                columns: [
                    'Data', 'Título', 'Horário', 'Local', 'Número Participantes', 'Pauta', 
                    'Condição Insegura', 'Incidente', 'Ato Inseguro', 'Moldes Recebidos', 
                    'Limpos', 'Moldes Reparados', 'Moldes Segregados', 'Coroas Reparadas', 
                    'Coroas Inspecionadas', 'Coroas Segregadas', 'Punções Reparados', 
                    'Punções Segregados', 'Volumes', 'Volumes Segregados', 'Insertos Segregados', 
                    'Responsável', 'Status'
                ],
                exampleRow: [
                    '2026-01-01', 'Reunião Semanal Produção', '9hr', 'Sala Reuniões', 15, 
                    'Análise de produtividade', 1, 1, 1, 100, 120, 50, 5, 55, 55, 5, 60, 6, 
                    45, 5, 20, 'João Silva', 'Agendada'
                ],
                columnCount: 23
            },
            planoAcao: {
                name: 'Plano Ação',
                filename: 'plano-acao.xlsx',
                icon: '✅',
                color: '#84cc16',
                columns: ['Data Abertura', 'Descrição', 'Responsável', 'Prazo', 'Prioridade', 'Status', 'Categoria', 'Data Conclusão', 'Observações'],
                exampleRow: ['2026-01-01', 'Implementar novo processo de inspeção', 'João Silva', 7, 'Alta', 'Concluido', 'Qualidade', '2026-01-08', 'Feito'],
                columnCount: 9
            },
            saidaMoldes: {
                name: 'Saída Moldes',
                filename: 'saida-moldes.xlsx',
                icon: '📤',
                color: '#ec4899',
                columns: ['Data', 'Linha', 'Turno', 'Molde', 'Pre Molde', 'Coroa', 'Punção', 'Postiço', 'Observações'],
                exampleRow: ['2026-01-01', '591', 'A', 100, 55, 60, 15, 10, 'Saida de Coroa em excesso'],
                columnCount: 9
            }
        };
    }

    /**
     * Baixar template de um módulo específico
     */
    downloadTemplate(moduleKey) {
        const template = this.templates[moduleKey];
        if (!template) {
            this.app.showNotification('⚠️ Template não encontrado', 'warning');
            return;
        }

        const wb = XLSX.utils.book_new();
        const data = [template.columns, template.exampleRow, ['']]; // Cabeçalho, exemplo, linha vazia
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Definir largura das colunas
        ws['!cols'] = template.columns.map(() => ({ wch: 20 }));
        
        XLSX.utils.book_append_sheet(wb, ws, template.name);
        XLSX.writeFile(wb, template.filename);
        
        this.app.showNotification(`✅ Template "${template.name}" baixado com sucesso!`, 'success');
    }

    /**
     * Baixar todos os templates de uma vez
     */
    downloadAllTemplates() {
        const keys = Object.keys(this.templates);
        keys.forEach((key, index) => {
            setTimeout(() => {
                this.downloadTemplate(key);
            }, index * 300); // Delay para não sobrecarregar o navegador
        });
        
        this.app.showNotification(`📥 Baixando ${keys.length} templates...`, 'info');
    }

    /**
     * Importar arquivo Excel
     */
    async importFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { 
                        type: 'array',
                        cellFormula: true,
                        cellStyles: true
                    });
                    
                    const result = {
                        sheets: {},
                        fileName: file.name
                    };
                    
                    // Processar cada aba
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        
                        // Converter para JSON preservando fórmulas
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                            header: 1,
                            raw: false,
                            defval: ''
                        });
                        
                        if (jsonData.length > 0) {
                            const headers = jsonData[0];
                            const rows = jsonData.slice(1).filter(row => 
                                row.some(cell => cell !== null && cell !== undefined && cell !== '')
                            );
                            
                            result.sheets[sheetName] = {
                                headers,
                                rows,
                                hasFormulas: this.hasFormulas(worksheet)
                            };
                        }
                    });
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Verificar se uma planilha tem fórmulas
     */
    hasFormulas(worksheet) {
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cellAddress];
                if (cell && cell.f) return true;
            }
        }
        return false;
    }

    /**
     * Processar dados importados e salvar no sistema
     */
    processImportedData(importResult) {
        let totalImported = 0;
        const errors = [];
        
        Object.keys(importResult.sheets).forEach(sheetName => {
            const moduleKey = this.sheetMapping[sheetName];
            
            if (!moduleKey) {
                errors.push(`Aba "${sheetName}" não reconhecida`);
                return;
            }
            
            const sheetData = importResult.sheets[sheetName];
            const template = this.templates[moduleKey];
            
            if (!template) {
                errors.push(`Template não encontrado para "${sheetName}"`);
                return;
            }
            
            // Converter linhas em objetos
            const records = sheetData.rows.map(row => {
                const record = {
                    id: this.generateId(),
                    importedAt: new Date().toISOString(),
                    importFile: importResult.fileName,
                    importSheet: sheetName
                };
                
                sheetData.headers.forEach((header, index) => {
                    const key = this.normalizeKey(header);
                    record[key] = row[index] || '';
                });
                
                // Aplicar fórmulas se existirem
                if (template.formulas) {
                    Object.keys(template.formulas).forEach(formulaField => {
                        const key = this.normalizeKey(formulaField);
                        record[key] = template.formulas[formulaField](record);
                    });
                }
                
                return record;
            });
            
            // Salvar no localStorage
            const currentData = this.app.storage.getData()[moduleKey] || [];
            this.app.storage.saveModule(moduleKey, [...currentData, ...records]);
            
            totalImported += records.length;
        });
        
        return { totalImported, errors };
    }

    /**
     * Normalizar chave de campo
     */
    normalizeKey(key) {
        return key
            .toString()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();
    }

    /**
     * Gerar ID único
     */
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Limpar todos os dados
     */
    clearAll() {
        if (confirm('⚠️ Tem certeza que deseja limpar TODOS os dados importados? Esta ação não pode ser desfeita.')) {
            const modules = Object.keys(this.templates);
            modules.forEach(moduleKey => {
                this.app.storage.saveModule(moduleKey, []);
            });
            this.app.showNotification('🗑️ Todos os dados foram limpos!', 'success');
            this.app.renderAllTables();
            this.app.updateDashboard();
        }
    }
}

// Exportar para uso global
console.log('✅ Módulo de Importação Excel Atualizado carregado com sucesso!');
