class TimelineUtils {
    static processData(data) {
        const dailyData = {};
        const hourlyData = new Array(24).fill(0);

        data.forEach(item => {
            // Usa data_atendimento e hora_atendimento
            if (item.data_atendimento) {
                const dateKey = item.data_atendimento;
                dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
            }
            
            if (item.hora_atendimento) {
                const hour = parseInt(item.hora_atendimento.split(':')[0]);
                if (!isNaN(hour) && hour >= 0 && hour < 24) {
                    hourlyData[hour]++;
                }
            }
        });

        const sortedDates = Object.keys(dailyData).sort();

        return {
            dailyData: {
                labels: sortedDates,
                values: sortedDates.map(date => ({
                    x: date,
                    y: dailyData[date]
                }))
            },
            hourlyData: {
                labels: Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`),
                values: hourlyData
            }
        };
    }
}