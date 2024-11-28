class ChartDimensionsManager {
    constructor() {
        this.config = {
            baseHeight: 300,          // Altura base do container
            optimalBars: 9,           // Número ótimo de barras
            barSpacing: {
                optimal: 0.8,         // Espaçamento ótimo entre barras (80%)
                dense: 0.95,          // Espaçamento denso para muitas barras (95%)
            },
            minBarThickness: 20,      // Espessura mínima da barra
            maxBarThickness: 40,      // Espessura máxima da barra
            padding: {
                top: 20,
                bottom: 20
            }
        };
    }

    calculateBarThickness(dataLength) {
        const availableHeight = this.config.baseHeight - 
                              this.config.padding.top - 
                              this.config.padding.bottom;
        
        if (dataLength <= this.config.optimalBars) {
            // Para poucas barras, usa espessura ótima
            return Math.min(
                Math.max(
                    availableHeight / dataLength * this.config.barSpacing.optimal,
                    this.config.minBarThickness
                ),
                this.config.maxBarThickness
            );
        }
        
        // Para muitas barras, usa espessura fixa menor
        return this.config.minBarThickness;
    }

    getChartConfig(dataLength, chartType) {
        if (chartType !== 'bar') {
            return {
                maintainAspectRatio: false,
                responsive: true,
                height: this.config.baseHeight
            };
        }

        const barThickness = this.calculateBarThickness(dataLength);
        const spacing = dataLength <= this.config.optimalBars ? 
                       this.config.barSpacing.optimal : 
                       this.config.barSpacing.dense;

        return {
            maintainAspectRatio: false,
            responsive: true,
            height: this.config.baseHeight,
            layout: {
                padding: {
                    top: this.config.padding.top,
                    bottom: this.config.padding.bottom
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    afterFit: (scale) => {
                        // Garante espaço adequado para labels
                        scale.width = 120;
                    }
                }
            },
            datasets: {
                bar: {
                    barThickness: barThickness,
                    categoryPercentage: spacing,
                    barPercentage: spacing,
                    minBarLength: 5
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            animation: {
                duration: 300,
                easing: 'easeOutQuad'
            }
        };
    }

    updateChartDimensions(chart, dataLength) {
        if (!chart?.canvas) return;

        const container = chart.canvas.parentElement;
        if (!container) return;

        if (chart.config.type === 'bar') {
            const barThickness = this.calculateBarThickness(dataLength);
            const spacing = dataLength <= this.config.optimalBars ? 
                          this.config.barSpacing.optimal : 
                          this.config.barSpacing.dense;

            // Atualiza configurações das barras
            chart.options.datasets.bar.barThickness = barThickness;
            chart.options.datasets.bar.categoryPercentage = spacing;
            chart.options.datasets.bar.barPercentage = spacing;
        }

        // Força recálculo do layout
        requestAnimationFrame(() => {
            chart.resize();
            chart.update('none');
        });
    }
}

// Exporta instância única
window.chartDimensionsManager = new ChartDimensionsManager();
