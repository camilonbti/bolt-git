class DashboardManager {
    constructor() {
        console.info('Inicializando DashboardManager');
        this.timezone = 'America/Sao_Paulo';
        this.initializeComponents();
    }

    async initializeComponents() {
        try {
            // Inicializa gerenciador de dados primeiro
            this.dataManager = new DashboardDataManager();
            
            // Aguarda o carregamento inicial dos dados
            const initialData = await this.dataManager.loadInitialData();
            
            if (!initialData) {
                throw new Error('Falha ao carregar dados iniciais');
            }
            
            // Após ter os dados, inicializa os componentes visuais
            this.chartManager = new ChartManager(initialData.graficos);
            this.tableManager = new TableManager();
            this.filterManager = new FilterManager();
            this.updater = new DashboardUpdater();
            
            // Configura listeners de eventos
            this.setupEventListeners();
            
            console.debug('Componentes inicializados com sucesso');
            
            // Atualiza dashboard com dados iniciais
            this.updateDashboard(initialData);
            
        } catch (error) {
            console.error('Erro ao inicializar componentes:', error);
            this.showError('Erro ao inicializar dashboard');
        }
    }

    setupEventListeners() {
        document.addEventListener('dashboardUpdate', (event) => {
            console.debug('Evento de atualização recebido');
            this.updateDashboard(event.detail);
        });
    }

    updateDashboard(data) {
        if (!data) {
            console.error('Dados inválidos para atualização');
            return;
        }

        try {
            this.updateKPIs(data.kpis || {});
            
            if (this.chartManager) {
                this.chartManager.updateCharts(data.graficos || {});
            }
            
            if (this.tableManager) {
                this.tableManager.updateTable(data.registros || []);
            }
            
            this.updateTimestamp(data.ultima_atualizacao);
            
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
            this.showError('Erro ao atualizar dashboard');
        }
    }

    updateKPIs(kpis) {
        const elements = {
            totalAtendimentos: document.getElementById('totalAtendimentos'),
            totalPendentes: document.getElementById('totalPendentes'),
            totalConcluidos: document.getElementById('totalConcluidos'),
            taxaConclusao: document.getElementById('taxaConclusao')
        };

        try {
            if (elements.totalAtendimentos) {
                elements.totalAtendimentos.textContent = this.formatNumber(kpis.total_registros);
            }
            if (elements.totalPendentes) {
                elements.totalPendentes.textContent = this.formatNumber(kpis.total_pendentes);
            }
            if (elements.totalConcluidos) {
                elements.totalConcluidos.textContent = this.formatNumber(kpis.total_concluidos);
            }
            if (elements.taxaConclusao) {
                elements.taxaConclusao.textContent = `${this.formatNumber(kpis.taxa_conclusao, 1)}%`;
            }
        } catch (error) {
            console.error('Erro ao atualizar KPIs:', error);
        }
    }

    updateTimestamp(timestamp) {
        const element = document.getElementById('lastUpdate');
        if (element && timestamp) {
            try {
                const date = new Date(parseInt(timestamp));
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid timestamp');
                }
                
                const options = {
                    timeZone: this.timezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                };
                
                element.textContent = date.toLocaleString('pt-BR', options);
            } catch (error) {
                console.error('Erro ao formatar timestamp:', error);
                element.textContent = 'Data inválida';
            }
        }
    }

    formatNumber(value, decimals = 0) {
        const num = Number(value || 0);
        return num.toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    showError(message) {
        console.error(message);
        const errorAlert = document.getElementById('updateError');
        if (errorAlert) {
            const errorMessage = errorAlert.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
            errorAlert.classList.remove('d-none');
            setTimeout(() => {
                errorAlert.classList.add('d-none');
            }, 5000);
        }
    }
}