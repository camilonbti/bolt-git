class DashboardManager {
    constructor() {
        console.info('Inicializando DashboardManager');
        this.initializeComponents();
        this.setupEventListeners();
    }

    initializeComponents() {
        try {
            // Inicializa gerenciador de dados primeiro
            this.dataManager = new DashboardDataManager();
            
            // Inicializa componentes de UI
            this.chartManager = new ChartManager();
            this.tableManager = new TableManager();
            this.filterManager = new FilterManager();
            
            // Inicializa atualizador por último
            this.updater = new DashboardUpdater();
            
            console.debug('Componentes inicializados com sucesso');
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
        console.debug('Atualizando dashboard com novos dados');
        
        try {
            if (!data) {
                throw new Error('Dados inválidos');
            }

            this.updateKPIs(data.kpis || {});
            
            if (this.chartManager) {
                this.chartManager.updateCharts(data.graficos || {});
            }
            
            if (this.tableManager) {
                this.tableManager.updateTable(data.registros || []);
            }
            
            this.updateTimestamp(data.ultima_atualizacao);
            
            console.info('Dashboard atualizado com sucesso:', {
                registros: data.registros?.length || 0,
                graficos: Object.keys(data.graficos || {})
            });
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
                elements.totalAtendimentos.textContent = (kpis.total_registros || 0).toLocaleString();
            }
            if (elements.totalPendentes) {
                elements.totalPendentes.textContent = (kpis.total_pendentes || 0).toLocaleString();
            }
            if (elements.totalConcluidos) {
                elements.totalConcluidos.textContent = (kpis.total_concluidos || 0).toLocaleString();
            }
            if (elements.taxaConclusao) {
                elements.taxaConclusao.textContent = `${(kpis.taxa_conclusao || 0).toFixed(1)}%`;
            }
        } catch (error) {
            console.error('Erro ao atualizar KPIs:', error);
        }
    }

    updateTimestamp(timestamp) {
        const element = document.getElementById('lastUpdate');
        if (element && timestamp) {
            try {
                const date = new Date(timestamp);
                element.textContent = date.toLocaleString('pt-BR');
            } catch (error) {
                console.error('Erro ao formatar timestamp:', error);
                element.textContent = timestamp;
            }
        }
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