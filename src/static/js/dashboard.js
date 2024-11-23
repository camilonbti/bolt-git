class DashboardManager {
    constructor() {
        console.info('Inicializando DashboardManager');
        this.timezone = 'America/Sao_Paulo';
        this.initialized = false;
        this.initializeComponents();
    }

    async initializeComponents() {
        try {
            // Inicializa gerenciador de dados primeiro
            this.dataManager = new DashboardDataManager();
            
            // Aguarda o carregamento inicial dos dados
            const initialData = await this.dataManager.loadInitialData();
            
            if (!initialData) {
                throw new Error('Falha ao carregar dados iniciais');
            }

            // Aguarda o DOM estar pronto
            await this.waitForDOM();
            
            // Inicializa componentes visuais
            this.chartManager = new ChartManager(initialData.graficos);
            this.tableManager = new TableManager();
            this.filterManager = new FilterManager();
            this.updater = new DashboardUpdater();
            
            // Configura listeners de eventos
            this.setupEventListeners();
            
            // Marca como inicializado
            this.initialized = true;
            
            console.debug('Componentes inicializados com sucesso');
            
            // Aplica o filtro inicial antes de atualizar o dashboard
            console.debug('Aplicando filtro inicial aos dados');
            const initialFilters = this.filterManager.getActiveFilters();
            const filteredData = this.applyFilters(initialData.registros, initialFilters);
            
            // Atualiza dashboard com dados filtrados
            const updatedData = {
                registros: filteredData,
                kpis: this.calculateKPIs(filteredData),
                graficos: this.calculateCharts(filteredData),
                ultima_atualizacao: Date.now()
            };
            
            this.updateDashboard(updatedData);
            
        } catch (error) {
            console.error('Erro ao inicializar componentes:', error);
            this.showError('Erro ao inicializar dashboard');
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
            console.debug('Evento de atualização recebido');
            if (event.detail) {
                this.updateDashboard(event.detail);
            }
        });

        document.addEventListener('filterChange', (event) => {
            console.debug('Evento de filtro recebido:', event.detail);
            if (event.detail) {
                this.applyFilters(this.dataManager.data.registros, event.detail);
            }
        });

        // Listener para botão de atualização
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

    updateDashboard(data) {
        if (!data || !this.initialized) {
            console.error('Dados inválidos ou dashboard não inicializado');
            return;
        }

        try {
            // Remove loading state e mostra conteúdo
            const loadingState = document.getElementById('loadingState');
            const dashboardContent = document.getElementById('dashboardContent');
            
            if (loadingState) loadingState.classList.add('d-none');
            if (dashboardContent) dashboardContent.classList.remove('d-none');

            // Atualiza KPIs
            this.updateKPIs(data.kpis || {});
            
            // Atualiza componentes visuais
            if (this.chartManager) {
                this.chartManager.updateCharts(data.graficos || {});
            }
            
            if (this.tableManager) {
                this.tableManager.updateTable(data.registros || []);
            }
            
            this.updateTimestamp(data.ultima_atualizacao);
            
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
            this.showError('Erro ao atualizar dashboard');
        }
    }

    applyFilters(registros, filters) {
        if (!registros || !filters) {
            console.warn('Dados ou filtros inválidos');
            return registros;
        }

        try {
            console.debug('Aplicando filtros aos dados:', filters);
            
            // Filtra os dados
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

            console.debug(`Dados filtrados: ${filteredData.length} registros`);

            // Atualiza o dashboard com os dados filtrados
            const updatedData = {
                registros: filteredData,
                kpis: this.calculateKPIs(filteredData),
                graficos: this.calculateCharts(filteredData),
                ultima_atualizacao: Date.now()
            };

            this.updateDashboard(updatedData);
            return filteredData;

        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            this.showError('Erro ao aplicar filtros');
            return registros;
        }
    }

    filterByPeriod(registro, period) {
        if (!registro.data_hora || !period.start || !period.end) {
            return true;
        }

        try {
            const registroDate = new Date(parseInt(registro.data_hora));
            const startDate = new Date(period.start);
            const endDate = new Date(period.end);

            console.debug('Filtrando por período:', {
                registro: registroDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                inicio: startDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                fim: endDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            });

            return registroDate >= startDate && registroDate <= endDate;
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
            'solicitacao': 'tipo_atendimento'
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
            return {};
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
            solicitacao: 'tipo_atendimento'
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
                if (!element) {
                    console.warn(`Elemento ${key} não encontrado`);
                    return;
                }

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