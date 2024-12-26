class DashboardManager {
    constructor() {
        console.info('Inicializando DashboardManager');
        this.timezone = 'America/Sao_Paulo';
        this.initialized = false;
        this.initializeComponents();
    }

    async initializeComponents() {
        try {
            this.dataManager = new DashboardDataManager();
            const initialData = await this.dataManager.loadInitialData();
            
            if (!initialData) {
                throw new Error('Falha ao carregar dados iniciais');
            }

            // Inicializa componentes
            this.filterManager = new FilterManager();
            this.tableManager = new TableManager();
            this.chartManager = new ChartManager(initialData.graficos);
            
            // Inicializa timeline após garantir que a classe existe
            if (typeof TimelineChart !== 'undefined') {
                this.timelineChart = new TimelineChart();
                console.info('Timeline chart inicializado');
            } else {
                console.error('TimelineChart não encontrado');
            }
            
            this.updater = new DashboardUpdater();
            
            // Atualiza dados iniciais
            if (initialData.registros) {
                this.timelineChart?.update(initialData.registros);
            }
            
            this.setupEventListeners();
            this.initialized = true;
            
            const initialFilters = this.filterManager.getActiveFilters();
            this.applyFiltersOnce(initialData.registros, initialFilters);
            
        } catch (error) {
            console.error('Erro ao inicializar componentes:', error);
            this.showError('Erro ao inicializar dashboard');
        }
    }

    updateDashboard(data) {
        if (!data || !this.initialized) {
            console.error('Dados inválidos ou dashboard não inicializado');
            return;
        }

        try {
            const loadingState = document.getElementById('loadingState');
            const dashboardContent = document.getElementById('dashboardContent');
            
            if (loadingState) loadingState.classList.add('d-none');
            if (dashboardContent) dashboardContent.classList.remove('d-none');

            // Atualiza componentes
            this.updateKPIs(data.kpis || {});
            this.tableManager?.updateTable(data.registros || []);
            this.chartManager?.updateCharts(data.graficos || {});
            this.timelineChart?.update(data.registros || []);
            this.updateTimestamp(data.ultima_atualizacao);
            
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
            this.showError('Erro ao atualizar dashboard');
        }
    }

    // Atualizar o método updateDashboard para incluir a timeline
    updateDashboard(data) {
        if (!data || !this.initialized) {
            console.error('Dados inválidos ou dashboard não inicializado');
            return;
        }

        try {
            const loadingState = document.getElementById('loadingState');
            const dashboardContent = document.getElementById('dashboardContent');
            
            if (loadingState) loadingState.classList.add('d-none');
            if (dashboardContent) dashboardContent.classList.remove('d-none');

            this.updateKPIs(data.kpis || {});
            
            if (this.tableManager) {
                this.tableManager.updateTable(data.registros || []);
            }
            
            if (this.chartManager) {
                this.chartManager.updateCharts(data.graficos || {});
            }

            // Atualiza o gráfico de timeline
            if (this.timelineChart) {
                this.timelineChart.update(data.registros || []);
            }
            
            this.updateTimestamp(data.ultima_atualizacao);
            
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
            this.showError('Erro ao atualizar dashboard');
        }
    }

    waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                resolve();
            } else {
                document.addEventListener('DOMContentLoaded', resolve);
            }
        });
    }

    setupEventListeners() {
        document.addEventListener('dashboardUpdate', (event) => {
            if (event.detail) {
                const filters = this.filterManager.getActiveFilters();
                this.applyFiltersOnce(event.detail.registros, filters);
            }
        });

        document.addEventListener('filterChange', (event) => {
            if (event.detail && this.dataManager.data.registros) {
                this.applyFiltersOnce(this.dataManager.data.registros, event.detail);
            }
        });

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                try {
                    await this.dataManager.loadInitialData();
                } catch (error) {
                    console.error('Erro ao atualizar dados:', error);
                    this.showError('Erro ao atualizar dados');
                }
            });
        }
    }

    applyFiltersOnce(registros, filters) {
        if (!registros || !filters) {
            this.updateDashboard({
                registros: [],
                kpis: this.calculateKPIs([]),
                graficos: this.calculateCharts([]),
                ultima_atualizacao: Date.now()
            });
            return;
        }

        try {
            const filteredData = registros.filter(registro => {
                return Object.entries(filters).every(([key, value]) => {
                    if (!value || (Array.isArray(value) && value.length === 0)) {
                        return true;
                    }

                    if (key === 'period') {
                        return this.filterByPeriod(registro, value);
                    }

                    const fieldValue = this.getFieldValue(registro, key);
                    return Array.isArray(value) ? value.includes(fieldValue) : value === fieldValue;
                });
            });

            const updatedData = {
                registros: filteredData,
                kpis: this.calculateKPIs(filteredData),
                graficos: this.calculateCharts(filteredData),
                ultima_atualizacao: Date.now()
            };

            this.filteredData = filteredData;
            this.updateDashboard(updatedData);

        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            this.showError('Erro ao aplicar filtros');
        }
    }

    updateDashboard(data) {
        if (!data || !this.initialized) {
            console.error('Dados inválidos ou dashboard não inicializado');
            return;
        }

        try {
            const loadingState = document.getElementById('loadingState');
            const dashboardContent = document.getElementById('dashboardContent');
            
            if (loadingState) loadingState.classList.add('d-none');
            if (dashboardContent) dashboardContent.classList.remove('d-none');

            this.updateKPIs(data.kpis || {});
            
            if (this.tableManager) {
                this.tableManager.updateTable(data.registros || []);
            }
            
            if (this.chartManager) {
                this.chartManager.updateCharts(data.graficos || {});
            }
            
            this.updateTimestamp(data.ultima_atualizacao);
            
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
            this.showError('Erro ao atualizar dashboard');
        }
    }

    filterByPeriod(registro, period) {
        if (!registro.data_atendimento || !period.start || !period.end) {
            return true;
        }
    
        try {
            return registro.data_atendimento >= period.start && 
                   registro.data_atendimento <= period.end;
        } catch (error) {
            console.error('Erro ao filtrar por período:', error);
            return true;
        }
    }

    getFieldValue(registro, key) {
        const fieldMappings = {
            'status': 'status_atendimento',
            'tipo': 'tipo_atendimento',
            'funcionario': 'funcionario',
            'cliente': 'cliente',
            'sistema': 'sistema',
            'canal': 'canal_atendimento',
            'relato': 'solicitacao_cliente',
            'solicitacao': 'tipo_atendimento',
            'relatosDetalhados': 'solicitacao_cliente',
            'origemProblema': 'origem_problema'
        };
    
        const fieldName = fieldMappings[key] || key;
        return registro[fieldName] || '';
    }

    calculateKPIs(data) {
        if (!data || data.length === 0) {
            return {
                total_registros: 0,
                total_pendentes: 0,
                total_concluidos: 0,
                taxa_conclusao: 0
            };
        }

        const total = data.length;
        const concluidos = data.filter(r => r.status_atendimento === 'Concluído').length;
        const pendentes = data.filter(r => r.status_atendimento === 'Pendente').length;
        const taxa = (concluidos / total) * 100;

        return {
            total_registros: total,
            total_pendentes: pendentes,
            total_concluidos: concluidos,
            taxa_conclusao: parseFloat(taxa.toFixed(1))
        };
    }

    calculateCharts(data) {
        if (!data || data.length === 0) {
            return {
                status: { labels: [], values: [] },
                tipo: { labels: [], values: [] },
                funcionario: { labels: [], values: [] },
                cliente: { labels: [], values: [] },
                sistema: { labels: [], values: [] },
                canal: { labels: [], values: [] },
                relato: { labels: [], values: [] },
                solicitacao: { labels: [], values: [] },
                relatosDetalhados: { labels: [], values: [] },
                origemProblema: { labels: [], values: [] }
            };
        }
    
        const charts = {};
        const fields = {
            status: 'status_atendimento',
            tipo: 'tipo_atendimento',
            funcionario: 'funcionario',
            cliente: 'cliente',
            sistema: 'sistema',
            canal: 'canal_atendimento',
            relato: 'solicitacao_cliente',
            solicitacao: 'tipo_atendimento',
            relatosDetalhados: 'solicitacao_cliente',
            origemProblema: 'origem_problema'
        };

        Object.entries(fields).forEach(([chartName, fieldName]) => {
            const counts = data.reduce((acc, registro) => {
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

    updateKPIs(kpis) {
        const elements = {
            totalAtendimentos: document.getElementById('totalAtendimentos'),
            totalPendentes: document.getElementById('totalPendentes'),
            totalConcluidos: document.getElementById('totalConcluidos'),
            taxaConclusao: document.getElementById('taxaConclusao')
        };

        try {
            Object.entries(elements).forEach(([key, element]) => {
                if (!element) return;

                let value = 0;
                switch (key) {
                    case 'totalAtendimentos':
                        value = kpis.total_registros || 0;
                        break;
                    case 'totalPendentes':
                        value = kpis.total_pendentes || 0;
                        break;
                    case 'totalConcluidos':
                        value = kpis.total_concluidos || 0;
                        break;
                    case 'taxaConclusao':
                        value = kpis.taxa_conclusao || 0;
                        break;
                }

                const formattedValue = key === 'taxaConclusao' 
                    ? `${this.formatNumber(value, 1)}%`
                    : this.formatNumber(value);

                this.animateValue(element, 
                    parseFloat(element.textContent.replace(/[^0-9.-]+/g, '') || 0), 
                    value);
            });
        } catch (error) {
            console.error('Erro ao atualizar KPIs:', error);
        }
    }

    animateValue(element, start, end) {
        if (!element) return;

        const duration = 500;
        const startTime = performance.now();
        const startValue = parseFloat(start) || 0;
        const endValue = parseFloat(end) || 0;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const value = startValue + (endValue - startValue) * this.easeOutQuad(progress);
            
            if (element.id === 'taxaConclusao') {
                element.textContent = `${this.formatNumber(value, 1)}%`;
            } else {
                element.textContent = this.formatNumber(value);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    easeOutQuad(x) {
        return 1 - (1 - x) * (1 - x);
    }

    formatNumber(value, decimals = 0) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0';
        }

        try {
            return Number(value).toLocaleString('pt-BR', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        } catch (error) {
            console.error('Erro ao formatar número:', error);
            return '0';
        }
    }

    updateTimestamp(timestamp) {
        const element = document.getElementById('lastUpdate');
        if (!element || !timestamp) return;

        try {
            const date = new Date(parseInt(timestamp));
            if (isNaN(date.getTime())) {
                throw new Error('Invalid timestamp');
            }

            const options = {
                timeZone: this.timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };

            element.textContent = date.toLocaleString('pt-BR', options);
        } catch (error) {
            console.error('Erro ao atualizar timestamp:', error);
            element.textContent = 'Data indisponível';
        }
    }

    showError(message) {
        console.error(message);
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