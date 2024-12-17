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
        const commonOptions = window.chartDimensionsManager.getCommonChartOptions();

        // Timeline por Dia
        this.createChart('timelineDay', 'line', {
            ...commonOptions,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'dd/MM/yyyy'
                        },
                        tooltipFormat: 'dd/MM/yyyy'
                    },
                    adapters: {
                        date: {
                            locale: 'pt-BR'
                        }
                    },
                    ticks: {
                        source: 'auto',
                        maxRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (context) => {
                            const date = new Date(context[0].parsed.x);
                            return date.toLocaleDateString('pt-BR');
                        },
                        label: (context) => `Total: ${context.raw}`
                    }
                }
            }
        });

        // Timeline por Hora
        this.createChart('timelineHour', 'line', {
            ...commonOptions,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        displayFormats: {
                            hour: 'HH:mm'
                        },
                        tooltipFormat: 'HH:mm'
                    },
                    adapters: {
                        date: {
                            locale: 'pt-BR'
                        }
                    },
                    ticks: {
                        source: 'auto',
                        maxRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (context) => {
                            const date = new Date(context[0].parsed.x);
                            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        },
                        label: (context) => `Total: ${context.raw}`
                    }
                }
            }
        });

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
            relatosDetalhados: 'Relatos Detalhados',
            timelineDay: 'Atendimentos por Dia',
            timelineHour: 'Atendimentos por Hora'
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
        
        const dimensions = window.chartDimensionsManager.getChartConfig(elementId, dataLength, chartType);
        
        const chartData = type.startsWith('timeline') ? {
            datasets: [{
                data: data.values.map((value, index) => ({
                    x: new Date(data.labels[index]).getTime(),
                    y: value
                })),
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: chartType === 'line' ? colors[1] : colors.map(color => this.colorPalette.adjustOpacity(color, 0.8)),
                tension: chartType === 'line' ? 0.4 : 0
            }]
        } : {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: chartType === 'line' ? colors[1] : colors.map(color => this.colorPalette.adjustOpacity(color, 0.8)),
                tension: chartType === 'line' ? 0.4 : 0
            }]
        };
        
        const chart = new Chart(ctx, {
            type: chartType,
            data: chartData,
            options: {
                ...options,
                ...dimensions,
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const value = chart.data.labels ? chart.data.labels[index] : null;
                        if (value) {
                            document.dispatchEvent(new CustomEvent('chartClick', {
                                detail: { type, value }
                            }));
                        }
                    }
                },
                plugins: {
                    ...options.plugins,
                    tooltip: {
                        ...options.plugins?.tooltip,
                        callbacks: {
                            title: (context) => {
                                if (type.startsWith('timeline')) {
                                    const date = new Date(context[0].parsed.x);
                                    return type === 'timelineDay' ? 
                                        date.toLocaleDateString('pt-BR') :
                                        date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                }
                                return context[0].label;
                            },
                            label: (context) => {
                                const value = type.startsWith('timeline') ? context.parsed.y : context.raw;
                                return `Total: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    ...options.scales,
                    x: {
                        ...options.scales?.x,
                        type: type.startsWith('timeline') ? 'time' : 'category',
                        time: type.startsWith('timeline') ? {
                            unit: type === 'timelineDay' ? 'day' : 'hour',
                            displayFormats: {
                                day: 'dd/MM/yyyy',
                                hour: 'HH:mm'
                            },
                            tooltipFormat: type === 'timelineDay' ? 'dd/MM/yyyy' : 'HH:mm'
                        } : undefined,
                        adapters: type.startsWith('timeline') ? {
                            date: {
                                locale: 'pt-BR'
                            }
                        } : undefined
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
            
            if (type.startsWith('timeline')) {
                chart.data.datasets[0].data = chartData.values.map((value, index) => ({
                    x: new Date(chartData.labels[index]).getTime(),
                    y: value
                }));
                chart.data.datasets[0].borderColor = colors[1];
                chart.data.datasets[0].backgroundColor = this.colorPalette.adjustOpacity(colors[1], 0.1);
            } else {
                chart.data.labels = chartData.labels;
                chart.data.datasets[0].data = chartData.values;
                chart.data.datasets[0].backgroundColor = chartData.labels.map((label, index) => {
                    const baseColor = colors[index % colors.length];
                    return activeFilters[type]?.includes(label) ?
                        this.colorPalette.adjustOpacity(baseColor, 0.8) :
                        baseColor;
                });
            }
            
            window.chartDimensionsManager.updateChartDimensions(chart, dataLength);
            
            chart.update('none');
        });
    }

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                const dataLength = chart.data.labels ? chart.data.labels.length : 
                    chart.data.datasets[0].data.length;
                window.chartDimensionsManager.updateChartDimensions(chart, dataLength);
            }
        });
    }
}