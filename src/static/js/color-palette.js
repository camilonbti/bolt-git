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

        // Cores base com opacidade 0.6
        this.baseChartColors = [
            'rgba(255, 99, 132, 0.6)',   // Red
            'rgba(54, 162, 235, 0.6)',   // Blue
            'rgba(255, 206, 86, 0.6)',   // Yellow
            'rgba(75, 192, 192, 0.6)',   // Green
            'rgba(153, 102, 255, 0.6)',  // Purple
            'rgba(255, 159, 64, 0.6)',   // Orange
            'rgba(199, 199, 199, 0.6)',  // Grey
            'rgba(255, 99, 71, 0.6)',    // Tomato
            'rgba(46, 139, 87, 0.6)',    // SeaGreen
            'rgba(30, 144, 255, 0.6)',   // DodgerBlue
            'rgba(255, 69, 0, 0.6)',     // OrangeRed
            'rgba(50, 205, 50, 0.6)',    // LimeGreen
            'rgba(138, 43, 226, 0.6)',   // BlueViolet
            'rgba(255, 20, 147, 0.6)',   // DeepPink
            'rgba(0, 255, 255, 0.6)',    // Cyan
            'rgba(255, 215, 0, 0.6)',    // Gold
            'rgba(255, 105, 180, 0.6)',  // HotPink
            'rgba(0, 128, 0, 0.6)',      // Green
            'rgba(100, 149, 237, 0.6)',  // CornflowerBlue
            'rgba(255, 140, 0, 0.6)',    // DarkOrange
            'rgba(210, 105, 30, 0.6)',   // Chocolate
            'rgba(220, 20, 60, 0.6)',    // Crimson
            'rgba(0, 191, 255, 0.6)',    // DeepSkyBlue
            'rgba(218, 112, 214, 0.6)',  // Orchid
            'rgba(65, 105, 225, 0.6)',   // RoyalBlue
            'rgba(123, 104, 238, 0.6)',  // MediumSlateBlue
            'rgba(34, 139, 34, 0.6)',    // ForestGreen
            'rgba(255, 0, 255, 0.6)',    // Magenta
            'rgba(255, 182, 193, 0.6)',  // LightPink
            'rgba(173, 216, 230, 0.6)',  // LightBlue
            'rgba(128, 0, 128, 0.6)',    // Purple
            'rgba(75, 0, 130, 0.6)'      // Indigo
        ];

        // Cores claras com opacidade 0.4
        this.lightChartColors = [
            'rgba(255, 99, 132, 0.4)',   // LightRed
            'rgba(54, 162, 235, 0.4)',   // LightBlue
            'rgba(255, 206, 86, 0.4)',   // LightYellow
            'rgba(75, 192, 192, 0.4)',   // LightGreen
            'rgba(153, 102, 255, 0.4)',  // LightPurple
            'rgba(255, 159, 64, 0.4)',   // LightOrange
            'rgba(199, 199, 199, 0.4)',  // LightGrey
            'rgba(255, 99, 71, 0.4)',    // LightTomato
            'rgba(46, 139, 87, 0.4)',    // LightSeaGreen
            'rgba(30, 144, 255, 0.4)',   // LightDodgerBlue
            'rgba(255, 69, 0, 0.4)',     // LightOrangeRed
            'rgba(50, 205, 50, 0.4)',    // LightLimeGreen
            'rgba(138, 43, 226, 0.4)',   // LightBlueViolet
            'rgba(255, 20, 147, 0.4)',   // LightDeepPink
            'rgba(0, 255, 255, 0.4)',    // LightCyan
            'rgba(255, 215, 0, 0.4)',    // LightGold
            'rgba(255, 105, 180, 0.4)',  // LightHotPink
            'rgba(0, 128, 0, 0.4)',      // LightGreen
            'rgba(100, 149, 237, 0.4)',  // LightCornflowerBlue
            'rgba(255, 140, 0, 0.4)',    // LightDarkOrange
            'rgba(210, 105, 30, 0.4)',   // LightChocolate
            'rgba(220, 20, 60, 0.4)',    // LightCrimson
            'rgba(0, 191, 255, 0.4)',    // LightDeepSkyBlue
            'rgba(218, 112, 214, 0.4)',  // LightOrchid
            'rgba(65, 105, 225, 0.4)',   // LightRoyalBlue
            'rgba(123, 104, 238, 0.4)',  // LightMediumSlateBlue
            'rgba(34, 139, 34, 0.4)',    // LightForestGreen
            'rgba(255, 0, 255, 0.4)',    // LightMagenta
            'rgba(255, 182, 193, 0.4)',  // LightLightPink
            'rgba(173, 216, 230, 0.4)',  // LightLightBlue
            'rgba(128, 0, 128, 0.4)',    // LightPurple
            'rgba(75, 0, 130, 0.4)'      // LightIndigo
        ];

        // Cores escuras com opacidade 0.8
        this.darkChartColors = [
            'rgba(255, 99, 132, 0.8)',   // DarkRed
            'rgba(54, 162, 235, 0.8)',   // DarkBlue
            'rgba(255, 206, 86, 0.8)',   // DarkYellow
            'rgba(75, 192, 192, 0.8)',   // DarkGreen
            'rgba(153, 102, 255, 0.8)',  // DarkPurple
            'rgba(255, 159, 64, 0.8)',   // DarkOrange
            'rgba(199, 199, 199, 0.8)',  // DarkGrey
            'rgba(255, 99, 71, 0.8)',    // DarkTomato
            'rgba(46, 139, 87, 0.8)',    // DarkSeaGreen
            'rgba(30, 144, 255, 0.8)',   // DarkDodgerBlue
            'rgba(255, 69, 0, 0.8)',     // DarkOrangeRed
            'rgba(50, 205, 50, 0.8)',    // DarkLimeGreen
            'rgba(138, 43, 226, 0.8)',   // DarkBlueViolet
            'rgba(255, 20, 147, 0.8)',   // DarkDeepPink
            'rgba(0, 255, 255, 0.8)',    // DarkCyan
            'rgba(255, 215, 0, 0.8)',    // DarkGold
            'rgba(255, 105, 180, 0.8)',  // DarkHotPink
            'rgba(0, 128, 0, 0.8)',      // DarkGreen
            'rgba(100, 149, 237, 0.8)',  // DarkCornflowerBlue
            'rgba(255, 140, 0, 0.8)',    // DarkDarkOrange
            'rgba(210, 105, 30, 0.8)',   // DarkChocolate
            'rgba(220, 20, 60, 0.8)',    // DarkCrimson
            'rgba(0, 191, 255, 0.8)',    // DarkDeepSkyBlue
            'rgba(218, 112, 214, 0.8)',  // DarkOrchid
            'rgba(65, 105, 225, 0.8)',   // DarkRoyalBlue
            'rgba(123, 104, 238, 0.8)',  // DarkMediumSlateBlue
            'rgba(34, 139, 34, 0.8)',    // DarkForestGreen
            'rgba(255, 0, 255, 0.8)',    // DarkMagenta
            'rgba(255, 182, 193, 0.8)',  // DarkLightPink
            'rgba(173, 216, 230, 0.8)',  // DarkLightBlue
            'rgba(128, 0, 128, 0.8)',    // DarkPurple
            'rgba(75, 0, 130, 0.8)'      // DarkIndigo
        ];

        // Combina todas as cores em um único array
        this.chartColors = [
            ...this.baseChartColors,
            ...this.lightChartColors,
            ...this.darkChartColors
        ];

        this.statusColors = {
            'Concluído': 'rgba(28, 200, 138, 0.6)',    // Success green
            'Pendente': 'rgba(246, 194, 62, 0.6)',     // Warning yellow
            'Cancelado': 'rgba(231, 74, 59, 0.6)',     // Danger red
            'Em Andamento': 'rgba(78, 115, 223, 0.6)'  // Primary blue
        };
    }

    getChartColors(count, opacity = 0.6) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const baseColor = this.chartColors[i % this.chartColors.length];
            colors.push(this.adjustOpacity(baseColor, opacity));
        }
        return colors;
    }

    getStatusColors() {
        return Object.values(this.statusColors);
    }

    getStatusColor(status) {
        return this.statusColors[status] || this.chartColors[0];
    }

    adjustOpacity(color, opacity) {
        return color.replace(/[\d.]+\)$/g, `${opacity})`);
    }

    generateGradient(ctx, color) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, this.adjustOpacity(color, 0.6));
        gradient.addColorStop(1, this.adjustOpacity(color, 0.1));
        return gradient;
    }

    // Métodos adicionais para obter cores específicas
    getLightColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(this.lightChartColors[i % this.lightChartColors.length]);
        }
        return colors;
    }

    getDarkColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(this.darkChartColors[i % this.darkChartColors.length]);
        }
        return colors;
    }

    getBaseColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(this.baseChartColors[i % this.baseChartColors.length]);
        }
        return colors;
    }
}