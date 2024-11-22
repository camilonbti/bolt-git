class DateUtils {
    static TIMEZONE = 'America/Sao_Paulo';
    static DATE_FORMAT = 'YYYY-MM-DD';
    static DATETIME_FORMAT = 'DD/MM/YYYY HH:mm:ss';
    static BRASIL_OFFSET = -180; // GMT-3 em minutos

    static formatDateTime(date) {
        if (!date) return null;

        try {
            const timestamp = this.parseTimestamp(date);
            return new Date(timestamp).toLocaleString('pt-BR', {
                timeZone: this.TIMEZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return null;
        }
    }

    static formatDateOnly(date) {
        if (!date) return null;

        try {
            const timestamp = this.parseTimestamp(date);
            return new Date(timestamp).toLocaleDateString('pt-BR', {
                timeZone: this.TIMEZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return null;
        }
    }

    static parseTimestamp(value) {
        try {
            if (!value) return null;

            // Se já for número, ajusta para milissegundos se necessário
            if (typeof value === 'number') {
                return String(value).length <= 10 ? value * 1000 : value;
            }

            // Se for string de data BR, converte
            if (typeof value === 'string' && value.includes('/')) {
                const [date, time] = value.split(' ');
                const [day, month, year] = date.split('/');
                const [hour, minute, second] = (time || '00:00:00').split(':');
                
                const dateObj = new Date(year, month - 1, day, hour, minute, second);
                return dateObj.getTime();
            }

            // Se for string ISO ou timestamp string
            const timestamp = Date.parse(value);
            if (!isNaN(timestamp)) {
                return timestamp;
            }

            throw new Error('Formato de data inválido');

        } catch (error) {
            console.error('Erro ao converter timestamp:', error);
            return new Date().getTime();
        }
    }

    static getDateWithMinTime(dateStr) {
        try {
            // Cria data com horário inicial do dia (00:00:00)
            const date = new Date(dateStr + 'T00:00:00.000');
            const brasiliaTime = new Date(date.getTime() + (date.getTimezoneOffset() + this.BRASIL_OFFSET) * 60000);
            return brasiliaTime.toISOString();
        } catch (error) {
            console.error('Erro ao definir horário mínimo:', error);
            return new Date().toISOString();
        }
    }

    static getDateWithMaxTime(dateStr) {
        try {
            // Cria data com horário final do dia (23:59:59.999)
            const date = new Date(dateStr + 'T23:59:59.999');
            const brasiliaTime = new Date(date.getTime() + (date.getTimezoneOffset() + this.BRASIL_OFFSET) * 60000);
            return brasiliaTime.toISOString();
        } catch (error) {
            console.error('Erro ao definir horário máximo:', error);
            return new Date().toISOString();
        }
    }

    static formatDateForInput(date) {
        try {
            if (!date) return '';
            
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                throw new Error('Data inválida');
            }
            
            // Ajusta para timezone local
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Erro ao formatar data para input:', error);
            return '';
        }
    }

    static formatDateRange(start, end) {
        try {
            if (!start || !end) {
                throw new Error('Datas inválidas para range');
            }

            const startDate = this.getDateWithMinTime(start);
            const endDate = this.getDateWithMaxTime(end);

            if (startDate > endDate) {
                throw new Error('Data inicial maior que data final');
            }

            return {
                start: startDate.getTime(),
                end: endDate.getTime()
            };
        } catch (error) {
            console.error('Erro ao formatar range de datas:', error);
            return null;
        }
    }

    static initializeDateFields() {
        try {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            return {
                start: this.formatDateForInput(firstDayOfMonth),
                end: this.formatDateForInput(now)
            };
        } catch (error) {
            console.error('Erro ao inicializar campos de data:', error);
            const today = new Date();
            return {
                start: this.formatDateForInput(today),
                end: this.formatDateForInput(today)
            };
        }
    }

    static parseTimestamp(value) {
        try {
            if (!value) return null;

            // Se já for número, ajusta para milissegundos se necessário
            if (typeof value === 'number') {
                return String(value).length <= 10 ? value * 1000 : value;
            }

            // Se for string de data BR, converte
            if (typeof value === 'string') {
                if (value.includes('/')) {
                    const [date, time] = value.split(' ');
                    const [day, month, year] = date.split('/');
                    const [hour, minute, second] = (time || '00:00:00').split(':');
                    
                    const dateObj = new Date(year, month - 1, day, hour, minute, second);
                    return dateObj.getTime();
                }

                // Tenta converter diretamente se for ISO ou outro formato válido
                const timestamp = Date.parse(value);
                if (!isNaN(timestamp)) {
                    return timestamp;
                }
            }

            throw new Error('Formato de data inválido');

        } catch (error) {
            console.error('Erro ao converter timestamp:', error);
            return new Date().getTime();
        }
    }

    static formatDisplayDate(timestamp) {
        try {
            if (!timestamp) return 'Data indisponível';
            
            const date = new Date(this.parseTimestamp(timestamp));
            if (isNaN(date.getTime())) {
                throw new Error('Data inválida');
            }

            return date.toLocaleDateString('pt-BR', {
                timeZone: this.TIMEZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            console.error('Erro ao formatar data para exibição:', error);
            return 'Data indisponível';
        }
    }

    static formatDisplayDateTime(timestamp) {
        try {
            if (!timestamp) return 'Data indisponível';
            
            const date = new Date(this.parseTimestamp(timestamp));
            if (isNaN(date.getTime())) {
                throw new Error('Data inválida');
            }

            return date.toLocaleString('pt-BR', {
                timeZone: this.TIMEZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        } catch (error) {
            console.error('Erro ao formatar data e hora para exibição:', error);
            return 'Data indisponível';
        }
    }
}
