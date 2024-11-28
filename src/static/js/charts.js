class ChartManager {
    constructor(initialData) {
        console.info('Inicializando ChartManager');
        this.charts = {};
        this.colorPalette = new ColorPaletteManager();
        this.initialData = initialData || {};
        this.setupEventListeners();
        this.initCharts();
    }

    setupEventListeners() {
        document.addEventListener('dashboardUpdate', (event) => {
            if (event.detail && event.detail.graficos) {
                this.updateCharts(event.detail.graficos);
            }
        });

        window.addEventListener('resize', () => {
            this.resizeCharts();
        });
    }

    initCharts() {
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        };

        // Alterado de 'doughnut' para 'bar'
        this.createChart('status', 'bar', {
            ...commonOptions,
            plugins: {
                legend: {
                    display: false
                }
            }
        });

        const barCharts = [
            'tipo',
            'funcionario',
            'cliente',
            'sistema',
            'canal',
            'relato',
            'solicitacao',
            'relatosDetalhados'
        ];

        barCharts.forEach(type => {
            this.createChart(type, 'bar', {
                ...commonOptions,
                plugins: {
                    ...commonOptions.plugins,
                    title: {
                        display: true
                    }
                }
            });
        });
    }

    getChartTitle(type) {
        const titles = {
            tipo: 'Tipos de Atendimento',
            funcionario: 'Atendimentos por Funcionário',
            cliente: 'Atendimentos por Cliente',
            sistema: 'Sistemas',
            canal: 'Canais de Atendimento',
            relato: 'Relatos de Atendimento',
            solicitacao: 'Tipos de Solicitação',
            relatosDetalhados: 'Relatos Detalhados'
        };
        return titles[type] || type;
    }

    createChart(type, chartType, options, customColors = null) {
        const elementId = `${type}Chart`;
        const canvas = document.getElementById(elementId);
        
        if (!canvas) {
            console.error(`Elemento ${elementId} não encontrado`);
            return;
        }
    
        const ctx = canvas.getContext('2d');
        const data = this.initialData[type] || { labels: [], values: [] };
        const dataLength = data.labels.length;
        const colors = customColors || this.colorPalette.getChartColors(dataLength);
        
        // Usa o gerenciador de dimensões
        const dimensions = window.chartDimensionsManager.getChartConfig(dataLength, chartType);
        
        const chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: colors.map(color => this.colorPalette.adjustOpacity(color, 0.8))
                }]
            },
            options: {
                ...options,
                ...dimensions,
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const value = chart.data.labels[index];
                        document.dispatchEvent(new CustomEvent('chartClick', {
                            detail: { type, value }
                        }));
                    }
                }
            }
        });
    
        this.charts[type] = chart;
        return chart;
    }

    updateCharts(data) {
        if (!data) {
            console.error('Dados inválidos para atualização dos gráficos');
            return;
        }

        Object.entries(this.charts).forEach(([type, chart]) => {
            if (!chart) {
                console.warn(`Gráfico ${type} não inicializado`);
                return;
            }

            const chartData = data[type] || { labels: [], values: [] };
            if (!chartData.labels || !chartData.values) {
                chartData.labels = [];
                chartData.values = [];
            }

            const activeFilters = window.filterManager?.getActiveFilters() || {};
            const dataLength = chartData.labels.length;
            const colors = type === 'status' ? 
                this.colorPalette.getStatusColors() : 
                this.colorPalette.getChartColors(dataLength);
            
            chart.data.labels = chartData.labels;
            chart.data.datasets[0].data = chartData.values;
            
            chart.data.datasets[0].backgroundColor = chartData.labels.map((label, index) => {
                const baseColor = colors[index % colors.length];
                return activeFilters[type]?.includes(label) ?
                    this.colorPalette.adjustOpacity(baseColor, 0.8) :
                    baseColor;
            });
            
            // Atualiza dimensões usando o gerenciador
            window.chartDimensionsManager.updateChartDimensions(chart, dataLength);
            
            chart.update('none');
        });
    }

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                const dataLength = chart.data.labels.length;
                window.chartDimensionsManager.updateChartDimensions(chart, dataLength);
            }
        });
    }
}