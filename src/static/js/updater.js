class DashboardUpdater {
    constructor() {
        this.chartManager = new ChartManager();
        this.kpiManager = new KPIManager();
        this.tableManager = new TableManager();
    }

    // Atualiza todos os componentes do dashboard
    updateDashboard(data) {
        try {
            console.info('Iniciando atualização do dashboard com novos dados');

            // Se os dados estiverem vazios, limpa todos os componentes
            if (!data || data.length === 0) {
                console.warn('Dados vazios recebidos para atualização');
                this.clearComponents();
                this.showUserMessage('Nenhum dado disponível para exibição.');
                return;
            }

            // Atualiza KPIs com base nos dados
            this.updateKPIs(data);

            // Atualiza gráficos com base nos dados
            this.updateCharts(data);

            // Atualiza a tabela de atendimentos com base nos dados
            this.updateTable(data);

            console.debug('Dashboard atualizado com sucesso');
        } catch (error) {
            console.error('Erro ao atualizar o dashboard:', error);
            this.clearComponents();
            this.showUserMessage('Ocorreu um erro ao atualizar o dashboard. Tente novamente.');
        }
    }

    // Atualiza os KPIs no dashboard
    updateKPIs(data) {
        try {
            console.debug('Calculando e atualizando KPIs...');
            const kpis = this.kpiManager.calculateKPIs(data);
            this.kpiManager.updateKPIs(kpis);
        } catch (error) {
            console.error('Erro ao atualizar KPIs:', error);
        }
    }

    // Atualiza os gráficos no dashboard
    updateCharts(data) {
        try {
            console.debug('Atualizando gráficos com dados...');
            this.chartManager.updateCharts(data);
        } catch (error) {
            console.error('Erro ao atualizar gráficos:', error);
        }
    }

    // Atualiza a tabela de atendimentos no dashboard
    updateTable(data) {
        try {
            console.debug('Atualizando tabela com dados...');
            this.tableManager.updateTable(data);
        } catch (error) {
            console.error('Erro ao atualizar tabela:', error);
        }
    }

    // Limpa todos os componentes do dashboard
    clearComponents() {
        console.debug('Limpando componentes do dashboard...');
        this.chartManager.clearCharts();
        this.kpiManager.clearKPIs();
        this.tableManager.clearTable();
    }

    // Exibe uma mensagem de erro para o usuário
    showUserMessage(message) {
        const messageElement = document.getElementById('userMessage');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.classList.remove('d-none');

            // Remove a mensagem após alguns segundos
            setTimeout(() => {
                messageElement.classList.add('d-none');
            }, 5000);
        }
    }
}