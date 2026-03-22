/**
 * SISTEMA DE IMPORTAÇÃO EXCEL
 * Versão: 1.0.0
 * Data: 10/03/2026
 * 
 * Permite importar dados de arquivos Excel (.xlsx, .xls)
 * para todas as abas do sistema automaticamente
 */

class ExcelImporter {
    constructor(app) {
        this.app = app;
        this.supportedFormats = ['.xlsx', '.xls', '.csv'];
    }

    /**
     * Cria botão de importação para uma aba específica
     */
    createImportButton(moduleName, containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const buttonHTML = `
            <div style="margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 15px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 5px 0; color: white; font-size: 16px;">
                            📊 Importação Rápida de Excel
                        </h3>
                        <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 13px;">
                            Selecione um arquivo Excel para preencher automaticamente esta aba
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <input 
                            type="file" 
                            id="excel-file-${moduleName}" 
                            accept=".xlsx,.xls,.csv"
                            style="display: none;"
                            onchange="window.excelImporter.handleFileSelect(event, '${moduleName}')"
                        />
                        <button 
                            onclick="document.getElementById('excel-file-${moduleName}').click()"
                            style="
                                padding: 12px 24px;
                                background: white;
                                color: #667eea;
                                border: none;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: bold;
                                font-size: 14px;
                                transition: all 0.3s;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            "
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'"
                        >
                            📂 Selecionar Arquivo
                        </button>
                        <button 
                            onclick="window.excelImporter.downloadTemplate('${moduleName}')"
                            style="
                                padding: 12px 24px;
                                background: rgba(255,255,255,0.2);
                                color: white;
                                border: 2px solid white;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: bold;
                                font-size: 14px;
                                transition: all 0.3s;
                            "
                            onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                            onmouseout="this.style.background='rgba(255,255,255,0.2)'"
                        >
                            📥 Baixar Template
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('afterbegin', buttonHTML);
    }

    /**
     * Manipula seleção de arquivo
     */
    handleFileSelect(event, moduleName) {
        const file = event.target.files[0];
        if (!file) return;

        // Verificar se app existe
        const app = this.app || window.app;
        if (!app) {
            alert('❌ Sistema não inicializado. Aguarde e tente novamente.');
            console.error('App não encontrado!');
            return;
        }

        // Mostra loading
        if (app.notification && app.notification.show) {
            app.notification.show('⏳ Lendo arquivo Excel...', 'info');
        }

        console.log('📂 Importando arquivo:', file.name, 'para módulo:', moduleName);

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                console.log('📖 Lendo arquivo...');
                
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                console.log('✅ Workbook criado');
                
                // Pega a primeira planilha
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Converte para JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                console.log(`📊 Dados lidos: ${jsonData.length} linhas`);
                console.log('Primeira linha:', jsonData[0]);
                
                // Processa os dados de acordo com o módulo
                this.processData(moduleName, jsonData);
                
            } catch (error) {
                console.error('❌ Erro ao ler Excel:', error);
                console.error('Stack:', error.stack);
                
                const errorMsg = error.message || 'Erro desconhecido';
                
                if (app.notification && app.notification.show) {
                    app.notification.show('❌ Erro ao ler arquivo Excel: ' + errorMsg, 'error');
                } else {
                    alert('❌ Erro ao ler arquivo Excel: ' + errorMsg);
                }
            }
        };

        reader.onerror = () => {
            console.error('❌ Erro ao carregar arquivo');
            if (app.notification && app.notification.show) {
                app.notification.show('❌ Erro ao carregar arquivo', 'error');
            } else {
                alert('❌ Erro ao carregar arquivo');
            }
        };

        reader.readAsArrayBuffer(file);
        
        // Limpa input para permitir selecionar o mesmo arquivo novamente
        event.target.value = '';
    }

    /**
     * Processa dados de acordo com o módulo
     */
    processData(moduleName, data) {
        if (!data || data.length === 0) {
            this.app.notification.show('⚠️ Arquivo Excel está vazio', 'warning');
            return;
        }

        switch(moduleName) {
            case 'moldes':
                this.importMoldes(data);
                break;
            case 'vidaUtil':
                this.importVidaUtil(data);
                break;
            case 'qlp':
                this.importQLP(data);
                break;
            case 'itensCriticos':
                this.importItensCriticos(data);
                break;
            case 'gases':
                this.importGases(data);
                break;
            case 'treinamentos':
                this.importTreinamentos(data);
                break;
            case 'reunioes':
                this.importReunioes(data);
                break;
            case 'saidaMoldes':
                this.importSaidaMoldes(data);
                break;
            default:
                this.app.notification.show('⚠️ Módulo não suportado', 'warning');
        }
    }

    /**
     * Importa dados de Moldes
     */
    importMoldes(data) {
        let importados = 0;
        let erros = 0;

        const moldes = data.map(row => {
            try {
                return {
                    id: Date.now() + Math.random(),
                    codigo: row['Código'] || row['codigo'] || row['Codigo'] || '',
                    tipo: row['Tipo'] || row['tipo'] || row['Nome'] || row['nome'] || '',
                    descricao: row['Descrição'] || row['descricao'] || row['Descricao'] || '',
                    quantidade: parseInt(row['Quantidade'] || row['quantidade'] || 0),
                    unidade: row['Unidade'] || row['unidade'] || 'UN',
                    consumoMedio: parseInt(row['Consumo Médio'] || row['consumoMedio'] || 0),
                    leadTime: parseInt(row['Lead Time'] || row['leadTime'] || 0),
                    tempoEstoque: parseInt(row['Tempo Estoque'] || row['tempoEstoque'] || 0),
                    localizacao: row['Localização'] || row['localizacao'] || row['Localizacao'] || '',
                    fornecedor: row['Fornecedor'] || row['fornecedor'] || '',
                    status: row['Status'] || row['status'] || 'Disponível',
                    dataEntrada: row['Data Entrada'] || row['dataEntrada'] || new Date().toISOString().split('T')[0]
                };
            } catch (error) {
                erros++;
                console.error('Erro ao processar linha:', error);
                return null;
            }
        }).filter(m => m !== null && (m.codigo || m.tipo));

        if (moldes.length > 0) {
            // Busca dados existentes
            const existentes = this.app.storage.getModule('inventarioMoldes') || [];
            
            // Adiciona novos dados
            const todosDados = [...existentes, ...moldes];
            
            // Salva no storage correto
            this.app.storage.saveModule('inventarioMoldes', todosDados);
            
            // Atualiza interface
            if (this.app.renderInventarioMoldes) {
                this.app.renderInventarioMoldes();
                this.app.renderInventarioMoldesDashboard();
            }
            
            this.app.notification.show(
                `✅ ${moldes.length} itens importados com sucesso! ${erros > 0 ? `(${erros} com erros)` : ''}`,
                'success'
            );
            
            console.log('✅ Importação concluída:', moldes);
        } else {
            this.app.notification.show('❌ Nenhum item válido encontrado no arquivo', 'error');
        }
    }

    /**
     * Importa dados de Vida Útil
     */
    importVidaUtil(data) {
        let importados = 0;

        const registros = data.map(row => {
            try {
                return {
                    id: Date.now() + Math.random(),
                    molde: row['Molde'] || row['molde'] || '',
                    maquina: row['Máquina'] || row['maquina'] || row['Maquina'] || '',
                    ciclosRealizados: parseInt(row['Ciclos'] || row['ciclos'] || row['Ciclos Realizados'] || 0),
                    data: row['Data'] || row['data'] || new Date().toISOString().split('T')[0],
                    turno: row['Turno'] || row['turno'] || '1',
                    operador: row['Operador'] || row['operador'] || '',
                    observacoes: row['Observações'] || row['observacoes'] || ''
                };
            } catch (error) {
                console.error('Erro ao processar vida útil:', error);
                return null;
            }
        }).filter(r => r !== null && r.molde);

        if (registros.length > 0) {
            const existentes = this.app.storage.getModule('vidaUtil') || [];
            const todosDados = [...existentes, ...registros];
            this.app.storage.saveModule('vidaUtil', todosDados);
            
            if (this.app.renderVidaUtil) {
                this.app.renderVidaUtil();
            }
            
            this.app.notification.show(`✅ ${registros.length} registros de vida útil importados!`, 'success');
            console.log('✅ Vida útil importada:', registros);
        } else {
            this.app.notification.show('❌ Nenhum registro válido encontrado', 'error');
        }
    }

    /**
     * Importa dados de QLP (Funcionários)
     */
    importQLP(data) {
        let importados = 0;

        const funcionarios = data.map(row => {
            try {
                return {
                    id: Date.now() + Math.random(),
                    nome: row['Nome'] || row['nome'] || '',
                    cargo: row['Cargo'] || row['cargo'] || '',
                    setor: row['Setor'] || row['setor'] || '',
                    dataAdmissao: row['Data Admissão'] || row['dataAdmissao'] || row['Data'] || new Date().toISOString().split('T')[0],
                    email: row['Email'] || row['email'] || '',
                    telefone: row['Telefone'] || row['telefone'] || '',
                    ativo: row['Ativo'] !== false && row['ativo'] !== 'Não' && row['ativo'] !== 'N' && row['Ativo'] !== 'Não',
                    observacoes: row['Observações'] || row['observacoes'] || ''
                };
            } catch (error) {
                console.error('Erro ao processar funcionário:', error);
                return null;
            }
        }).filter(f => f !== null && f.nome);

        if (funcionarios.length > 0) {
            // Busca dados existentes
            const existentes = this.app.storage.getModule('qlp') || [];
            
            // Adiciona novos dados
            const todosDados = [...existentes, ...funcionarios];
            
            // Salva no storage correto
            this.app.storage.saveModule('qlp', todosDados);
            
            // Atualiza interface
            if (this.app.renderQLP) {
                this.app.renderQLP();
            }
            if (this.app.renderQLPDashboard) {
                this.app.renderQLPDashboard();
            }
            
            this.app.notification.show(`✅ ${funcionarios.length} funcionários importados!`, 'success');
            
            console.log('✅ Funcionários importados:', funcionarios);
        } else {
            this.app.notification.show('❌ Nenhum funcionário válido encontrado', 'error');
        }
    }

    /**
     * Importa Itens Críticos
     */
    importItensCriticos(data) {
        const itens = data.map(row => {
            try {
                return {
                    id: Date.now() + Math.random(),
                    nome: row['Nome'] || row['nome'] || row['Item'] || '',
                    molde: row['Molde'] || row['molde'] || '',
                    quantidadeMinima: parseInt(row['Quantidade Mínima'] || row['quantidadeMinima'] || row['Estoque Mínimo'] || 0),
                    quantidadeAtual: parseInt(row['Quantidade Atual'] || row['quantidadeAtual'] || row['Estoque'] || 0),
                    fornecedor: row['Fornecedor'] || row['fornecedor'] || '',
                    prazoEntrega: parseInt(row['Prazo Entrega'] || row['prazoEntrega'] || row['Prazo'] || 0),
                    status: row['Status'] || row['status'] || 'Normal',
                    ultimaCompra: row['Última Compra'] || row['ultimaCompra'] || '',
                    observacoes: row['Observações'] || row['observacoes'] || ''
                };
            } catch (error) {
                return null;
            }
        }).filter(i => i !== null && i.nome);

        if (itens.length > 0) {
            const existentes = this.app.storage.getModule('itensCriticos') || [];
            const todosDados = [...existentes, ...itens];
            this.app.storage.saveModule('itensCriticos', todosDados);
            
            if (this.app.renderItensCriticos) {
                this.app.renderItensCriticos();
            }
            
            this.app.notification.show(`✅ ${itens.length} itens críticos importados!`, 'success');
        } else {
            this.app.notification.show('❌ Nenhum item válido encontrado', 'error');
        }
    }

    /**
     * Importa Gases
     */
    importGases(data) {
        const gases = data.map(row => {
            try {
                return {
                    id: Date.now() + Math.random(),
                    tipo: row['Tipo'] || row['tipo'] || row['Gás'] || row['Gas'] || '',
                    fornecedor: row['Fornecedor'] || row['fornecedor'] || '',
                    capacidade: parseFloat(row['Capacidade'] || row['capacidade'] || 0),
                    nivel: parseFloat(row['Nível'] || row['nivel'] || row['Nivel'] || 0),
                    dataAbastecimento: row['Data Abastecimento'] || row['dataAbastecimento'] || new Date().toISOString().split('T')[0],
                    proximaVerificacao: row['Próxima Verificação'] || row['proximaVerificacao'] || '',
                    status: row['Status'] || row['status'] || 'Normal',
                    observacoes: row['Observações'] || row['observacoes'] || ''
                };
            } catch (error) {
                return null;
            }
        }).filter(g => g !== null && g.tipo);

        if (gases.length > 0) {
            const existentes = this.app.storage.getModule('gases') || [];
            const todosDados = [...existentes, ...gases];
            this.app.storage.saveModule('gases', todosDados);
            
            if (this.app.renderGases) {
                this.app.renderGases();
            }
            
            this.app.notification.show(`✅ ${gases.length} registros de gases importados!`, 'success');
        } else {
            this.app.notification.show('❌ Nenhum registro válido encontrado', 'error');
        }
    }

    /**
     * Importa Treinamentos
     */
    importTreinamentos(data) {
        const treinamentos = data.map(row => {
            try {
                return {
                    id: Date.now() + Math.random(),
                    titulo: row['Título'] || row['titulo'] || row['Treinamento'] || '',
                    instrutor: row['Instrutor'] || row['instrutor'] || '',
                    data: row['Data'] || row['data'] || new Date().toISOString().split('T')[0],
                    duracao: row['Duração'] || row['duracao'] || '',
                    participantes: row['Participantes'] || row['participantes'] || '',
                    local: row['Local'] || row['local'] || '',
                    status: row['Status'] || row['status'] || 'Realizado',
                    observacoes: row['Observações'] || row['observacoes'] || ''
                };
            } catch (error) {
                return null;
            }
        }).filter(t => t !== null && t.titulo);

        if (treinamentos.length > 0) {
            const existentes = this.app.storage.getModule('treinamentos') || [];
            const todosDados = [...existentes, ...treinamentos];
            this.app.storage.saveModule('treinamentos', todosDados);
            
            if (this.app.renderTreinamentos) {
                this.app.renderTreinamentos();
            }
            
            this.app.notification.show(`✅ ${treinamentos.length} treinamentos importados!`, 'success');
        } else {
            this.app.notification.show('❌ Nenhum treinamento válido encontrado', 'error');
        }
    }

    /**
     * Importa Reuniões
     */
    importReunioes(data) {
        const reunioes = data.map(row => {
            try {
                return {
                    id: Date.now() + Math.random(),
                    titulo: row['Título'] || row['titulo'] || row['Assunto'] || '',
                    data: row['Data'] || row['data'] || new Date().toISOString().split('T')[0],
                    hora: row['Hora'] || row['hora'] || '00:00',
                    participantes: row['Participantes'] || row['participantes'] || '',
                    local: row['Local'] || row['local'] || '',
                    pauta: row['Pauta'] || row['pauta'] || '',
                    decisoes: row['Decisões'] || row['decisoes'] || row['Decisoes'] || '',
                    responsavel: row['Responsável'] || row['responsavel'] || row['Responsavel'] || '',
                    status: row['Status'] || row['status'] || 'Realizada',
                    observacoes: row['Observações'] || row['observacoes'] || ''
                };
            } catch (error) {
                return null;
            }
        }).filter(r => r !== null && r.titulo);

        if (reunioes.length > 0) {
            const existentes = this.app.storage.getModule('reunioes') || [];
            const todosDados = [...existentes, ...reunioes];
            this.app.storage.saveModule('reunioes', todosDados);
            
            if (this.app.renderReunioes) {
                this.app.renderReunioes();
            }
            
            this.app.notification.show(`✅ ${reunioes.length} reuniões importadas!`, 'success');
        } else {
            this.app.notification.show('❌ Nenhuma reunião válida encontrada', 'error');
        }
    }

    /**
     * Importa Saída de Moldes
     */
    importSaidaMoldes(data) {
        const saidas = data.map(row => {
            try {
                return {
                    id: Date.now() + Math.random(),
                    molde: row['Molde'] || row['molde'] || '',
                    motivo: row['Motivo'] || row['motivo'] || '',
                    dataSaida: row['Data Saída'] || row['dataSaida'] || row['Data'] || new Date().toISOString().split('T')[0],
                    dataRetorno: row['Data Retorno'] || row['dataRetorno'] || row['Retorno'] || '',
                    responsavel: row['Responsável'] || row['responsavel'] || row['Responsavel'] || '',
                    destino: row['Destino'] || row['destino'] || '',
                    status: row['Status'] || row['status'] || 'Fora',
                    observacoes: row['Observações'] || row['observacoes'] || ''
                };
            } catch (error) {
                return null;
            }
        }).filter(s => s !== null && s.molde);

        if (saidas.length > 0) {
            const existentes = this.app.storage.getModule('saidaMoldes') || [];
            const todosDados = [...existentes, ...saidas];
            this.app.storage.saveModule('saidaMoldes', todosDados);
            
            if (this.app.renderSaidaMoldes) {
                this.app.renderSaidaMoldes();
            }
            
            this.app.notification.show(`✅ ${saidas.length} registros de saída importados!`, 'success');
        } else {
            this.app.notification.show('❌ Nenhum registro válido encontrado', 'error');
        }
    }

    /**
     * Baixa template Excel para o módulo
     */
    downloadTemplate(moduleName) {
        const templates = {
            moldes: [
                ['Código', 'Tipo', 'Descrição', 'Quantidade', 'Unidade', 'Consumo Médio', 'Lead Time', 'Tempo Estoque', 'Localização', 'Fornecedor', 'Status', 'Data Entrada'],
                ['M001', 'Pino Extrator', 'Pino extrator 10mm', '50', 'UN', '5', '15', '30', 'Almoxarifado A1', 'Fornecedor X', 'Disponível', '2024-03-10']
            ],
            vidaUtil: [
                ['Molde', 'Máquina', 'Ciclos', 'Data', 'Turno', 'Operador', 'Observações'],
                ['Molde 001', 'Máquina 1', '500', '2024-03-10', '1', 'João Silva', 'Produção normal']
            ],
            qlp: [
                ['Nome', 'Cargo', 'Setor', 'Data Admissão', 'Email', 'Telefone', 'Ativo', 'Observações'],
                ['João Silva', 'Operador', 'Produção', '2024-01-15', 'joao@email.com', '11999999999', 'Sim', '']
            ],
            itensCriticos: [
                ['Nome', 'Molde', 'Quantidade Mínima', 'Quantidade Atual', 'Fornecedor', 'Prazo Entrega', 'Status', 'Última Compra', 'Observações'],
                ['Pino Extrator', 'Molde 001', '10', '15', 'Fornecedor X', '15', 'Normal', '2024-02-01', '']
            ],
            gases: [
                ['Tipo', 'Fornecedor', 'Capacidade', 'Nível', 'Data Abastecimento', 'Próxima Verificação', 'Status', 'Observações'],
                ['Nitrogênio', 'Fornecedor Y', '50', '80', '2024-03-01', '2024-04-01', 'Normal', '']
            ],
            treinamentos: [
                ['Título', 'Instrutor', 'Data', 'Duração', 'Participantes', 'Local', 'Status', 'Observações'],
                ['Segurança do Trabalho', 'Maria Santos', '2024-03-15', '4 horas', 'João, Pedro, Ana', 'Sala 1', 'Realizado', '']
            ],
            reunioes: [
                ['Título', 'Data', 'Hora', 'Participantes', 'Local', 'Pauta', 'Decisões', 'Responsável', 'Status', 'Observações'],
                ['Reunião Semanal', '2024-03-10', '14:00', 'Equipe completa', 'Sala de Reuniões', 'Discussão de metas', 'Aumentar produção', 'Gerente', 'Realizada', '']
            ],
            saidaMoldes: [
                ['Molde', 'Motivo', 'Data Saída', 'Data Retorno', 'Responsável', 'Destino', 'Status', 'Observações'],
                ['Molde 001', 'Manutenção', '2024-03-10', '2024-03-15', 'João Silva', 'Oficina Externa', 'Fora', '']
            ]
        };

        const templateData = templates[moduleName];
        if (!templateData) {
            this.app.notification.show('⚠️ Template não disponível para este módulo', 'warning');
            return;
        }

        // Cria workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(templateData);
        
        // Adiciona planilha
        XLSX.utils.book_append_sheet(wb, ws, moduleName);
        
        // Baixa arquivo
        XLSX.writeFile(wb, `template_${moduleName}.xlsx`);
        
        this.app.notification.show('✅ Template baixado com sucesso!', 'success');
    }
}

// Inicializa quando o app estiver pronto
console.log('✅ Módulo de Importação Excel carregado');
