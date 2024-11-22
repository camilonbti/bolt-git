class ChartManager {
    constructor() {
        console.info('Inicializando ChartManager');
        this.charts = {};
        this.colorPalette = new ColorPaletteManager();
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

    initCharts(data) {
        console.debug('Inicializando gráficos com dados:', data);
        
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

        // Lista de todos os tipos de gráficos
        const chartTypes = [
            'status',
            'tipo',
            'funcionario',
            'cliente',
            'sistema',
            'canal',
            'relato',
            'solicitacao'
        ];

        // Destrói todos os gráficos existentes
        this.destroyAllCharts();

        // Cria todos os gráficos como barras horizontais
        chartTypes.forEach(type => {
            this.createChart(type, 'bar', commonOptions, data[type] || { labels: [], values: [] });
        });
    }

    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
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

    createChart(type, chartType, baseOptions, data) {
        const elementId = `${type}Chart`;
        const canvas = document.getElementById(elementId);
        
        if (!canvas) {
            console.error(`Elemento ${elementId} não encontrado`);
            return;
        }

        // Destrói o gráfico existente se houver
        if (this.charts[type]) {
            this.charts[type].destroy();
        }

        const ctx = canvas.getContext('2d');
        
        // Ordena os dados do maior para o menor
        const sortedData = this.sortChartData(data);
        const dataLength = sortedData.labels.length;
        
        const colors = this.colorPalette.getChartColors(dataLength);
        const dimensions = this.calculateChartDimensions(dataLength);

        // Configura o container para scroll se necessário
        const container = canvas.closest('.chart-container');
        if (container) {
            if (dimensions.needsScroll) {
                container.style.height = `${dimensions.height}px`;
                container.classList.add('scrollable');
            } else {
                container.style.height = '300px';
                container.classList.remove('scrollable');
            }
        }

        const options = {
            ...baseOptions,
            datasets: {
                bar: {
                    barPercentage: dimensions.barPercentage,
                    categoryPercentage: dimensions.categoryPercentage,
                    borderRadius: 4,
                    borderWidth: 0
                }
            }
        };

        const chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: sortedData.labels,
                datasets: [{
                    data: sortedData.values,
                    backgroundColor: colors,
                    hoverBackgroundColor: colors.map(color => 
                        this.colorPalette.adjustOpacity(color, 0.8)
                    )
                }]
            },
            options: {
                ...options,
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

    sortChartData(data) {
        if (!data || !data.labels || !data.values) {
            return { labels: [], values: [] };
        }

        const pairs = data.labels.map((label, index) => ({
            label,
            value: data.values[index]
        }));

        pairs.sort((a, b) => b.value - a.value);

        return {
            labels: pairs.map(pair => pair.label),
            values: pairs.map(pair => pair.value)
        };
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

            const sortedData = this.sortChartData(chartData);
            const dataLength = sortedData.labels.length;
            const dimensions = this.calculateChartDimensions(dataLength);
            
            chart.data.labels = sortedData.labels;
            chart.data.datasets[0].data = sortedData.values;
            
            const colors = this.colorPalette.getChartColors(dataLength);
            chart.data.datasets[0].backgroundColor = colors;
            chart.data.datasets[0].hoverBackgroundColor = colors.map(color => 
                this.colorPalette.adjustOpacity(color, 0.8)
            );

            chart.data.datasets[0].barPercentage = dimensions.barPercentage;
            chart.data.datasets[0].categoryPercentage = dimensions.categoryPercentage;

            const container = chart.canvas.closest('.chart-container');
            if (container) {
                if (dimensions.needsScroll) {
                    container.style.height = `${dimensions.height}px`;
                    container.classList.add('scrollable');
                } else {
                    container.style.height = '300px';
                    container.classList.remove('scrollable');
                }
            }

            chart.update('none');
        });
    }

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                const dataLength = chart.data.labels.length;
                const dimensions = this.calculateChartDimensions(dataLength);
                
                const container = chart.canvas.closest('.chart-container');
                if (container) {
                    if (dimensions.needsScroll) {
                        container.style.height = `${dimensions.height}px`;
                        container.classList.add('scrollable');
                    } else {
                        container.style.height = '300px';
                        container.classList.remove('scrollable');
                    }
                }
                
                chart.resize();
            }
        });
    }
}
