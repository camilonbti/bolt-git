class DashboardManager {
    constructor() {
        console.info('Inicializando DashboardManager');
        this.dataManager = new DashboardDataManager();
        this.chartManager = new ChartManager();
        this.filterManager = new FilterManager();
        this.tableManager = new TableManager();
        
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        console.debug('Configurando event listeners');
        
        document.addEventListener('dashboardUpdate', (event) => {
            console.debug('Evento de atualização recebido');
            this.updateDashboard(event.detail);
        });

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Listener para limpar período
        const clearPeriodBtn = document.getElementById('clearPeriod');
        if (clearPeriodBtn) {
            clearPeriodBtn.addEventListener('click', () => {
                this.filterManager.initializeDateFields();
            });
        }
    }

    loadInitialData() {
        console.debug('Carregando dados iniciais');
        const data = this.dataManager.data;
        if (data) {
            this.updateDashboard(data);
        }
    }

    updateDashboard(data) {
        console.debug('Atualizando dashboard com novos dados');
        
        try {
            if (!data) {
                throw new Error('Dados inválidos');
            }

            this.updateKPIs(data.kpis || {});
            this.chartManager.updateCharts(data.graficos || {});
            this.tableManager.updateTable(data.registros || []);
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
        console.debug('Atualizando KPIs:', kpis);
        
        const elements = {
            totalAtendimentos: document.getElementById('totalAtendimentos'),
            totalPendentes: document.getElementById('totalPendentes'),
            totalConcluidos: document.getElementById('totalConcluidos')
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

    async refreshData() {
        console.debug('Iniciando atualização manual dos dados');
        try {
            const response = await fetch('/api/data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.dataManager.update(data);
            this.showSuccess('Dados atualizados com sucesso');
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            this.showError('Erro ao atualizar dados');
        }
    }

    exportData() {
        console.debug('Iniciando exportação de dados');
        try {
            const data = this.dataManager.data?.registros;
            if (!data || data.length === 0) {
                this.showError('Não há dados para exportar');
                return;
            }

            const headers = [
                'Data/Hora',
                'Cliente',
                'Funcionário',
                'Status',
                'Tipo',
                'Sistema',
                'Canal',
                'Descrição'
            ];
            
            const csvContent = [
                headers.join(','),
                ...data.map(row => [
                    row.data_hora || '',
                    row.cliente || '',
                    row.funcionario || '',
                    row.status_atendimento || '',
                    row.tipo_atendimento || '',
                    row.sistema || '',
                    row.canal_atendimento || '',
                    `"${((row.descricao_atendimento || '').replace(/"/g, '""'))}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `atendimentos_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            this.showSuccess('Dados exportados com sucesso');
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            this.showError('Erro ao exportar dados');
        }
    }

    showSuccess(message) {
        console.info(message);
        // TODO: Implementar toast ou alert bootstrap
    }

    showError(message) {
        console.error(message);
        // TODO: Implementar toast ou alert bootstrap
    }
}