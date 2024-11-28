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
//        this.barConfigs = {
  //          1: { barHeight: 120, spacing: 0.95 },  // Uma barra única e larga
    //        2: { barHeight: 100, spacing: 0.95 },  // Duas barras bem espaçadas
      //      3: { barHeight: 60, spacing: 0.95 },   // Três barras (caso ideal visto nos logs)
        //    4: { barHeight: 50, spacing: 0.90 },   // Quatro barras
    //        5: { barHeight: 42, spacing: 0.90 },   // Cinco barras
      //      6: { barHeight: 43, spacing: 0.85 },   // Seis barras
        //    7: { barHeight: 40, spacing: 0.85 },   // Sete barras
       //     8: { barHeight: 35, spacing: 0.85 },   // Oito barras
       //     9: { barHeight: 33, spacing: 0.85 },   // Nove barras
            //10: { barHeight: 30, spacing: 0.80 },  // Dez barras
            //11: { barHeight: 28, spacing: 0.80 },  // Onze barras
        //    default: { barHeight: 25, spacing: 0.75 } // 12 ou mais barras
        //};

        // Configurações específicas para cada quantidade de barras
        this.barConfigs = {
            // 1: {
            //     barHeight: 120,
            //     spacing: 0.95,
            //     maxBarThickness: 120,
            //     minBarLength: 4,
            //     borderRadius: 8,
            //     animation: { duration: 1000, easing: 'easeInOutQuart' },
            //     layout: { autoPadding: true, padding: { top: 25, bottom: 25, left: 20, right: 20 } },
            //     hover: { mode: 'nearest', intersect: true, animationDuration: 200 },
            //     tooltip: { position: 'average', padding: 12, caretSize: 8 },
            //     labels: { align: 'center', offset: 6, font: { size: 14, weight: 'bold' } }
            // },

            // 2: {
            //     barHeight: 120,
            //     spacing: 0.95,
            //     maxBarThickness: 120,
            //     minBarLength: 4,
            //     borderRadius: 8,
            //     animation: { duration: 1000, easing: 'easeInOutQuart' },
            //     layout: { autoPadding: true, padding: { top: 25, bottom: 25, left: 20, right: 20 } },
            //     hover: { mode: 'nearest', intersect: true, animationDuration: 200 },
            //     tooltip: { position: 'average', padding: 12, caretSize: 8 },
            //     labels: { align: 'center', offset: 6, font: { size: 14, weight: 'bold' } }
            // },
            
            // 3: {
            //     barHeight: 120,
            //     spacing: 0.95,
            //     maxBarThickness: 120,
            //     minBarLength: 4,
            //     borderRadius: 8,
            //     animation: { duration: 1000, easing: 'easeInOutQuart' },
            //     layout: { autoPadding: true, padding: { top: 25, bottom: 25, left: 20, right: 20 } },
            //     hover: { mode: 'nearest', intersect: true, animationDuration: 200 },
            //     tooltip: { position: 'average', padding: 12, caretSize: 8 },
            //     labels: { align: 'center', offset: 6, font: { size: 14, weight: 'bold' } }
            // },            
            
            1: { barHeight: 120, spacing: 0.95, maxBarThickness: 120 },
            2: { barHeight: 90, spacing: 0.05, maxBarThickness: 100 },
            3: { barHeight: 60, spacing: 0.95, maxBarThickness: 80 },
            4: { barHeight: 40, spacing: 0.90, maxBarThickness: 70 },
            5: { barHeight: 35, spacing: 0.90, maxBarThickness: 60 },
            6: { barHeight: 30, spacing: 0.85, maxBarThickness: 50 },
            7: { barHeight: 40, spacing: 0.85, maxBarThickness: 45 },
            8: { barHeight: 35, spacing: 0.85, maxBarThickness: 40 },
            9: { barHeight: 33, spacing: 0.85, maxBarThickness: 38 },
            10: { barHeight: 30, spacing: 0.80, maxBarThickness: 35 },
            11: { barHeight: 28, spacing: 0.80, maxBarThickness: 32 },
            default: { 
                barHeight: 40, 
                spacing: 0.75, 
                maxBarThickness: 30,
                minBarLength: 2
            }
        };

        // Armazena configurações específicas por gráfico
        this.chartConfigs = new Map();
    }

    getBarConfig(dataLength) {
        console.debug('Getting bar config for length:', dataLength);
        return this.barConfigs[dataLength] || this.barConfigs.default;
    }

    getChartConfig(chartId, dataLength, chartType) {
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
            chartId,
            barThickness: config.barHeight,
            spacing: config.spacing,
            totalHeight,
            dataLength
        });

        const chartConfig = {
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
                    maxBarThickness: config.maxBarThickness,
                    minBarLength: config.minBarLength || 2,
                    categoryPercentage: config.spacing,
                    barPercentage: config.spacing,
                    borderRadius: 4,
                    borderSkipped: false
                }
            },
            height: totalHeight,
            barSpacing: config.spacing * 100
        };

        this.chartConfigs.set(chartId, {
            config: chartConfig,
            dataLength: dataLength
        });

        return chartConfig;
    }

    updateChartDimensions(chart, dataLength) {
        if (!chart?.canvas) return;

        const container = chart.canvas.parentElement;
        if (!container) return;

        const chartId = chart.canvas.id;

        if (chart.config.type === 'bar') {
            this.chartConfigs.delete(chartId);
            
            const dimensions = this.getChartConfig(chartId, dataLength, 'bar');
            
            console.debug('Updating chart dimensions:', {
                chartId,
                dataLength,
                containerHeight: this.config.containerHeight,
                barConfig: dimensions.datasets.bar
            });

            if (dataLength > 11) {
                container.style.height = `${dimensions.height}px`;
                container.style.overflowY = 'auto';
            } else {
                container.style.height = `${this.config.containerHeight}px`;
                container.style.overflowY = 'hidden';
            }

            // Atualiza configurações do dataset
            chart.options.datasets.bar = dimensions.datasets.bar;
            
            // Força atualização do layout
            chart.options.layout.padding = dimensions.layout.padding;
        }

        requestAnimationFrame(() => {
            chart.resize();
            chart.update('none');
        });
    }

    clearChartConfig(chartId) {
        this.chartConfigs.delete(chartId);
    }

    clearAllConfigs() {
        this.chartConfigs.clear();
    }
}

// Exporta instância única
window.chartDimensionsManager = new ChartDimensionsManager();


