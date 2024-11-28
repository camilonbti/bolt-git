class ChartDimensionsManager {
    constructor() {
        // Configurações base
        this.config = {
            containerHeight: 300,
            padding: {
                top: 20,
                bottom: 20,
                left: 10,
                right: 25
            }
        };

        // Configurações específicas para cada quantidade de barras
        this.barConfigs = {
            1: { barHeight: 120, spacing: 0.95 },  // Uma barra única e larga
            2: { barHeight: 100, spacing: 0.95 },  // Duas barras bem espaçadas
            3: { barHeight: 60, spacing: 0.95 },   // Três barras (caso ideal visto nos logs)
            4: { barHeight: 50, spacing: 0.90 },   // Quatro barras
            5: { barHeight: 20, spacing: 0.90 },   // Cinco barras
            6: { barHeight: 43, spacing: 0.85 },   // Seis barras
            7: { barHeight: 40, spacing: 0.85 },   // Sete barras
            8: { barHeight: 35, spacing: 0.85 },   // Oito barras
            9: { barHeight: 33, spacing: 0.85 },   // Nove barras
            10: { barHeight: 30, spacing: 0.80 },  // Dez barras
            11: { barHeight: 28, spacing: 0.80 },  // Onze barras
            default: { barHeight: 60, spacing: 0.75 } // 12 ou mais barras
        };
    }

    getBarConfig(dataLength) {
        console.debug('Getting bar config for length:', dataLength);
        return this.barConfigs[dataLength] || this.barConfigs.default;
    }

    getChartConfig(dataLength, chartType) {
        if (chartType !== 'bar') {
            return {
                maintainAspectRatio: false,
                responsive: true
            };
        }

        const config = this.getBarConfig(dataLength);
        const totalHeight = dataLength <= 11 ? 
            this.config.containerHeight :
            (dataLength * config.barHeight) + this.config.padding.top + this.config.padding.bottom;

        console.debug('Chart config calculated:', {
            barThickness: config.barHeight,
            spacing: config.spacing,
            totalHeight,
            dataLength
        });

        return {
            maintainAspectRatio: false,
            responsive: true,
            layout: {
                padding: this.config.padding
            },
            scales: {
                x: {
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
            plugins: {
                legend: {
                    display: false
                }
            },
            datasets: {
                bar: {
                    barThickness: config.barHeight,
                    categoryPercentage: config.spacing,
                    barPercentage: config.spacing
                }
            },
            height: totalHeight
        };
    }

    updateChartDimensions(chart, dataLength) {
        if (!chart?.canvas) return;

        const container = chart.canvas.parentElement;
        if (!container) return;

        if (chart.config.type === 'bar') {
            const dimensions = this.getChartConfig(dataLength, 'bar');
            
            console.debug('Updating chart dimensions:', {
                dataLength,
                containerHeight: this.config.containerHeight,
                barConfig: dimensions.datasets.bar
            });

            if (dataLength > 11) {
                container.style.height = `${dimensions.height}px`;
            } else {
                container.style.height = `${this.config.containerHeight}px`;
            }

            chart.options.datasets.bar = dimensions.datasets.bar;
        }

        requestAnimationFrame(() => {
            chart.resize();
            chart.update('none');
        });
    }
}

// Exporta instância única
window.chartDimensionsManager = new ChartDimensionsManager();
