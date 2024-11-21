class ChartManager {
    constructor(initialData) {
        console.info('Inicializando ChartManager');
        this.charts = {};
        this.colorPalette = new ColorPaletteManager();
        this.initialData = initialData || {};
        this.initCharts();
        this.setupEventListeners();
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
        console.debug('Inicializando gráficos com dados:', this.initialData);
        
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        };

        // Status (Doughnut)
        this.createChart('status', 'doughnut', {
            ...commonOptions,
            cutout: '60%',
            plugins: {
                ...commonOptions.plugins,
                legend: {
                    ...commonOptions.plugins.legend,
                    position: 'right'
                }
            }
        }, this.colorPalette.getStatusColors(), this.initialData.status);

        // Tipo de Atendimento (Bar horizontal)
        this.createChart('tipo', 'bar', {
            ...commonOptions,
            indexAxis: 'y',
            scales: {
                x: { 
                    beginAtZero: true,
                    grid: { display: false }
                },
                y: {
                    grid: { display: false }
                }
            }
        }, null, this.initialData.tipo);

        // Funcionário (Bar)
        this.createChart('funcionario', 'bar', {
            ...commonOptions,
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { display: false }
                },
                x: {
                    grid: { display: false }
                }
            }
        }, null, this.initialData.funcionario);

        // Cliente (Bar horizontal)
        this.createChart('cliente', 'bar', {
            ...commonOptions,
            indexAxis: 'y',
            scales: {
                x: { 
                    beginAtZero: true,
                    grid: { display: false }
                },
                y: {
                    grid: { display: false }
                }
            }
        }, null, this.initialData.cliente);

        // Sistema (Pie)
        this.createChart('sistema', 'pie', {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                legend: {
                    ...commonOptions.plugins.legend,
                    position: 'right'
                }
            }
        }, null, this.initialData.sistema);

        // Canal (Bar)
        this.createChart('canal', 'bar', {
            ...commonOptions,
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { display: false }
                },
                x: {
                    grid: { display: false }
                }
            }
        }, null, this.initialData.canal);

        // Relato (Bar horizontal)
        this.createChart('relato', 'bar', {
            ...commonOptions,
            indexAxis: 'y',
            scales: {
                x: { 
                    beginAtZero: true,
                    grid: { display: false }
                },
                y: {
                    grid: { display: false }
                }
            }
        }, null, this.initialData.relato);

        // Solicitação (Bar horizontal)
        this.createChart('solicitacao', 'bar', {
            ...commonOptions,
            indexAxis: 'y',
            scales: {
                x: { 
                    beginAtZero: true,
                    grid: { display: false }
                },
                y: {
                    grid: { display: false }
                }
            }
        }, null, this.initialData.solicitacao);
    }

    createChart(type, chartType, options, customColors = null, chartData = null) {
        const elementId = `${type}Chart`;
        const canvas = document.getElementById(elementId);
        
        if (!canvas) {
            console.error(`Elemento ${elementId} não encontrado`);
            return;
        }
    
        const ctx = canvas.getContext('2d');
        const data = chartData || { labels: [], values: [] };
        const dataLength = data.labels.length;
        const colors = customColors || this.colorPalette.getChartColors(dataLength);
        var chartHeight = 300;
    
        // Calcular altura para gráficos de barra horizontal
        if (chartType === 'bar' && options.indexAxis === 'y') {
            const heightPerItem = 25; // altura por item
            const minHeight = 300; // altura mínima
            const calculatedHeight = Math.max(minHeight, dataLength * heightPerItem);
            
            // Definir altura diretamente nas opções do Chart
            if(calculatedHeight > chartHeight){
                chartHeight = calculatedHeight;
    
                canvas.style.height = chartHeight+'px';
            }
        }
    
        const chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: colors.map(color => this.colorPalette.adjustOpacity(color, 0.8)),
                    barThickness: 20
                }]
            },
            options: {
                ...options,
                // maintainAspectRatio: false, // Importante para respeitar a altura definida
                // responsive: true,
                height: chartHeight,
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const value = this.charts[type].data.labels[index];
                        console.debug(`Clique no gráfico ${type}:`, value);
                        
                        document.dispatchEvent(new CustomEvent('chartClick', {
                            detail: {
                                type: type,
                                value: value
                            }
                        }));
                    }
                }
            }
        });
    
        this.charts[type] = chart;
        return chart;
    }
    
    updateCharts(data) {
        console.debug('Atualizando gráficos com dados:', data);
        
        if (!data) {
            console.error('Dados inválidos para atualização dos gráficos');
            return;
        }

        Object.entries(this.charts).forEach(([type, chart]) => {
            const chartData = data[type];
            if (!chartData || !chartData.labels || !chartData.values) {
                console.warn(`Dados inválidos para o gráfico ${type}`);
                return;
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
            
            chart.update('none');
        });
    }

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.resize();
            }
        });
    }
}

