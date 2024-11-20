// src/static/js/data.js
class DashboardDataManager {
    constructor() {
        console.info('Inicializando DashboardDataManager');
        this.data = {
            registros: [],
            kpis: {
                total_registros: 0,
                total_concluidos: 0,
                total_pendentes: 0,
                taxa_conclusao: 0
            },
            graficos: {
                status: { labels: [], values: [] },
                tipo: { labels: [], values: [] },
                funcionario: { labels: [], values: [] },
                cliente: { labels: [], values: [] },
                sistema: { labels: [], values: [] },
                canal: { labels: [], values: [] }
            },
            ultima_atualizacao: new Date().toISOString()
        };
        
        this.setupEventListeners();
        this.loadInitialData();
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

            // Filtra os registros
            const filteredRegistros = this.#filterData(this.data.registros, filters);
            
            // Recalcula KPIs e gráficos com os dados filtrados
            const updatedData = {
                registros: filteredRegistros,
                kpis: this.#calcularKPIs(filteredRegistros),
                graficos: this.#calcularGraficos(filteredRegistros),
                ultima_atualizacao: this.data.ultima_atualizacao
            };

            console.info('Dados filtrados:', {
                antes: this.data.registros.length,
                depois: filteredRegistros.length,
                filtrosAtivos: Object.keys(filters).length
            });

            // Dispara evento com dados atualizados
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
            const dataRegistro = new Date(registro.data_hora);
            const startDate = new Date(period.start);
            const endDate = new Date(period.end);
            
            if (!dataRegistro || !startDate || !endDate) {
                console.warn('Data inválida encontrada:', {
                    registro: registro.data_hora,
                    inicio: period.start,
                    fim: period.end
                });
                return true;
            }

            endDate.setHours(23, 59, 59, 999);
            return dataRegistro >= startDate && dataRegistro <= endDate;
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
            'canal': 'canal_atendimento'
        };
        
        return registro[mapeamento[tipo] || tipo] || '';
    }

    #calcularKPIs(registros) {
        const total = registros.length;
        const concluidos = registros.filter(r => r.status_atendimento === 'Concluído').length;
        const pendentes = registros.filter(r => r.status_atendimento === 'Pendente').length;
        
        return {
            total_registros: total,
            total_concluidos: concluidos,
            total_pendentes: pendentes,
            taxa_conclusao: total > 0 ? (concluidos / total * 100).toFixed(1) : 0
        };
    }

    #calcularGraficos(registros) {
        return {
            status: this.#contarValores(registros, 'status_atendimento'),
            tipo: this.#contarValores(registros, 'tipo_atendimento'),
            funcionario: this.#contarValores(registros, 'funcionario'),
            cliente: this.#contarValores(registros, 'cliente'),
            sistema: this.#contarValores(registros, 'sistema'),
            canal: this.#contarValores(registros, 'canal_atendimento')
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
