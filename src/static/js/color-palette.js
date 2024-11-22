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

        this.gradients = {};
    }

    getChartColors(count, opacity = 0.6) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const baseColor = this.chartColors[i % this.chartColors.length];
            colors.push(this.adjustOpacity(baseColor, opacity));
        }
        return colors;
    }

    getStatusColor(status) {
        return this.statusColors[status] || this.baseColors.secondary;
    }

    adjustOpacity(color, opacity) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color.replace(/[\d.]+\)$/g, `${opacity})`);
    }

    generateGradient(ctx, color, direction = 'vertical') {
        const key = `${color}-${direction}`;
        
        if (this.gradients[key]) {
            return this.gradients[key];
        }

        let gradient;
        if (direction === 'vertical') {
            gradient = ctx.createLinearGradient(0, 0, 0, 400);
        } else {
            gradient = ctx.createLinearGradient(0, 0, 400, 0);
        }

        gradient.addColorStop(0, this.adjustOpacity(color, 0.6));
        gradient.addColorStop(1, this.adjustOpacity(color, 0.1));
        
        this.gradients[key] = gradient;
        return gradient;
    }

    getColorWithAlpha(color, alpha) {
        if (color.startsWith('#')) {
            return this.adjustOpacity(color, alpha);
        }
        return color.replace(/[\d.]+\)$/g, `${alpha})`);
    }

    getComplementaryColor(color) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `#${(255 - r).toString(16).padStart(2, '0')}${(255 - g).toString(16).padStart(2, '0')}${(255 - b).toString(16).padStart(2, '0')}`;
        }
        return color;
    }

    getColorScheme(baseColor, count = 5) {
        const colors = [];
        const hslColor = this.rgbToHsl(this.hexToRgb(baseColor));
        
        for (let i = 0; i < count; i++) {
            const hue = (hslColor.h + (360 / count) * i) % 360;
            colors.push(this.hslToHex({
                h: hue,
                s: hslColor.s,
                l: hslColor.l
            }));
        }
        
        return colors;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHsl(rgb) {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h *= 60;
        }

        return { h, s, l };
    }

    hslToHex({ h, s, l }) {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        const r = Math.round(hue2rgb(p, q, (h + 120) / 360) * 255);
        const g = Math.round(hue2rgb(p, q, h / 360) * 255);
        const b = Math.round(hue2rgb(p, q, (h - 120) / 360) * 255);

        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
}
