// Utilitários para o Timeline Chart
const TimelineUtils = {
    formatDate(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(parseInt(timestamp));
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },

    processData(data) {
        if (!Array.isArray(data)) {
            console.error('Dados inválidos para o gráfico de timeline');
            return { labels: [], values: [] };
        }

        // Agrupa atendimentos por data
        const groupedByDate = data.reduce((acc, item) => {
            const date = new Date(parseInt(item.data_hora));
            const dateKey = date.setHours(0,0,0,0);
            acc[dateKey] = (acc[dateKey] || 0) + 1;
            return acc;
        }, {});

        // Ordena as datas
        const sortedDates = Object.keys(groupedByDate).sort();

        return {
            labels: sortedDates,
            values: sortedDates.map(date => groupedByDate[date])
        };
    },

    getGradientColor(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(78,115,223,0.3)');
        gradient.addColorStop(1, 'rgba(78,115,223,0)');
        return gradient;
    }
};

// Configurações do Timeline Chart
const TimelineConfig = {
    getChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 13 },
                    bodyFont: { size: 12 },
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        title: (context) => TimelineUtils.formatDate(context[0].label),
                        label: (context) => `Total de atendimentos: ${context.raw}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        maxTicksLimit: 10,
                        callback: (value, index) => TimelineUtils.formatDate(this.chart?.data.labels[value])
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { precision: 0 }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        };
    }
};

// Classe principal do Timeline Chart
class TimelineChart {
    constructor() {
        this.chart = null;
        this.initialize();
    }

    initialize() {
        const canvas = document.getElementById('timelineChart');
        if (!canvas) {
            console.error('Elemento timelineChart não encontrado');
            return;
        }

        const ctx = canvas.getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    borderColor: '#4e73df',
                    backgroundColor: TimelineUtils.getGradientColor(ctx),
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: TimelineConfig.getChartOptions()
        });
    }

    update(data) {
        if (!this.chart) {
            console.error('Timeline Chart não inicializado');
            return;
        }

        const processedData = TimelineUtils.processData(data);

        this.chart.data.labels = processedData.labels;
        this.chart.data.datasets[0].data = processedData.values;

        this.chart.update('none');
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}

// Exporta a classe para uso global
window.TimelineChart = TimelineChart;