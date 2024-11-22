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
            ultima_atualizacao: DateUtils.getCurrentTime()
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.debug('Configurando event listeners');
        
        document.addEventListener('filterChange', (event) => {
            console.info('Evento de mudança de filtro recebido:', {
                filtros: event.detail,
                timestamp: DateUtils.formatDateTime(new Date())
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
                data_hora: DateUtils.formatTimestamp(registro.data_hora)
            }));

            this.data = data;
            console.info('Dados iniciais carregados:', {
                registros: data.registros.length,
                timestamp: DateUtils.formatDateTime(new Date())
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

    applyFilters(filters) {
        console.debug('Aplicando filtros:', filters);
        
        try {
            if (!this.data || !this.data.registros) {
                console.warn('Dados não disponíveis para filtrar');
                return;
            }

            const filteredRegistros = this.#filterData(this.data.registros, filters);
            
            const updatedData = {
                registros: filteredRegistros,
                kpis: this.#calcularKPIs(filteredRegistros),
                graficos: this.#calcularGraficos(filteredRegistros),
                ultima_atualizacao: DateUtils.getCurrentTime()
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
            this.showError('Erro ao aplicar filtros');
        }
    }

    #filterData(registros, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return registros;
        }

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
            const registroTimestamp = DateUtils.formatTimestamp(registro.data_hora);
            const startTimestamp = DateUtils.getDateWithMinTime(period.start).getTime();
            const endTimestamp = DateUtils.getDateWithMaxTime(period.end).getTime();

            return registroTimestamp >= startTimestamp && registroTimestamp <= endTimestamp;
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
        const total = registros.length;
        const pendentes = registros.filter(r => r.status_atendimento === 'Pendente').length;
        const concluidos = registros.filter(r => r.status_atendimento === 'Concluído').length;
        const taxa_conclusao = total > 0 ? ((concluidos / total) * 100) : 0;
        
        return {
            total_registros: total,
            total_pendentes: pendentes,
            total_concluidos: concluidos,
            taxa_conclusao: taxa_conclusao.toFixed(1)
        };
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
            .sort(([,a], [,b]) => b - a);

        return {
            labels: ordenado.map(([label]) => label),
            values: ordenado.map(([,value]) => value)
        };
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

    update(newData) {
        if (!newData || !newData.registros) {
            console.error('Dados inválidos para atualização');
            return;
        }

        // Processa timestamps dos novos dados
        newData.registros = newData.registros.map(registro => ({
            ...registro,
            data_hora: DateUtils.formatTimestamp(registro.data_hora)
        }));

        console.info('Atualizando dados do dashboard:', {
            dadosAntigos: this.data.registros.length,
            dadosNovos: newData.registros.length,
            timestamp: DateUtils.formatDateTime(new Date())
        });
        
        this.data = newData;
        this.applyFilters({});
    }
}
