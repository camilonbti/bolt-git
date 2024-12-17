class ChartDimensionsManager {
    constructor() {
        this.config = {
            containerHeight: 300,
            padding: {
                top: 20,
                bottom: 20,
                left: 10,
                right: 25
            }
        };

        this.barConfigs = {
            1: { barHeight: 120, spacing: 0.95, maxBarThickness: 120 },
            2: { barHeight: 90, spacing: 0.05, maxBarThickness: 100 },
            3: { barHeight: 60, spacing: 0.95, maxBarThickness: 80 },
            4: { barHeight: 40, spacing: 0.90, maxBarThickness: 70 },
            5: { barHeight: 35, spacing: 0.90, maxBarThickness: 60 },
            6: { barHeight: 30, spacing: 0.85, maxBarThickness: 50 },
            7: { barHeight: 29, spacing: 0.85, maxBarThickness: 40 },
            default: { 
                barHeight: 40, 
                spacing: 0.75, 
                maxBarThickness: 30,
                minBarLength: 2
            }
        };

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
        const totalHeight = dataLength <= 7 ? 
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
                },
                tooltip: {
                    enabled: true,
                    position: 'nearest',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                            return `Total: ${value} (${percentage}%)`;
                        }
                    }
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

            if (dataLength > 7) {
                container.style.height = `${dimensions.height}px`;
                container.style.overflowY = 'auto';
            } else {
                container.style.height = `${this.config.containerHeight}px`;
                container.style.overflowY = 'hidden';
            }

            chart.options.datasets.bar = dimensions.datasets.bar;
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

    getCommonChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    color: '#444',
                    anchor: 'end',
                    align: 'end',
                    offset: 4,
                    font: {
                        size: 11,
                        weight: '500'
                    },
                    formatter: (value, context) => {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return `${value} (${percentage}%)`;
                    }
                },
                tooltip: {
                    enabled: true,
                    position: 'nearest',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: (context) => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                            return `Total: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        callback: function(value) {
                            return value;
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        };
    }
}

window.chartDimensionsManager = new ChartDimensionsManager();
