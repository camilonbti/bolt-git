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
                        // Corrigindo o callback do título
                        title: function(tooltipItems) {
                            if (!tooltipItems || !tooltipItems[0]) return '';
                            const timestamp = tooltipItems[0].label;
                            return window.TimelineUtils.formatDate(timestamp);
                        },
                        // Corrigindo o callback do label
                        label: function(context) {
                            return `Total de atendimentos: ${context.raw || 0}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        maxTicksLimit: 10,
                        callback: function(value, index, ticks) {
                            if (!ticks || !ticks.length) return '';
                            return window.TimelineUtils.formatDate(this.getLabelForValue(value));
                        }
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

window.TimelineConfig = TimelineConfig;
