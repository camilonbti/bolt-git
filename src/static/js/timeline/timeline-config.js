class TimelineChartConfig {
    static getBaseConfig() {
        return {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    borderColor: '#4e73df',
                    backgroundColor: 'rgba(78,115,223,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#4e73df',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#4e73df',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { 
                        display: false 
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        titleFont: { 
                            size: 13, 
                            weight: 'bold',
                            family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
                        },
                        bodyFont: { 
                            size: 12,
                            family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
                        },
                        padding: {
                            x: 12,
                            y: 8
                        },
                        cornerRadius: 4,
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                if (!context[0]?.raw?.x) return '';
                                return `Data: ${TimelineChartConfig.formatDate(context[0].raw.x)}`;
                            },
                            label: (context) => {
                                return `Total: ${context.raw?.y || 0} atendimentos`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { 
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            maxTicksLimit: 8,
                            font: {
                                size: 11,
                                family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
                            },
                            color: '#666666',
                            callback: function(value, index, values) {
                                return TimelineChartConfig.formatDate(this.getLabelForValue(value));
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { 
                            color: 'rgba(0,0,0,0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            precision: 0,
                            font: {
                                size: 11,
                                family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
                            },
                            color: '#666666',
                            padding: 8
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.4,
                        borderWidth: 2,
                        fill: true
                    },
                    point: {
                        hitRadius: 8,
                        hoverBorderWidth: 2
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        right: 15,
                        bottom: 10,
                        left: 10
                    }
                }
            }
        };
    }

    static formatDate(value) {
        if (!value) return '';
        try {
            // Se for uma string de data (YYYY-MM-DD)
            if (typeof value === 'string' && value.includes('-')) {
                const [year, month, day] = value.split('-');
                return `${day}/${month}/${year}`;
            }
            
            // Se for timestamp
            const date = new Date(value);
            if (isNaN(date.getTime())) return '';
            
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return '';
        }
    }

    static getHourlyConfig() {
        const baseConfig = this.getBaseConfig();
        return {
            ...baseConfig,
            options: {
                ...baseConfig.options,
                plugins: {
                    ...baseConfig.options.plugins,
                    tooltip: {
                        ...baseConfig.options.plugins.tooltip,
                        callbacks: {
                            title: (context) => `Hora: ${context[0]?.label || ''}`,
                            label: (context) => `Total: ${context.raw || 0} atendimentos`
                        }
                    }
                },
                scales: {
                    ...baseConfig.options.scales,
                    x: {
                        ...baseConfig.options.scales.x,
                        ticks: {
                            ...baseConfig.options.scales.x.ticks,
                            maxTicksLimit: 24,
                            callback: (value) => `${String(value).padStart(2, '0')}:00`
                        }
                    }
                }
            }
        };
    }
}