class DashboardDataManager {
    constructor() {
        console.info('Inicializando DashboardDataManager');
        this.data = {
            registros: [],
            kpis: {
                total_registros: 0,
                total_pendentes: 0,
                total_concluidos: 0,
                taxa_conclusao: 0
            },
            graficos: {
                status: { labels: [], values: [] },
                tipo: { labels: [], values: [] },
                funcionario: { labels: [], values: [] },
                cliente: { labels: [], values: [] },
                sistema: { labels: [], values: [] },
                canal: { labels: [], values: [] },
                relato: { labels: [], values: [] },
                solicitacao: { labels: [], values: [] }
            },
            ultima_atualizacao: new Date().getTime()
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        console.debug('Configurando event listeners');

        document.addEventListener('filterChange', (event) => {
            console.info('Evento de mudança de filtro recebido:', {
                filtros: event.detail,
                timestamp: new Date().toISOString()
            });
            this.applyFilters(event.detail);
        });
    }

    async loadInitialData() {
        try {
            const loadingState = document.getElementById('loadingState');
            const dashboardContent = document.getElementById('dashboardContent');

            if (loadingState) loadingState.classList.remove('d-none');
            if (dashboardContent) dashboardContent.classList.add('d-none');

            const response = await fetch('/api/data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (!data || !data.registros) {
                throw new Error('Dados inválidos recebidos do servidor');
            }

            // Processa timestamps
            data.registros = data.registros.map(registro => ({
                ...registro,
                data_hora: this.processTimestamp(registro.data_hora)
            }));

            this.data = data;
            console.info('Dados iniciais carregados:', {
                registros: data.registros.length,
                timestamp: new Date().toISOString()
            });

            // Calcula KPIs iniciais
            this.data.kpis = this.calculateKPIs(this.data.registros);

            document.dispatchEvent(new CustomEvent('dashboardUpdate', {
                detail: this.data
            }));

            if (loadingState) loadingState.classList.add('d-none');
            if (dashboardContent) dashboardContent.classList.remove('d-none');

            return this.data;

        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            if (loadingState) loadingState.classList.add('d-none');
            this.showError('Erro ao carregar dados iniciais');
            throw error;
        }
    }

    processTimestamp(timestamp) {
        if (!timestamp) return null;

        try {
            // Se já for número, retorna
            if (typeof timestamp === 'number') {
                return timestamp;
            }

            // Se for string de data BR, converte
            if (typeof timestamp === 'string' && timestamp.includes('/')) {
                const [date, time] = timestamp.split(' ');
                const [day, month, year] = date.split('/');
                const [hour, minute, second] = (time || '00:00:00').split(':');

                const dateObj = new Date(year, month - 1, day, hour, minute, second);
                return dateObj.getTime();
            }

            // Tenta converter diretamente
            const dateObj = new Date(timestamp);
            if (!isNaN(dateObj.getTime())) {
                return dateObj.getTime();
            }

            throw new Error('Invalid timestamp format');

        } catch (error) {
            console.error('Erro ao processar timestamp:', error);
            return null;
        }
    }

    calculateKPIs(registros) {
        if (!registros || registros.length === 0) {
            return {
                total_registros: 0,
                total_pendentes: 0,
                total_concluidos: 0,
                taxa_conclusao: 0
            };
        }

        const total = registros.length;
        const concluidos = registros.filter(r => r.status_atendimento === 'Concluído').length;
        const pendentes = registros.filter(r => r.status_atendimento === 'Pendente').length;
        const taxa = (concluidos / total) * 100;

        return {
            total_registros: total,
            total_pendentes: pendentes,
            total_concluidos: concluidos,
            taxa_conclusao: parseFloat(taxa.toFixed(1))
        };
    }

    applyFilters(filters) {
        if (!filters || Object.keys(filters).length === 0) {
            console.debug('Nenhum filtro para aplicar');
            return;
        }

        try {
            console.debug('Aplicando filtros:', filters);

            const filteredRegistros = this.filterData(this.data.registros, filters);
            console.info('Registros filtrados:', filteredRegistros.length);

            const updatedData = {
                registros: filteredRegistros,
                kpis: this.calculateKPIs(filteredRegistros),
                graficos: this.calculateCharts(filteredRegistros),
                ultima_atualizacao: new Date().getTime()
            };

            document.dispatchEvent(new CustomEvent('dashboardUpdate', {
                detail: updatedData
            }));

        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            this.showError('Erro ao aplicar filtros aos dados');
        }
    }

    filterData(registros, filters) {
        return registros.filter(registro => {
            return Object.entries(filters).every(([tipo, valores]) => {
                if (!valores || (Array.isArray(valores) && valores.length === 0)) {
                    return true;
                }

                if (tipo === 'period') {
                    return this.filterByPeriod(registro, valores);
                }

                const valor = this.getFieldValue(registro, tipo);
                return Array.isArray(valores) ? valores.includes(valor) : true;
            });
        });
    }

    filterByPeriod(registro, period) {
        if (!registro.data_hora || !period.start || !period.end) {
            return true;
        }

        try {
            const registroDate = new Date(parseInt(registro.data_hora));

            // Ajusta para timezone São Paulo
            const startDate = new Date(period.start);
            startDate.setHours(0, 0, 0, 0);
            const startTimestamp = startDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });

            const endDate = new Date(period.end);
            endDate.setHours(23, 59, 59, 999);
            const endTimestamp = endDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });

            return registroDate >= new Date(startTimestamp) && registroDate <= new Date(endTimestamp);
        } catch (error) {
            console.error('Erro ao filtrar por período:', error);
            return true;
        }
    }

    getFieldValue(registro, tipo) {
        const mapeamento = {
            'status': 'status_atendimento',
            'tipo': 'tipo_atendimento',
            'funcionario': 'funcionario',
            'cliente': 'cliente',
            'sistema': 'sistema',
            'canal': 'canal_atendimento',
            'relato': 'solicitacao_cliente',
            'solicitacao': 'tipo_atendimento'
        };

        return registro[mapeamento[tipo] || tipo] || '';
    }

    calculateCharts(registros) {
        const charts = {};
        const fields = {
            status: 'status_atendimento',
            tipo: 'tipo_atendimento',
            funcionario: 'funcionario',
            cliente: 'cliente',
            sistema: 'sistema',
            canal: 'canal_atendimento',
            relato: 'solicitacao_cliente',
            solicitacao: 'tipo_atendimento'
        };

        Object.entries(fields).forEach(([chartName, fieldName]) => {
            const counts = registros.reduce((acc, registro) => {
                const value = registro[fieldName] || 'Não informado';
                acc[value] = (acc[value] || 0) + 1;
                return acc;
            }, {});

            const sortedEntries = Object.entries(counts)
                .sort(([, a], [, b]) => b - a);

            charts[chartName] = {
                labels: sortedEntries.map(([label]) => label),
                values: sortedEntries.map(([, value]) => value)
            };
        });

        return charts;
    }

    update(newData) {
        if (!newData || !newData.registros) {
            console.error('Dados inválidos para atualização');
            return;
        }

        // Processa timestamps dos novos dados
        newData.registros = newData.registros.map(registro => ({
            ...registro,
            data_hora: this.processTimestamp(registro.data_hora)
        }));

        console.info('Atualizando dados do dashboard:', {
            dadosAntigos: this.data.registros.length,
            dadosNovos: newData.registros.length,
            timestamp: new Date().toISOString()
        });

        this.data = newData;
        document.dispatchEvent(new CustomEvent('dashboardUpdate', {
            detail: this.data
        }));
    }

    showError(message) {
        const errorAlert = document.getElementById('updateError');
        if (errorAlert) {
            const errorMessage = errorAlert.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
            errorAlert.classList.remove('d-none');
            setTimeout(() => {
                errorAlert.classList.add('d-none');
            }, 5000);
        }
    }
}