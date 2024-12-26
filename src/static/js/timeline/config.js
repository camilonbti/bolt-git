// Configurações do gráfico de timeline
const TimelineConfig = {
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
                        title: (context) => window.TimelineUtils.formatDate(context[0].label),
                        label: (context) => `Total de atendimentos: ${context.raw}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        maxTicksLimit: 10,
                        callback: (value, index, ticks) => 
                            window.TimelineUtils.formatDate(ticks.chart.data_atendimento.labels[index])                        
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

// Exporta para uso global
window.TimelineConfig = TimelineConfig;