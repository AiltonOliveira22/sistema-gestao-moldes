// Storage Manager
class StorageManager {
    constructor() {
        this.storageKey = 'moldManagementSystemV2';
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                vidaUtil: [],
                itensCriticos: [],
                qlp: [],
                gases: [],
                treinamentos: [],
                reunioes: [],
                planoAcao: [],
                custos: [],
                itensMolde: [],
                saidaMoldes: []
            };
            this.saveData(initialData);
            this.loadSampleData();
        }
    }

    loadSampleData() {
        const sampleData = {
            vidaUtil: [
                {
                    id: this.generateId(),
                    codigo: 'MOL001',
                    nome: 'Tampa Circular 50mm',
                    status: 'Em Uso',
                    maquina: '591',
                    dataEntrada: '2026-01-15',
                    dataSaida: '2026-02-28',
                    velocidade: 2.5,
                    qtdMoldes: 10,
                    target: 7000,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    codigo: 'MOL002',
                    nome: 'Base Quadrada 100mm',
                    status: 'Em Uso',
                    maquina: '592',
                    dataEntrada: '2026-01-10',
                    dataSaida: '2026-02-20',
                    velocidade: 3.0,
                    qtdMoldes: 12,
                    target: 8000,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    codigo: 'MOL003',
                    nome: 'Tampa Oval 75mm',
                    status: 'Manutenção',
                    maquina: '593',
                    dataEntrada: '2026-02-01',
                    dataSaida: '2026-02-25',
                    velocidade: 2.8,
                    qtdMoldes: 8,
                    target: 6500,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    codigo: 'MOL004',
                    nome: 'Molde Retangular 200mm',
                    status: 'Disponível',
                    maquina: '591',
                    dataEntrada: '2026-02-10',
                    dataSaida: '2026-02-27',
                    velocidade: 3.2,
                    qtdMoldes: 15,
                    target: 7500,
                    createdAt: new Date().toISOString()
                }
            ],
            itensCriticos: [
                {
                    id: this.generateId(),
                    codigo: 'CRIT001',
                    descricao: 'Óleo Lubrificante Industrial SAE 40',
                    quantidade: 50,
                    unidade: 'L',
                    estoqueMinimo: 20,
                    localizacao: 'Almoxarifado Setor A',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    codigo: 'CRIT002',
                    descricao: 'Lâmina de Corte Tungstênio',
                    quantidade: 15,
                    unidade: 'UN',
                    estoqueMinimo: 30,
                    localizacao: 'Prateleira B3',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    codigo: 'CRIT003',
                    descricao: 'Graxa Industrial Alta Temperatura',
                    quantidade: 100,
                    unidade: 'KG',
                    estoqueMinimo: 25,
                    localizacao: 'Almoxarifado Setor A',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    codigo: 'CRIT004',
                    descricao: 'Parafusos M8 Aço Inox',
                    quantidade: 200,
                    unidade: 'UN',
                    estoqueMinimo: 50,
                    localizacao: 'Prateleira A1',
                    createdAt: new Date().toISOString()
                }
            ],
            qlp: [
                {
                    id: this.generateId(),
                    matricula: '001',
                    nome: 'João Silva Santos',
                    funcao: 'Coordenador',
                    dataEntrada: '2020-01-15',
                    rua: 'Rua das Flores',
                    numero: '123',
                    bairro: 'Centro',
                    cidade: 'Ponta Grossa',
                    escolaridade: 'Graduação',
                    informacoes: 'Coordenador da equipe de manutenção',
                    status: 'Ativo',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    matricula: '002',
                    nome: 'Maria Oliveira Costa',
                    funcao: 'Técnico',
                    dataEntrada: '2021-03-20',
                    rua: 'Av. Principal',
                    numero: '456',
                    bairro: 'Jardim',
                    cidade: 'Ponta Grossa',
                    escolaridade: 'Técnico',
                    informacoes: 'Especialista em manutenção preventiva',
                    status: 'Ativo',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    matricula: '003',
                    nome: 'Pedro Henrique Alves',
                    funcao: 'Técnico',
                    dataEntrada: '2022-06-10',
                    rua: 'Rua Nova',
                    numero: '789',
                    bairro: 'Industrial',
                    cidade: 'Ponta Grossa',
                    escolaridade: 'Ensino Médio',
                    informacoes: 'Responsável por inspeções diárias',
                    status: 'Ativo',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    matricula: '004',
                    nome: 'Ana Paula Santos',
                    funcao: 'Operador',
                    dataEntrada: '2023-02-01',
                    rua: 'Rua das Acácias',
                    numero: '321',
                    bairro: 'São José',
                    cidade: 'Ponta Grossa',
                    escolaridade: 'Ensino Médio',
                    informacoes: 'Operadora de máquinas',
                    status: 'Férias',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    matricula: '005',
                    nome: 'Carlos Eduardo Lima',
                    funcao: 'Auxiliar',
                    dataEntrada: '2024-08-15',
                    rua: 'Rua dos Pinheiros',
                    numero: '654',
                    bairro: 'Uvaranas',
                    cidade: 'Ponta Grossa',
                    escolaridade: 'Ensino Fundamental',
                    informacoes: 'Auxiliar de produção',
                    status: 'Ativo',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    matricula: '006',
                    nome: 'Juliana Ferreira',
                    funcao: 'Operador',
                    dataEntrada: '2019-11-20',
                    rua: 'Av. Brasil',
                    numero: '987',
                    bairro: 'Oficinas',
                    cidade: 'Ponta Grossa',
                    escolaridade: 'Técnico',
                    informacoes: 'Operadora sênior',
                    status: 'Ativo',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    matricula: '007',
                    nome: 'Roberto Souza',
                    funcao: 'Técnico',
                    dataEntrada: '2023-05-10',
                    rua: 'Rua 15 de Novembro',
                    numero: '111',
                    bairro: 'Centro',
                    cidade: 'Ponta Grossa',
                    escolaridade: 'Graduação',
                    informacoes: 'Técnico de qualidade',
                    status: 'Afastado',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    matricula: '008',
                    nome: 'Fernanda Costa',
                    funcao: 'Coordenador',
                    dataEntrada: '2018-03-01',
                    rua: 'Rua Santa Catarina',
                    numero: '222',
                    bairro: 'Estrela',
                    cidade: 'Ponta Grossa',
                    escolaridade: 'Pós-graduação',
                    informacoes: 'Coordenadora de produção',
                    status: 'Ativo',
                    createdAt: new Date().toISOString()
                }
            ],
            gases: [
                {
                    id: this.generateId(),
                    tipoGas: 'OXIGÊNIO',
                    dataPedido: '2026-02-20',
                    dataMontagem: '2026-02-22',
                    dataSaida: '2026-02-28',
                    responsavel: 'João Silva Santos',
                    status: 'Encerrado',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    tipoGas: 'ACETILENO',
                    dataPedido: '2026-02-18',
                    dataMontagem: '2026-02-19',
                    dataSaida: '2026-02-25',
                    responsavel: 'Maria Costa',
                    status: 'Montado',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    tipoGas: 'ARGÔNIO',
                    dataPedido: '2026-02-15',
                    dataMontagem: '2026-02-16',
                    dataSaida: '2026-03-01',
                    responsavel: 'Pedro Alves',
                    status: 'Reserva',
                    createdAt: new Date().toISOString()
                }
            ],
            treinamentos: [
                {
                    id: this.generateId(),
                    data: '2026-03-10',
                    titulo: 'Segurança no Trabalho',
                    tipo: 'Segurança',
                    instrutor: 'Carlos Alberto',
                    participantes: 15,
                    status: 'Agendado',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    data: '2026-03-15',
                    titulo: 'Manutenção Preventiva de Moldes',
                    tipo: 'Técnico',
                    instrutor: 'Roberto Santos',
                    participantes: 10,
                    status: 'Agendado',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    data: '2026-03-20',
                    titulo: 'Controle de Qualidade',
                    tipo: 'Qualidade',
                    instrutor: 'Ana Paula',
                    participantes: 12,
                    status: 'Agendado',
                    createdAt: new Date().toISOString()
                }
            ],
            reunioes: [
                {
                    id: this.generateId(),
                    data: '2026-02-28',
                    tipo: 'DDS',
                    participantes: 20,
                    topicos: 'Uso correto de EPIs, Prevenção de acidentes',
                    acoes: 'Reforçar treinamento de segurança',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    data: '2026-02-27',
                    tipo: 'Produção',
                    participantes: 15,
                    topicos: 'Meta de produção, Eficiência das máquinas',
                    acoes: 'Aumentar velocidade na máquina 592',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    data: '2026-02-26',
                    tipo: 'Manutenção',
                    participantes: 8,
                    topicos: 'Planejamento de manutenção preventiva',
                    acoes: 'Agendar revisão dos moldes críticos',
                    createdAt: new Date().toISOString()
                }
            ],
            planoAcao: [
                {
                    id: this.generateId(),
                    dataAbertura: '2026-03-01',
                    descricao: 'Implementar sistema de lubrificação automática nos moldes da máquina 591',
                    origem: 'Reunião DDS',
                    responsavel: 'João Silva Santos',
                    prazo: '2026-03-15',
                    prioridade: 'Alta',
                    status: 'Em Andamento',
                    categoria: 'Manutenção',
                    dataConclusao: null,
                    observacoes: 'Orçamento aprovado. Aguardando fornecedor.',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    dataAbertura: '2026-02-28',
                    descricao: 'Treinar equipe sobre procedimentos de segurança com gases',
                    origem: 'Auditoria',
                    responsavel: 'Maria Oliveira Costa',
                    prazo: '2026-03-10',
                    prioridade: 'Alta',
                    status: 'Pendente',
                    categoria: 'Segurança',
                    dataConclusao: null,
                    observacoes: 'Aguardar disponibilidade do instrutor.',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    dataAbertura: '2026-02-25',
                    descricao: 'Organizar almoxarifado seguindo metodologia 5S',
                    origem: 'Melhoria Contínua',
                    responsavel: 'Pedro Henrique Alves',
                    prazo: '2026-03-05',
                    prioridade: 'Média',
                    status: 'Concluída',
                    categoria: '5S',
                    dataConclusao: '2026-03-03',
                    observacoes: 'Concluído com sucesso. Fotos antes/depois registradas.',
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    dataAbertura: '2026-02-20',
                    descricao: 'Revisar e atualizar documentação dos processos de reparo',
                    origem: 'Inspeção',
                    responsavel: 'Carlos Alberto Silva',
                    prazo: '2026-02-28',
                    prioridade: 'Baixa',
                    status: 'Atrasada',
                    categoria: 'Qualidade',
                    dataConclusao: null,
                    observacoes: 'Pendente revisão técnica.',
                    createdAt: new Date().toISOString()
                }
            ],
            custos: [
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 1,
                    tipoMolde: 'BLOW MOULD',
                    traducao: 'MOLDE',
                    classificacao: 'MOULD',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor A',
                    quantidade: 72,
                    valorUnitario: 308.00,
                    valorTotal: 22176.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 2,
                    tipoMolde: 'VACUUM BOTTOM PLATE',
                    traducao: 'FUNDO DO MOLDE',
                    classificacao: 'MOULD',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor A',
                    quantidade: 72,
                    valorUnitario: 56.00,
                    valorTotal: 4032.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 3,
                    tipoMolde: 'SPARE VACUUM BOTTOM PLATE',
                    traducao: 'RESERVA FUNDO DO MOLDE',
                    classificacao: 'MOULD',
                    quantidade: 18,
                    valorUnitario: 56.00,
                    valorTotal: 1008.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 4,
                    tipoMolde: 'BLANK MOULD 5 1/8" - NIS TG 5"-INVERTFLOW COOLING',
                    traducao: 'PRE MOLDE',
                    classificacao: 'MOULD',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor A',
                    quantidade: 72,
                    valorUnitario: 182.00,
                    valorTotal: 13104.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 5,
                    tipoMolde: 'BAFFLE INSERT',
                    traducao: 'POSTIÇO',
                    classificacao: 'MOULD',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor A',
                    quantidade: 72,
                    valorUnitario: 22.50,
                    valorTotal: 1620.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 6,
                    tipoMolde: 'SPARE BAFFLE INSERT',
                    traducao: 'RESERVA POSTIÇO',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor B',
                    quantidade: 250,
                    valorUnitario: 22.50,
                    valorTotal: 5625.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 7,
                    tipoMolde: 'BAFFLE HOLDER',
                    traducao: 'SUPORTE POSTIÇO',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor B',
                    quantidade: 72,
                    valorUnitario: 23.00,
                    valorTotal: 1656.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 8,
                    tipoMolde: 'NECK RING',
                    traducao: 'COROA',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor B',
                    quantidade: 340,
                    valorUnitario: 62.00,
                    valorTotal: 21080.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 9,
                    tipoMolde: 'GUIDE RING',
                    traducao: 'ANEL',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor B',
                    quantidade: 340,
                    valorUnitario: 10.30,
                    valorTotal: 3502.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 10,
                    tipoMolde: 'SPARE GUIDE RING',
                    traducao: 'RESERVA ANEL',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor B',
                    quantidade: 300,
                    valorUnitario: 10.30,
                    valorTotal: 3090.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 11,
                    tipoMolde: 'PLUNGER PRESS BLOW',
                    traducao: 'PUNÇÃO',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor C',
                    quantidade: 180,
                    valorUnitario: 51.00,
                    valorTotal: 9180.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 12,
                    tipoMolde: 'PLUNGER COOLING TUBE',
                    traducao: 'RESFRIADOR DO PUNÇÃO',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor C',
                    quantidade: 180,
                    valorUnitario: 11.30,
                    valorTotal: 2034.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 13,
                    tipoMolde: 'SPARE PLUNGER COOLING TUBE',
                    traducao: 'RESERVA RESFRIADOR DO PUNÇÃO',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor C',
                    quantidade: 180,
                    valorUnitario: 11.30,
                    valorTotal: 2034.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 14,
                    tipoMolde: 'BLOW HEAD',
                    traducao: 'CABEÇA DE ASSOPRO',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor B',
                    quantidade: 36,
                    valorUnitario: 42.00,
                    valorTotal: 1512.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 15,
                    tipoMolde: 'FINISH COOLING BLOW HEAD',
                    traducao: 'PIPETA',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor B',
                    quantidade: 72,
                    valorUnitario: 5.60,
                    valorTotal: 403.20,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 16,
                    tipoMolde: 'SPARE FINISH COOLING BLOW HEAD',
                    traducao: 'RESERVA PIPETA',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor B',
                    quantidade: 75,
                    valorUnitario: 5.60,
                    valorTotal: 420.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    sku: 'Stella',
                    item: 17,
                    tipoMolde: 'TAKEOUT TONG BRONZE',
                    traducao: 'GARRA DE BRONZE',
                    classificacao: 'ACESSÓRIO',
                    moeda: 'EUR',
                    fornecedor: 'Fornecedor B',
                    quantidade: 54,
                    valorUnitario: 28.00,
                    valorTotal: 1512.00,
                    createdAt: new Date().toISOString()
                }
            ],
            itensMolde: [
                {
                    id: this.generateId(),
                    item: 1,
                    tipoMolde: 'BLOW MOULD',
                    traducao: 'MOLDE',
                    classificacao: 'MOULD',
                    quantidadeSet: 144,
                    valorUnitario: 308.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    item: 2,
                    tipoMolde: 'VACUUM BOTTOM PLATE',
                    traducao: 'FUNDO DO MOLDE',
                    classificacao: 'MOULD',
                    quantidadeSet: 144,
                    valorUnitario: 56.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    item: 3,
                    tipoMolde: 'SPARE VACUUM BOTTOM PLATE',
                    traducao: 'RESERVA FUNDO DO MOLDE',
                    classificacao: 'MOULD',
                    quantidadeSet: 36,
                    valorUnitario: 56.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    item: 4,
                    tipoMolde: 'BAFFLE MOULD, 10 S+10 S/2-INVERT FLOW COOLING',
                    traducao: 'PRE MOLDE',
                    classificacao: 'MOULD',
                    quantidadeSet: 144,
                    valorUnitario: 182.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    item: 5,
                    tipoMolde: 'BAFFLE INSERT',
                    traducao: 'POSTIÇO',
                    classificacao: 'MOULD',
                    quantidadeSet: 144,
                    valorUnitario: 22.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    item: 6,
                    tipoMolde: 'SPARE BAFFLE INSERT',
                    traducao: 'RESERVA POSTIÇO',
                    classificacao: 'ACESSÓRIO',
                    quantidadeSet: 500,
                    valorUnitario: 22.50,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    item: 7,
                    tipoMolde: 'BAFFLE HOLDER',
                    traducao: 'SUPORTE POSTIÇO',
                    classificacao: 'ACESSÓRIO',
                    quantidadeSet: 144,
                    valorUnitario: 23.00,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    item: 8,
                    tipoMolde: 'NECK RING',
                    traducao: 'COROA',
                    classificacao: 'ACESSÓRIO',
                    quantidadeSet: 680,
                    valorUnitario: 10.30,
                    createdAt: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    item: 9,
                    tipoMolde: 'GUIDE RING',
                    traducao: 'ANEL',
                    classificacao: 'ACESSÓRIO',
                    quantidadeSet: 680,
                    valorUnitario: 10.30,
                    createdAt: new Date().toISOString()
                }
            ],
            saidaMoldes: [
                {
                    id: this.generateId(),
                    data: '2026-03-01',
                    maquina: '591',
                    item: 'Molde',
                    quantidade: 12,
                    created_at: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    data: '2026-03-02',
                    maquina: '592',
                    item: 'Coroa',
                    quantidade: 24,
                    created_at: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    data: '2026-03-03',
                    maquina: '593',
                    item: 'Pré Molde',
                    quantidade: 8,
                    created_at: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    data: '2026-03-04',
                    maquina: '591',
                    item: 'Punção',
                    quantidade: 16,
                    created_at: new Date().toISOString()
                },
                {
                    id: this.generateId(),
                    data: '2026-03-05',
                    maquina: '592',
                    item: 'Postiço',
                    quantidade: 20,
                    created_at: new Date().toISOString()
                }
            ]
        };

        this.saveData(sampleData);
    }

    getData(module) {
        const data = JSON.parse(localStorage.getItem(this.storageKey));
        if (!module) return data || {}; // Retorna todos os dados se não especificar módulo
        return data[module] || [];
    }

    getModule(moduleName) {
        return this.getData(moduleName);
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    updateModule(moduleName, items) {
        const data = JSON.parse(localStorage.getItem(this.storageKey));
        data[moduleName] = items;
        this.saveData(data);
    }

    addItem(moduleName, item) {
        const items = this.getData(moduleName);
        item.id = this.generateId();
        item.createdAt = new Date().toISOString();
        items.push(item);
        this.updateModule(moduleName, items);
        return item;
    }

    updateItem(moduleName, id, newData) {
        const items = this.getData(moduleName);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...newData, id };
            this.updateModule(moduleName, items);
            return items[index];
        }
        return null;
    }

    deleteItem(moduleName, id) {
        let items = this.getData(moduleName);
        items = items.filter(item => item.id !== id);
        this.updateModule(moduleName, items);
    }

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Cálculos Automáticos
class CalculosMoldes {
    static calcularDiasEmMaquina(dataEntrada, dataSaida) {
        if (!dataEntrada || !dataSaida) return 0;
        const entrada = new Date(dataEntrada);
        const saida = new Date(dataSaida);
        const diffTime = Math.abs(saida - entrada);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    static calcularCortesTotal(dias, velocidade) {
        return Math.round(dias * 1440 * velocidade);
    }

    static calcularCortesPorMolde(cortesTotal, qtdMoldes) {
        return qtdMoldes > 0 ? Math.round(cortesTotal / qtdMoldes) : 0;
    }

    static calcularEficiencia(cortesPorMolde, target) {
        return target > 0 ? ((cortesPorMolde / target) * 100).toFixed(1) : 0;
    }

    static calcularTodosMolde(item) {
        const dias = this.calcularDiasEmMaquina(item.dataEntrada, item.dataSaida);
        const cortesTotal = this.calcularCortesTotal(dias, item.velocidade || 0);
        const cortesPorMolde = this.calcularCortesPorMolde(cortesTotal, item.qtdMoldes || 0);
        const eficiencia = this.calcularEficiencia(cortesPorMolde, item.target || 0);
        
        return {
            dias,
            cortesTotal,
            cortesPorMolde,
            eficiencia: parseFloat(eficiencia)
        };
    }

    static calcularDuracaoGas(dataMontagem, dataSaida) {
        if (!dataMontagem || !dataSaida) return 0;
        const montagem = new Date(dataMontagem);
        const saida = new Date(dataSaida);
        const diffTime = Math.abs(saida - montagem);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    static calcularTempoEmpresa(dataEntrada) {
        if (!dataEntrada) return '-';
        
        const entrada = new Date(dataEntrada);
        const hoje = new Date();
        
        let anos = hoje.getFullYear() - entrada.getFullYear();
        let meses = hoje.getMonth() - entrada.getMonth();
        let dias = hoje.getDate() - entrada.getDate();
        
        // Ajustar se os dias forem negativos
        if (dias < 0) {
            meses--;
            const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
            dias += ultimoDiaMesAnterior;
        }
        
        // Ajustar se os meses forem negativos
        if (meses < 0) {
            anos--;
            meses += 12;
        }
        
        // Formatar saída
        if (anos > 0 && meses > 0) {
            return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
        } else if (anos > 0) {
            return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
        } else if (meses > 0) {
            return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
        } else {
            return 'Menos de 1 mês';
        }
    }

    static formatarMoeda(valor, moeda = 'EUR') {
        const simbolos = {
            'EUR': '€',
            'USD': '$',
            'BRL': 'R$'
        };
        const simbolo = simbolos[moeda] || '€';
        return `${simbolo} ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

// Notification Manager
class NotificationManager {
    show(type, title, message) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Modal Manager
class ModalManager {
    show(title, content, onSave) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'dynamicModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <span class="close-modal" onclick="document.getElementById('dynamicModal').remove()">×</span>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('dynamicModal').remove()">Cancelar</button>
                    <button type="button" class="btn-primary" id="modalSaveBtn">Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('modalSaveBtn').addEventListener('click', () => {
            if (onSave) {
                const result = onSave();
                if (result !== false) {
                    modal.remove();
                }
            }
        });
    }
    
    hide() {
        const modal = document.getElementById('dynamicModal');
        if (modal) {
            modal.remove();
        }
    }
}

