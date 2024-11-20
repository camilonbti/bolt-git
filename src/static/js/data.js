class DashboardDataManager {
    constructor() {
        console.info('Inicializando DashboardDataManager');
        
        // Verifica se o dataset foi injetado corretamente
        if (typeof ATENDIMENTOS_DATASET === 'undefined') {
            console.error('Dataset não encontrado');
            this.data = [];
        } else {
            console.info('Dataset carregado com sucesso:', {
                registros: ATENDIMENTOS_DATASET.length,
                primeiroRegistro: ATENDIMENTOS_DATASET[0],
                ultimoRegistro: ATENDIMENTOS_DATASET[ATENDIMENTOS_DATASET.length - 1]
            });
            this.data = ATENDIMENTOS_DATASET;
        }

        this.setupEventListeners();
        this.initializePeriodFilter();
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

        document.addEventListener('dashboardUpdate', (event) => {
            console.info('Evento de atualização do dashboard recebido:', {
                dados: event.detail,
                timestamp: new Date().toISOString()
            });
        });
    }

    initializePeriodFilter() {
        console.debug('Inicializando filtro de período');
        
        if (this.data.length === 0) {
            console.warn('Sem dados para inicializar filtro de período');
            return;
        }

        // Encontra a data mais antiga e mais recente no dataset
        const dates = this.data.map(item => new Date(item.data_hora));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        console.info('Período inicial definido:', {
            inicio: minDate.toISOString(),
            fim: maxDate.toISOString()
        });

        this.applyFilters({
            period: {
                start: this.#formatDate(minDate),
                end: this.#formatDate(maxDate)
            }
        });
    }

    #formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    applyFilters(filters) {
        console.debug('Aplicando filtros:', filters);
        
        try {
            const filteredData = this.#filterData(this.data, filters);
            
            console.info('Dados filtrados:', {
                antes: this.data.length,
                depois: filteredData.length,
                filtrosAtivos: Object.keys(filters).length
            });

            this.#updateDashboard(filteredData);
            
        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
        }
    }

    #filterData(data, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return data;
        }

        return data.filter(registro => {
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

    #updateDashboard(filteredData) {
        console.debug('Atualizando dashboard com dados filtrados');
        
        const dashboardData = {
            registros: filteredData,
            kpis: this.#calcularKPIs(filteredData),
            graficos: this.#calcularGraficos(filteredData),
            ultima_atualizacao: new Date().toISOString()
        };

        console.info('Dashboard atualizado:', {
            totalRegistros: filteredData.length,
            kpis: dashboardData.kpis,
            timestamp: dashboardData.ultima_atualizacao
        });

        document.dispatchEvent(new CustomEvent('dashboardUpdate', { 
            detail: dashboardData 
        }));
    }

    #calcularKPIs(registros) {
        const total = registros.length;
        const concluidos = registros.filter(r => r.status_atendimento === 'Concluído').length;
        
        return {
            total_registros: total,
            total_concluidos: concluidos,
            total_pendentes: total - concluidos,
            taxa_conclusao: total > 0 ? (concluidos / total * 100) : 0
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

    update(newData) {
        console.info('Atualizando dados do dashboard:', {
            dadosAntigos: this.data.length,
            dadosNovos: newData.length
        });
        
        this.data = newData;
        this.applyFilters({});
    }
}