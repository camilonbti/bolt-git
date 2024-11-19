class ChartManager {
    constructor() {
        console.info('Inicializando ChartManager');
        this.charts = {};
        this.colorPalette = new ColorPaletteManager();
        this.initCharts();
    }

    initCharts() {
        console.debug('Inicializando gráficos');
        
        // Configurações comuns para todos os gráficos
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
        this.initChart('status', 'doughnut', {
            ...commonOptions,
            cutout: '60%',
            plugins: {
                ...commonOptions.plugins,
                legend: {
                    ...commonOptions.plugins.legend,
                    position: 'right'
                }
            }
        }, this.colorPalette.getStatusColors());

        // Tipo de Atendimento (Bar horizontal)
        this.initChart('tipo', 'bar', {
            ...commonOptions,
            indexAxis: 'y',
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
        });

        // Funcionário (Bar)
        this.initChart('funcionario', 'bar', {
            ...commonOptions,
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        });

        // Cliente (Bar horizontal)
        this.initChart('cliente', 'bar', {
            ...commonOptions,
            indexAxis: 'y',
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
        });

        // Sistema (Pie)
        this.initChart('sistema', 'pie', {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                legend: {
                    ...commonOptions.plugins.legend,
                    position: 'right'
                }
            }
        });

        // Canal (Bar)
        this.initChart('canal', 'bar', {
            ...commonOptions,
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        });

        // Solicitações (Bar horizontal)
        this.initChart('solicitacao', 'bar', {
            ...commonOptions,
            indexAxis: 'y',
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
        });
    }

    initChart(type, chartType, options, customColors = null) {
        const ctx = document.getElementById(`${type}Chart`)?.getContext('2d');
        if (!ctx) {
            console.warn(`Elemento ${type}Chart não encontrado`);
            return;
        }

        const colors = customColors || this.colorPalette.getChartColors(10);

        this.charts[type] = new Chart(ctx, {
            type: chartType,
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: colors.map(color => this.colorPalette.adjustOpacity(color, 0.8))
                }]
            },
            options: {
                ...options,
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
    }

    updateCharts(data) {
        console.debug('Atualizando gráficos com dados:', data);
        
        Object.entries(this.charts).forEach(([type, chart]) => {
            if (data[type]) {
                const activeFilters = window.filterManager?.getActiveFilters() || {};
                const dataLength = data[type].labels.length;
                const colors = type === 'status' ? 
                    this.colorPalette.getStatusColors() : 
                    this.colorPalette.getChartColors(dataLength);
                
                chart.data.labels = data[type].labels;
                chart.data.datasets[0].data = data[type].values;
                
                // Aplica cores com destaque para itens filtrados
                chart.data.datasets[0].backgroundColor = data[type].labels.map((label, index) => {
                    const baseColor = colors[index % colors.length];
                    return activeFilters[type]?.includes(label) ?
                        this.colorPalette.adjustOpacity(baseColor, 0.8) :
                        baseColor;
                });
                
                chart.update('show');
            }
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