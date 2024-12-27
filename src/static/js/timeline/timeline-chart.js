class TimelineChart {
    constructor() {
        console.info('Inicializando TimelineChart');
        this.charts = {};
        this.colorPalette = new ColorPaletteManager();
        this.setupEventListeners();
        // Removida inicialização imediata dos gráficos
    }

    initialize(initialData) {
        try {
            console.debug('Inicializando gráficos com dados:', initialData?.length || 0);
            
            // Processa dados iniciais
            const processedData = initialData ? TimelineUtils.processData(initialData) : {
                dailyData: { labels: [], values: [] },
                hourlyData: { labels: Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`), values: Array(24).fill(0) }
            };

            // Cria gráfico diário com dados iniciais
            const dailyConfig = TimelineChartConfig.getBaseConfig();
            dailyConfig.data.labels = processedData.dailyData.labels;
            dailyConfig.data.datasets[0].data = processedData.dailyData.values;
            this.createChart('daily', 'timelineChart', dailyConfig);

            // Cria gráfico horário com dados iniciais
            const hourlyConfig = TimelineChartConfig.getHourlyConfig();
            hourlyConfig.data.labels = processedData.hourlyData.labels;
            hourlyConfig.data.datasets[0].data = processedData.hourlyData.values;
            this.createChart('hourly', 'hourlyTimelineChart', hourlyConfig);

        } catch (error) {
            console.error('Erro ao inicializar gráficos:', error);
        }
    }

    createChart(type, elementId, config) {
        const canvas = document.getElementById(elementId);
        if (!canvas) {
            console.error(`Elemento ${elementId} não encontrado`);
            return;
        }

        const ctx = canvas.getContext('2d');
        config.data.datasets[0].backgroundColor = this.createGradient(ctx);
        this.charts[type] = new Chart(canvas, config);
    }

    createGradient(ctx) {
        if (!ctx) return 'rgba(78,115,223,0.3)';

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(78,115,223,0.3)');
        gradient.addColorStop(1, 'rgba(78,115,223,0)');
        return gradient;
    }

    update(data) {
        if (!data || !Array.isArray(data)) {
            console.warn('Dados inválidos para atualização dos gráficos');
            return;
        }

        try {
            // Se os gráficos ainda não foram inicializados, inicializa com os dados
            if (!this.charts.daily || !this.charts.hourly) {
                this.initialize(data);
                return;
            }

            // Processa os dados usando o utilitário
            const processedData = TimelineUtils.processData(data);

            // Atualiza gráfico diário
            if (this.charts.daily) {
                this.charts.daily.data.labels = processedData.dailyData.labels;
                this.charts.daily.data.datasets[0].data = processedData.dailyData.values;
                this.charts.daily.update('none');
            }

            // Atualiza gráfico horário
            if (this.charts.hourly) {
                this.charts.hourly.data.datasets[0].data = processedData.hourlyData.values;
                this.charts.hourly.update('none');
            }
        } catch (error) {
            console.error('Erro ao atualizar gráficos:', error);
        }
    }

    setupEventListeners() {
        // Escuta atualizações do dashboard
        document.addEventListener('dashboardUpdate', (event) => {
            if (event.detail?.registros) {
                console.debug('Atualizando timeline com novos dados:', event.detail.registros.length);
                this.update(event.detail.registros);
            }
        });

        // Escuta mudanças nos filtros
        document.addEventListener('filterChange', (event) => {
            if (window.dashboardManager?.filteredData) {
                console.debug('Atualizando timeline com dados filtrados:', window.dashboardManager.filteredData.length);
                this.update(window.dashboardManager.filteredData);
            }
        });
    }

    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}