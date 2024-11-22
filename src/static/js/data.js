class DashboardDataManager {
    constructor() {
        console.info('Inicializando DashboardDataManager');
        this.data = {
            registros: [],
            kpis: {
                total_registros: 0,
                total_pendentes: 0,
                taxa_conclusao: 0,
                tempo_medio: 0
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

    applyFilters(filters) {
        console.info('teste');
        if (!filters || Object.keys(filters).length === 0) {
            console.debug('Nenhum filtro para aplicar');
            return;
        }

        try {
            console.debug('Aplicando filtros:', filters);

            console.info('antes kpi');
            const filteredRegistros = this.#filterData(this.data.registros, filters);
            console.info('dps kpi');

            console.info('Registros enviados para cálculo de KPIs:', filteredRegistros);

            const updatedData = {
                registros: filteredRegistros,
                kpis: this.#calcularKPIs(filteredRegistros),
                graficos: this.#calcularGraficos(filteredRegistros),
                ultima_atualizacao: new Date().getTime()
            };

            console.info('Dados filtrados:', {
                antes: this.data.registros.length,
                depois: filteredRegistros.length,
                filtrosAtivos: Object.keys(filters).length
            });

            document.dispatchEvent(new CustomEvent('dashboardUpdate', {
                detail: updatedData
            }));

        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            this.showError('Erro ao aplicar filtros aos dados');
        }
    }

    #filterData(registros, filters) {
        return registros.filter(registro => {
            return Object.entries(filters).every(([tipo, valores]) => {
                if (!valores || (Array.isArray(valores) && valores.length === 0)) {
                    return true;
                }

                if (tipo === 'period') {
                    return this.#filterByPeriod(registro, valores);
                }

                const valor = this.#getFieldValue(registro, tipo);
                return Array.isArray(valores) ? valores.includes(valor) : true;
            });
        });
    }

    #filterByPeriod(registro, period) {
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

    #getFieldValue(registro, tipo) {
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

    #calcularKPIs(registros) {
        console.info('KPIs - Registros recebidos para cálculo:', registros);
        const total = registros.length;
        const pendentes = registros.filter(r => r.status_atendimento === 'Pendente').length;
        const concluidos = registros.filter(r => r.status_atendimento === 'Concluído').length;
        const taxa_conclusao = total > 0 ? ((concluidos / total) * 100) : 0;
        console.info('KPIs - Total de registros:', total);
        console.info('KPIs - Total pendentes:', pendentes);
        console.info('KPIs - Total concluídos:', concluidos);
        console.info('KPIs - Taxa de conclusão:', taxa_conclusao);

        // Logs intermediários
        console.info('Total de registros:', total);
        console.info('Total pendentes:', pendentes);
        console.debug('Total concluídos:', concluidos);
        console.info('Taxa de conclusão:', taxa_conclusao);

        const kpis = {
            total_registros: total,
            total_pendentes: pendentes,
            total_concluidos: concluidos,
            taxa_conclusao: taxa_conclusao.toFixed(1),
        };

        console.info('KPIs calculados:', kpis); // Log final
        return kpis;
    }

    #calcularGraficos(registros) {
        return {
            status: this.#contarValores(registros, 'status_atendimento'),
            tipo: this.#contarValores(registros, 'tipo_atendimento'),
            funcionario: this.#contarValores(registros, 'funcionario'),
            cliente: this.#contarValores(registros, 'cliente'),
            sistema: this.#contarValores(registros, 'sistema'),
            canal: this.#contarValores(registros, 'canal_atendimento'),
            relato: this.#contarValores(registros, 'solicitacao_cliente'),
            solicitacao: this.#contarValores(registros, 'tipo_atendimento')
        };
    }

    #contarValores(registros, campo) {
        const contagem = registros.reduce((acc, registro) => {
            const valor = registro[campo] || 'Não informado';
            acc[valor] = (acc[valor] || 0) + 1;
            return acc;
        }, {});

        const ordenado = Object.entries(contagem)
            .sort(([, a], [, b]) => b - a);

        return {
            labels: ordenado.map(([label]) => label),
            values: ordenado.map(([, value]) => value)
        };
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