const TimelineUtils = {
    formatDate(timestamp) {
        if (!timestamp) return '';
        
        try {
            // Garante que o timestamp seja um número
            const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
            if (isNaN(ts)) return '';
            
            const date = new Date(ts);
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
    },

    processData(data) {
        if (!Array.isArray(data)) {
            console.error('Dados inválidos para o gráfico de timeline');
            return { labels: [], values: [] };
        }

        try {
            // Agrupa atendimentos por data
            const groupedByDate = data.reduce((acc, item) => {
                if (!item.data_hora) return acc;
                
                // Garante que data_hora seja um número
                const timestamp = typeof item.data_hora === 'string' ? 
                    parseInt(item.data_hora) : item.data_hora;
                
                if (isNaN(timestamp)) return acc;
                
                const date = new Date(timestamp);
                if (isNaN(date.getTime())) return acc;
                
                // Usa o timestamp da data sem hora como chave
                const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                acc[dateKey] = (acc[dateKey] || 0) + 1;
                return acc;
            }, {});

            // Ordena as datas
            const sortedDates = Object.keys(groupedByDate).sort((a, b) => parseInt(a) - parseInt(b));

            return {
                labels: sortedDates,
                values: sortedDates.map(date => groupedByDate[date])
            };
        } catch (error) {
            console.error('Erro ao processar dados do timeline:', error);
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
