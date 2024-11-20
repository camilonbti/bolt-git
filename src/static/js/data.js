class DashboardDataManager {
    constructor() {
        console.info('Inicializando DashboardDataManager');
        this.timezone = 'America/Sao_Paulo';
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
            ultima_atualizacao: this.formatDateTime(new Date())
        };
        
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupEventListeners() {
        console.debug('Configurando event listeners');
        
        document.addEventListener('filterChange', (event) => {
            console.info('Evento de mudança de filtro recebido:', {
                filtros: event.detail,
                timestamp: this.formatDateTime(new Date())
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

            this.data = data;
            console.info('Dados iniciais carregados:', {
                registros: data.registros.length,
                timestamp: this.formatDateTime(new Date())
            });

            document.dispatchEvent(new CustomEvent('dashboardUpdate', { 
                detail: this.data 
            }));

            if (loadingState) loadingState.classList.add('d-none');
            if (dashboardContent) dashboardContent.classList.remove('d-none');

        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            if (loadingState) loadingState.classList.add('d-none');
            this.showError('Erro ao carregar dados iniciais');
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
                ultima_atualizacao: this.formatDateTime(new Date())
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
            const registroTimestamp = new Date(registro.data_hora).getTime();
            const startTimestamp = new Date(period.start).getTime();
            const endTimestamp = new Date(period.end).getTime();

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

    formatDateTime(date) {
        return date.toLocaleString('pt-BR', {
            timeZone: this.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    #calcularKPIs(registros) {
        const total = registros.length;
        const pendentes = registros.filter(r => r.status_atendimento === 'Pendente').length;
        const taxa_conclusao = total > 0 ? ((total - pendentes) / total * 100) : 0;
        
        return {
            total_registros: total,
            total_pendentes: pendentes,
            taxa_conclusao: taxa_conclusao.toFixed(1)
        };
    }

    #calcularGraficos(registros) {
        return {
            status: this.#contarValores(registros, 'status_atendimento'),
            tipo: this.#contarValores(registros, 'tipo_atendimento', 10),
            funcionario: this.#contarValores(registros, 'funcionario', 10),
            cliente: this.#contarValores(registros, 'cliente', 10),
            sistema: this.#contarValores(registros, 'sistema', 10),
            canal: this.#contarValores(registros, 'canal_atendimento'),
            relato: this.#contarValores(registros, 'solicitacao_cliente', 10),
            solicitacao: this.#contarValores(registros, 'tipo_atendimento', 10)
        };
    }

    #contarValores(registros, campo) {
        const contagem = registros.reduce((acc, registro) => {
            const valor = registro[campo] || 'Não informado';
            acc[valor] = (acc[valor] || 0) + 1;
            return acc;
        }, {});

        const ordenado = Object.entries(contagem)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

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

        console.info('Atualizando dados do dashboard:', {
            dadosAntigos: this.data.registros.length,
            dadosNovos: newData.registros.length
        });
        
        this.data = newData;
        this.applyFilters({});
    }
}
