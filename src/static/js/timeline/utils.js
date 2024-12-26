const TimelineUtils = {
    formatDate(dateStr) {
        if (!dateStr) return '';
        
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return '';
        }
    },

    processData(data) {
        if (!Array.isArray(data)) return { labels: [], values: [] };

        try {
            const groupedByDate = data.reduce((acc, item) => {
                if (!item.data_atendimento) return acc;
                const date = new Date(parseInt(item.data_hora));
                const dateKey = date.setHours(0,0,0,0);
                acc[dateKey] = (acc[dateKey] || 0) + 1;
                return acc;
            }, {});

            const sortedDates = Object.keys(groupedByDate).sort();
            return {
                labels: sortedDates,
                values: sortedDates.map(date => groupedByDate[date])
            };
        } catch (error) {
            console.error('Erro ao processar dados:', error);
            return { labels: [], values: [] };
        }
    },

    createGradient(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(78,115,223,0.3)');
        gradient.addColorStop(1, 'rgba(78,115,223,0)');
        return gradient;
    }
};

// Exporta para uso global
window.TimelineUtils = TimelineUtils;