class TimelineChart {
    constructor() {
        console.info('Inicializando TimelineChart');
        this.chart = null;
        this.initialize();
        this.setupEventListeners();
    }

    initialize() {
        const canvas = document.getElementById('timelineChart');
        if (!canvas) {
            console.error('Elemento timelineChart não encontrado');
            return;
        }

        const ctx = canvas.getContext('2d');
        
        try {
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        borderColor: '#4e73df',
                        backgroundColor: window.TimelineUtils.createGradient(ctx),
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#4e73df',
                        pointBorderColor: '#ffffff',
                        pointHoverBackgroundColor: '#ffffff',
                        pointHoverBorderColor: '#4e73df'
                    }]
                },
                options: window.TimelineConfig.getChartOptions()
            });
        } catch (error) {
            console.error('Erro ao inicializar timeline:', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('filterChange', (event) => {
            if (!event.detail) return;
            const filters = event.detail;
            if (window.dashboardManager?.filteredData) {
                const filteredData = this.applyFilters(
                    window.dashboardManager.filteredData, 
                    filters
                );
                this.update(filteredData);
            }
        });

        document.addEventListener('dashboardUpdate', (event) => {
            if (event.detail?.registros) {
                const filters = window.dashboardManager?.filterManager?.getActiveFilters();
                const filteredData = filters ? 
                    this.applyFilters(event.detail.registros, filters) : 
                    event.detail.registros;
                this.update(filteredData);
            }
        });
    }

    applyFilters(data, filters) {
        if (!data || !filters) return data;

        return data.filter(registro => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) {
                    return true;
                }

                if (key === 'period') {
                    const dataAtendimento = registro.data_atendimento;
                    return dataAtendimento >= value.start && dataAtendimento <= value.end;
                }

                const fieldMappings = {
                    'status': 'status_atendimento',
                    'tipo': 'tipo_atendimento',
                    'funcionario': 'funcionario',
                    'cliente': 'cliente',
                    'sistema': 'sistema',
                    'canal': 'canal_atendimento',
                    'relato': 'solicitacao_cliente',
                    'solicitacao': 'tipo_atendimento',
                    'relatosDetalhados': 'solicitacao_cliente',
                    'origemProblema': 'origem_problema'
                };

                const fieldName = fieldMappings[key] || key;
                const fieldValue = registro[fieldName];
                
                return Array.isArray(value) ? 
                    value.includes(fieldValue) : 
                    value === fieldValue;
            });
        });
    }

    update(data) {
        if (!this.chart) {
            console.error('Timeline Chart não inicializado');
            return;
        }

        try {
            const processedData = window.TimelineUtils.processData(data);
            
            const currentData = {
                labels: this.chart.data.labels,
                values: this.chart.data.datasets[0].data
            };
            
            const hasChanges = 
                JSON.stringify(currentData.labels) !== JSON.stringify(processedData.labels) ||
                JSON.stringify(currentData.values) !== JSON.stringify(processedData.values);

            if (hasChanges) {
                this.chart.data.labels = processedData.labels;
                this.chart.data.datasets[0].data = processedData.values;
                this.chart.update('none');
            }
        } catch (error) {
            console.error('Erro ao atualizar timeline:', error);
        }
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}