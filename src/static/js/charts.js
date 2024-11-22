class ChartManager {
    constructor(initialData) {
        console.info('Inicializando ChartManager');
        this.charts = {};
        this.colorPalette = new ColorPaletteManager();
        this.initialData = initialData || {};
        Chart.register(ChartDataLabels); // Registra o plugin globalmente
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
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 10,
                    cornerRadius: 4,
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${value} (${percentage}%)`;
                        }
                    }
                },
                datalabels: {
                    color: '#666',
                    font: {
                        weight: '500',
                        size: 11
                    },
                    anchor: 'end',
                    align: 'right',
                    offset: 4,
                    formatter: (value, context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${value} (${percentage}%)`;
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        color: '#666'
                    }
                },
                y: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#444',
                        padding: 8
                    }
                }
            },
            layout: {
                padding: {
                    left: 10,
                    right: 25,
                    top: 15,
                    bottom: 15
                }
            },
            animation: {
                duration: 500,
                easing: 'easeOutQuart'
            }
        };

        // Todos os gráficos como barras horizontais
        const allCharts = [
            'status',
            'tipo',
            'funcionario',
            'cliente',
            'sistema',
            'canal',
            'relato',
            'solicitacao'
        ];

        allCharts.forEach(type => {
            const options = {...commonOptions};
            
            // Configurações específicas para cada tipo de gráfico
            if (type === 'status') {
                options.plugins.datalabels.color = '#fff';
                options.plugins.datalabels.font.weight = 'bold';
            }

            // Configurações de hover e interatividade
            options.hover = {
                mode: 'nearest',
                intersect: false,
                animationDuration: 150
            };

            // Configurações de barra
            options.datasets = {
                bar: {
                    borderWidth: 0,
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.9
                }
            };
            
            this.createChart(type, 'bar', options);
        });
    }

    calculateChartDimensions(dataLength) {
        const containerHeight = 300;
        const maxBarsWithoutScroll = 9;
        const minBarHeight = 30;
        const maxBarHeight = 50;
        const paddingTop = 20;
        const paddingBottom = 40;
        const availableHeight = containerHeight - (paddingTop + paddingBottom);

        if (dataLength === 0) {
            return {
                totalHeight: containerHeight,
                needsScroll: false,
                contentHeight: 0,
                barHeight: maxBarHeight,
                barPercentage: 0.8,
                categoryPercentage: 0.9
            };
        }

        if (dataLength <= maxBarsWithoutScroll) {
            const optimalBarHeight = Math.min(maxBarHeight, availableHeight / dataLength);
            const totalContentHeight = dataLength * optimalBarHeight;
            
            // Ajusta a proporção das barras baseado na quantidade
            const barPercentage = Math.max(0.6, Math.min(0.8, 1 - (dataLength / maxBarsWithoutScroll) * 0.2));
            
            return {
                totalHeight: containerHeight,
                needsScroll: false,
                contentHeight: totalContentHeight,
                barHeight: optimalBarHeight,
                barPercentage: barPercentage,
                categoryPercentage: 0.9
            };
        }

        const totalContentHeight = dataLength * minBarHeight;
        return {
            totalHeight: Math.max(containerHeight, totalContentHeight + paddingTop + paddingBottom),
            needsScroll: true,
            contentHeight: totalContentHeight,
            barHeight: minBarHeight,
            barPercentage: 0.6,
            categoryPercentage: 0.9
        };
    }

    createChart(type, chartType, options) {
        const elementId = `${type}Chart`;
        const canvas = document.getElementById(elementId);
        
        if (!canvas) {
            console.error(`Elemento ${elementId} não encontrado`);
            return;
        }
    
        const ctx = canvas.getContext('2d');
        const data = this.initialData[type] || { labels: [], values: [] };
        const dataLength = data.labels.length;
        const colors = type === 'status' ? 
            data.labels.map(label => this.colorPalette.getStatusColor(label)) :
            this.colorPalette.getChartColors(dataLength);
        
        const dimensions = this.calculateChartDimensions(dataLength);
        
        if (dimensions.needsScroll) {
            canvas.style.height = `${dimensions.totalHeight}px`;
        }
    
        const chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: colors,
                    borderWidth: 0,
                    borderRadius: 4,
                    barPercentage: dimensions.barPercentage,
                    categoryPercentage: dimensions.categoryPercentage
                }]
            },
            options: {
                ...options,
                maintainAspectRatio: false,
                responsive: true,
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
            const chartData = data[type];
            if (!chartData || !chartData.labels || !chartData.values) {
                console.warn(`Dados inválidos para o gráfico ${type}`);
                return;
            }

            const activeFilters = window.filterManager?.getActiveFilters() || {};
            const dataLength = chartData.labels.length;
            const dimensions = this.calculateChartDimensions(dataLength);
            
            chart.data.labels = chartData.labels;
            chart.data.datasets[0].data = chartData.values;
            
            chart.data.datasets[0].backgroundColor = chartData.labels.map((label, index) => {
                const baseColor = type === 'status' ? 
                    this.colorPalette.getStatusColor(label) :
                    this.colorPalette.getChartColors(dataLength)[index];
                    
                return activeFilters[type]?.includes(label) ?
                    this.colorPalette.adjustOpacity(baseColor, 0.8) :
                    baseColor;
            });

            // Atualiza as proporções das barras
            chart.data.datasets[0].barPercentage = dimensions.barPercentage;
            chart.data.datasets[0].categoryPercentage = dimensions.categoryPercentage;
            
            const canvas = chart.canvas;
            if (dimensions.needsScroll) {
                canvas.style.height = `${dimensions.totalHeight}px`;
            } else {
                canvas.style.height = '300px';
            }
            
            chart.update('none');
        });
    }

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                const dataLength = chart.data.labels.length;
                const dimensions = this.calculateChartDimensions(dataLength);
                
                if (dimensions.needsScroll) {
                    chart.canvas.style.height = `${dimensions.totalHeight}px`;
                }
                
                chart.resize();
            }
        });
    }
}
