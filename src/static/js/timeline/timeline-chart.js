class TimelineChart {
    constructor() {
        console.info('Inicializando TimelineChart');
        this.charts = {};
        this.colorPalette = new ColorPaletteManager();
        this.initialize();
        this.setupEventListeners();
    }

    initialize() {
        // Configurações base para ambos os gráficos
        const baseConfig = {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    borderColor: '#4e73df',
                    backgroundColor: this.createGradient('timelineChart'),
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#4e73df',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#4e73df'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { size: 13 },
                        bodyFont: { size: 12 },
                        padding: 10,
                        displayColors: false
                    }
                }
            }
        };

        // Cria gráfico diário
        this.createChart('daily', 'timelineChart', {
            ...baseConfig,
            options: {
                ...baseConfig.options,
                plugins: {
                    ...baseConfig.options.plugins,
                    tooltip: {
                        ...baseConfig.options.plugins.tooltip,
                        callbacks: {
                            title: (context) => this.formatDate(context[0]?.label),
                            label: (context) => `Total de atendimentos: ${context.raw || 0}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            maxTicksLimit: 10,
                            callback: (value, index, ticks) => this.formatDate(ticks[index].label)
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { precision: 0 }
                    }
                }
            }
        });

        // Cria gráfico horário
        this.createChart('hourly', 'hourlyTimelineChart', {
            ...baseConfig,
            data: {
                ...baseConfig.data,
                labels: Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`),
                datasets: [{
                    ...baseConfig.data.datasets[0],
                    data: Array(24).fill(0),
                    backgroundColor: this.createGradient('hourlyTimelineChart')
                }]
            },
            options: {
                ...baseConfig.options,
                plugins: {
                    ...baseConfig.options.plugins,
                    tooltip: {
                        ...baseConfig.options.plugins.tooltip,
                        callbacks: {
                            title: (context) => `Hora: ${context[0]?.label || ''}`,
                            label: (context) => `Total de atendimentos: ${context.raw || 0}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { maxTicksLimit: 24 }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { precision: 0 }
                    }
                }
            }
        });
    }

    createChart(type, elementId, config) {
        const canvas = document.getElementById(elementId);
        if (!canvas) {
            console.error(`Elemento ${elementId} não encontrado`);
            return;
        }

        this.charts[type] = new Chart(canvas, config);
    }

    createGradient(elementId) {
        const canvas = document.getElementById(elementId);
        if (!canvas) return 'rgba(78,115,223,0.3)';

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(78,115,223,0.3)');
        gradient.addColorStop(1, 'rgba(78,115,223,0)');
        return gradient;
    }

    setupEventListeners() {
        document.addEventListener('dashboardUpdate', (event) => {
            if (event.detail?.registros) {
                this.update(event.detail.registros);
            }
        });

        document.addEventListener('filterChange', (event) => {
            if (window.dashboardManager?.filteredData) {
                this.update(window.dashboardManager.filteredData);
            }
        });
    }

    update(data) {
        if (!data || !Array.isArray(data)) return;

        this.updateDailyChart(data);
        this.updateHourlyChart(data);
    }

    updateDailyChart(data) {
        const chart = this.charts.daily;
        if (!chart) return;

        const groupedByDate = data.reduce((acc, item) => {
            if (!item.data_hora) return acc;
            const date = new Date(parseInt(item.data_hora));
            const dateKey = date.setHours(0,0,0,0);
            acc[dateKey] = (acc[dateKey] || 0) + 1;
            return acc;
        }, {});

        const sortedDates = Object.keys(groupedByDate).sort();

        chart.data.labels = sortedDates;
        chart.data.datasets[0].data = sortedDates.map(date => groupedByDate[date]);
        chart.update('none');
    }

    updateHourlyChart(data) {
        const chart = this.charts.hourly;
        if (!chart) return;

        const hourlyCount = Array(24).fill(0);
        data.forEach(item => {
            if (!item.data_hora) return;
            const date = new Date(parseInt(item.data_hora));
            const hour = date.getHours();
            hourlyCount[hour]++;
        });

        chart.data.datasets[0].data = hourlyCount;
        chart.update('none');
    }

    formatDate(timestamp) {
        if (!timestamp) return '';
        try {
            const date = new Date(parseInt(timestamp));
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return '';
        }
    }

    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}