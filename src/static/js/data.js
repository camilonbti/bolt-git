class DashboardDataManager {
    constructor() {
        console.info('Inicializando DashboardDataManager');
        this.data = this._getInitialData();
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
                start: this._formatDate(firstDayOfMonth),
                end: this._formatDate(today)
            }
        });
    }

    _getInitialData() {
        try {
            const dataElement = document.getElementById('dashboardData');
            if (!dataElement) {
                console.error('Elemento de dados não encontrado');
                return this._getEmptyData();
            }

            const data = JSON.parse(dataElement.textContent);
            console.info('Dados iniciais carregados:', {
                registros: data.registros?.length || 0,
                graficos: Object.keys(data.graficos || {})
            });
            
            return data;
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            return this._getEmptyData();
        }
    }

    _formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    _parseDate(dateStr) {
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
            const filteredData = this._filterData(this.data, filters);
            this._updateDashboard(filteredData);
            
            console.info('Filtros aplicados com sucesso:', {
                antes: this.data.registros?.length || 0,
                depois: filteredData.registros?.length || 0,
                filtrosAtivos: Object.keys(filters).length
            });
        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
        }
    }

    _filterData(data, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return {...data};
        }

        const registrosFiltrados = (data.registros || []).filter(registro => {
            return Object.entries(filters).every(([tipo, valores]) => {
                if (!valores || (Array.isArray(valores) && valores.length === 0)) {
                    return true;
                }
                
                if (tipo === 'period') {
                    return this._filterByPeriod(registro, valores);
                }
                
                const valor = this._getFieldValue(registro, tipo);
                return Array.isArray(valores) ? valores.includes(valor) : true;
            });
        });

        return {
            ...data,
            registros: registrosFiltrados,
            kpis: this._calcularKPIs(registrosFiltrados),
            graficos: this._calcularGraficos(registrosFiltrados)
        };
    }

    _filterByPeriod(registro, period) {
        if (!registro.data_hora || !period.start || !period.end) {
            return true;
        }

        try {
            const dataRegistro = this._parseDate(registro.data_hora);
            const startDate = this._parseDate(period.start);
            const endDate = this._parseDate(period.end);
            
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

    _getFieldValue(registro, tipo) {
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

    _calcularKPIs(registros) {
        const total = registros.length;
        const concluidos = registros.filter(r => r.status_atendimento === 'Concluído').length;
        
        return {
            total_registros: total,
            total_concluidos: concluidos,
            total_pendentes: total - concluidos
        };
    }

    _calcularGraficos(registros) {
        return {
            status: this._contarValores(registros, 'status_atendimento'),
            tipo: this._contarValores(registros, 'tipo_atendimento'),
            funcionario: this._contarValores(registros, 'funcionario'),
            cliente: this._contarValores(registros, 'cliente'),
            sistema: this._contarValores(registros, 'sistema'),
            canal: this._contarValores(registros, 'canal_atendimento')
        };
    }

    _contarValores(registros, campo) {
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

    _getEmptyData() {
        return {
            kpis: {
                total_registros: 0,
                total_concluidos: 0,
                total_pendentes: 0
            },
            graficos: {
                status: { labels: [], values: [] },
                tipo: { labels: [], values: [] },
                funcionario: { labels: [], values: [] },
                cliente: { labels: [], values: [] },
                sistema: { labels: [], values: [] },
                canal: { labels: [], values: [] }
            },
            registros: [],
            ultima_atualizacao: new Date().toISOString()
        };
    }

    _updateDashboard(data) {
        document.dispatchEvent(new CustomEvent('dashboardUpdate', {
            detail: data
        }));
    }

    update(newData) {
        this.data = newData;
        this._updateDashboard(newData);
    }
}