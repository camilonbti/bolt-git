class DashboardDataManager {
    constructor() {
        console.info('Inicializando DashboardDataManager');
        this.data = window.ATENDIMENTOS_DATASET || [];
        this.setupEventListeners();
        this.initializePeriodFilter();
    }

    setupEventListeners() {
        document.addEventListener('filterChange', (event) => {
            console.debug('Evento de mudança de filtro recebido:', event.detail);
            this.applyFilters(event.detail);
        });
    }

    initializePeriodFilter() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        this.applyFilters({
            period: {
                start: this.#formatDate(firstDayOfMonth),
                end: this.#formatDate(today)
            }
        });
    }

    #formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    #parseDate(dateStr) {
        if (!dateStr) return null;
        try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
        } catch (error) {
            console.error('Erro ao converter data:', error);
            return null;
        }
    }

    applyFilters(filters) {
        console.debug('Aplicando filtros:', filters);
        
        try {
            const filteredData = this.#filterData(this.data, filters);
            this.#updateDashboard(filteredData);
            
            console.info('Filtros aplicados com sucesso:', {
                antes: this.data.length,
                depois: filteredData.length,
                filtrosAtivos: Object.keys(filters).length
            });
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
            const dataRegistro = this.#parseDate(registro.data_hora);
            const startDate = this.#parseDate(period.start);
            const endDate = this.#parseDate(period.end);
            
            if (!dataRegistro || !startDate || !endDate) {
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
        const dashboardData = {
            registros: filteredData,
            kpis: this.#calcularKPIs(filteredData),
            graficos: this.#calcularGraficos(filteredData),
            ultima_atualizacao: new Date().toISOString()
        };

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
        this.data = newData;
        this.applyFilters({});
    }
}