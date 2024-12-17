class ColorPaletteManager {
    constructor() {
        this.baseColors = {
            primary: '#4e73df',
            success: '#1cc88a',
            info: '#36b9cc',
            warning: '#f6c23e',
            danger: '#e74a3b',
            secondary: '#858796'
        };

        this.chartColors = [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(255, 99, 71, 0.6)',
            'rgba(46, 139, 87, 0.6)',
            'rgba(30, 144, 255, 0.6)',
            'rgba(255, 69, 0, 0.6)',
            'rgba(50, 205, 50, 0.6)',
            'rgba(138, 43, 226, 0.6)',
            'rgba(255, 20, 147, 0.6)',
            'rgba(0, 255, 255, 0.6)',
            'rgba(255, 215, 0, 0.6)',
            'rgba(255, 105, 180, 0.6)',
            'rgba(0, 128, 0, 0.6)',
            'rgba(100, 149, 237, 0.6)',
            'rgba(255, 140, 0, 0.6)'
        ];

        this.statusColors = {
            'Concluído': this.baseColors.success,
            'Pendente': this.baseColors.warning,
            'Cancelado': this.baseColors.danger,
            'Em Andamento': this.baseColors.info
        };
    }

    getChartColors(count, opacity = 0.6) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const baseColor = this.chartColors[i % this.chartColors.length];
            const color = this.adjustOpacity(baseColor, opacity);
            colors.push(color);
        }
        return colors;
    }

    getStatusColors() {
        return Object.values(this.statusColors);
    }

    adjustOpacity(color, opacity) { // Tornei a função pública
        return color.replace(/[\d.]+\)$/g, `${opacity})`);
    }

    generateGradient(ctx, color) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, this.adjustOpacity(color, 0.6));
        gradient.addColorStop(1, this.adjustOpacity(color, 0.1));
        return gradient;
    }
}