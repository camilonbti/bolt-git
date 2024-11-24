class DashboardDataManager {
    constructor() {
        console.info('Inicializando DashboardDataManager');
        this.timezone = 'America/Sao_Paulo';
        this.data = {
            registros: [],
            kpis: {
                total_registros: 0,
                total_pendentes: 0,
                taxa_conclusao: 0,
                tempo_medio: 0
            },
            graficos: {
                status: { labels: [], values: [] },
                tipo: { labels: [], values: [] },
                funcionario: { labels: [], values: [] },
                cliente: { labels: [], values: [] },
                sistema: { labels: [], values: [] },
                canal: { labels: [], values: [] },
                relato: { labels: [], values: [] },
                solicitacao: { labels: [], values: [] }
            },
            ultima_atualizacao: this.formatDateTime(new Date())
        };
    }

    async loadInitialData() {
        try {
            const loadingState = document.getElementById('loadingState');
            const dashboardContent = document.getElementById('dashboardContent');

            if (loadingState) loadingState.classList.remove('d-none');
            if (dashboardContent) dashboardContent.classList.add('d-none');

            const response = await fetch('/api/data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data || !data.registros) {
                throw new Error('Dados inválidos recebidos do servidor');
            }

            data.registros = data.registros.map(registro => ({
                ...registro,
                data_hora: this.processTimestamp(registro.data_hora)
            }));

            this.data = {
                ...data,
                graficos: data.graficos || {
                    status: { labels: [], values: [] },
                    tipo: { labels: [], values: [] },
                    funcionario: { labels: [], values: [] },
                    cliente: { labels: [], values: [] },
                    sistema: { labels: [], values: [] },
                    canal: { labels: [], values: [] },
                    relato: { labels: [], values: [] },
                    solicitacao: { labels: [], values: [] }
                }
            };
            
            if (loadingState) loadingState.classList.add('d-none');
            if (dashboardContent) dashboardContent.classList.remove('d-none');

            return this.data;

        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            if (loadingState) loadingState.classList.add('d-none');
            throw error;
        }
    }

    processTimestamp(timestamp) {
        if (!timestamp) return null;
        
        try {
            if (typeof timestamp === 'number') {
                return timestamp;
            }
            
            if (typeof timestamp === 'string' && timestamp.includes('/')) {
                const [date, time] = timestamp.split(' ');
                const [day, month, year] = date.split('/');
                const [hour, minute, second] = (time || '00:00:00').split(':');
                
                const dateObj = new Date(year, month - 1, day, hour, minute, second);
                return dateObj.getTime();
            }
            
            const dateObj = new Date(timestamp);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.getTime();
            }
            
            throw new Error('Invalid timestamp format');
            
        } catch (error) {
            console.error('Erro ao processar timestamp:', error);
            return null;
        }
    }

    formatDateTime(date) {
        return date.toLocaleString('pt-BR', {
            timeZone: this.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    update(newData) {
        if (!newData || !newData.registros) {
            console.error('Dados inválidos para atualização');
            return;
        }

        newData.registros = newData.registros.map(registro => ({
            ...registro,
            data_hora: this.processTimestamp(registro.data_hora)
        }));

        // Garante que todos os gráficos existam mesmo com dados vazios
        if (!newData.graficos) {
            newData.graficos = {
                status: { labels: [], values: [] },
                tipo: { labels: [], values: [] },
                funcionario: { labels: [], values: [] },
                cliente: { labels: [], values: [] },
                sistema: { labels: [], values: [] },
                canal: { labels: [], values: [] },
                relato: { labels: [], values: [] },
                solicitacao: { labels: [], values: [] }
            };
        }

        this.data = newData;
        document.dispatchEvent(new CustomEvent('dashboardUpdate', { 
            detail: this.data 
        }));
    }
}
