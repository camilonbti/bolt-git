// src/static/js/timeline/hourly-chart.js
class HourlyTimelineChart {
    constructor() {
        console.info('Inicializando HourlyTimelineChart');
        this.chart = null;
        this.initialize();
    }

    initialize() {
        const canvas = document.getElementById('hourlyTimelineChart');
        if (!canvas) {
            console.error('Elemento hourlyTimelineChart não encontrado');
            return;
        }

        const ctx = canvas.getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`),
                datasets: [{
                    data: [],
                    borderColor: '#36b9cc',
                    backgroundColor: this.createGradient(ctx),
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#36b9cc',
                    pointBorderColor: '#ffffff',
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#36b9cc'
                }]
            },
            options: this.getChartOptions()
        });
    }

    getChartOptions() {
        return {
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
                    displayColors: false,
                    callbacks: {
                        title: (context) => `${context[0].label}`,
                        label: (context) => `Total de atendimentos: ${context.raw || 0}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    title: {
                        display: true,
                        text: 'Hora do dia'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { precision: 0 },
                    title: {
                        display: true,
                        text: 'Quantidade de atendimentos'
                    }
                }
            }
        };
    }

    createGradient(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(54, 185, 204, 0.3)');
        gradient.addColorStop(1, 'rgba(54, 185, 204, 0)');
        return gradient;
    }

    update(data) {
        if (!this.chart || !Array.isArray(data)) {
            return;
        }

        try {
            // Agrupa atendimentos por hora
            const hourlyData = Array(24).fill(0);
            
            data.forEach(registro => {
                if (registro.data_hora) {
                    // Converte o timestamp para data
                    let date;
                    if (typeof registro.data_hora === 'string') {
                        // Se for string no formato brasileiro, converte
                        const [datePart, timePart] = registro.data_hora.split(' ');
                        const [day, month, year] = datePart.split('/');
                        const [hour] = timePart.split(':');
                        date = new Date(year, month - 1, day);
                        hourlyData[parseInt(hour)]++;
                    } else {
                        // Se for timestamp
                        date = new Date(parseInt(registro.data_hora));
                        if (!isNaN(date.getTime())) {
                            const hour = date.getHours();
                            hourlyData[hour]++;
                        }
                    }
                }
            });

            // Debug
            console.log('Dados por hora:', hourlyData);

            this.chart.data.datasets[0].data = hourlyData;
            this.chart.update('none');
        } catch (error) {
            console.error('Erro ao atualizar gráfico de horas:', error);
        }
    }
}  

window.HourlyTimelineChart = HourlyTimelineChart;
