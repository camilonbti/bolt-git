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
            requestAnimationFrame(() => this.resizeCharts());
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
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
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
                        font: { size: 11 },
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

        // Status como doughnut
        this.createChart('status', 'doughnut', {
            ...commonOptions,
            indexAxis: undefined,
            cutout: '60%',
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            }
        });

        // Demais gráficos como barras horizontais
        const barCharts = [
            'tipo',
            'funcionario',
            'cliente',
            'sistema',
            'canal',
            'relato',
            'solicitacao'
        ];

        barCharts.forEach(type => {
            this.createChart(type, 'bar', {
                ...commonOptions,
                hover: {
                    mode: 'nearest',
                    intersect: false,
                    animationDuration: 150
                },
                datasets: {
                    bar: {
                        borderWidth: 0,
                        borderRadius: 4,
                        barPercentage: 0.8,
                        categoryPercentage: 0.9
                    }
                }
            });
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

        if (dataLength <= maxBarsWithoutScroll) {
            const optimalBarHeight = Math.min(maxBarHeight, availableHeight / dataLength);
            const barPercentage = Math.max(0.6, Math.min(0.8, 1 - (dataLength / maxBarsWithoutScroll) * 0.2));
            
            return {
                height: containerHeight,
                barHeight: optimalBarHeight,
                barPercentage: barPercentage,
                categoryPercentage: 0.9,
                needsScroll: false
            };
        }

        return {
            height: dataLength * minBarHeight + paddingTop + paddingBottom,
            barHeight: minBarHeight,
            barPercentage: 0.6,
            categoryPercentage: 0.9,
            needsScroll: true
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
            canvas.parentElement.style.height = `${dimensions.height}px`;
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
                    categoryPercentage: dimensions.categoryPercentage,
                    hoverBackgroundColor: colors.map(color => 
                        this.colorPalette.adjustOpacity(color, 0.8)
                    )
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

            // Usa filterManager através do dashboardManager para manter consistência
            const activeFilters = window.dashboardManager?.filterManager?.getActiveFilters() || {};
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

            chart.data.datasets[0].hoverBackgroundColor = chart.data.datasets[0].backgroundColor.map(color => 
                this.colorPalette.adjustOpacity(color, 0.8)
            );

            chart.data.datasets[0].barPercentage = dimensions.barPercentage;
            chart.data.datasets[0].categoryPercentage = dimensions.categoryPercentage;
            
            if (dimensions.needsScroll) {
                chart.canvas.parentElement.style.height = `${dimensions.height}px`;
            } else {
                chart.canvas.parentElement.style.height = '300px';
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
                    chart.canvas.parentElement.style.height = `${dimensions.height}px`;
                }
                
                chart.resize();
            }
        });
    }
}