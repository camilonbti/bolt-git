class DashboardManager {
    constructor() {
        console.info('Inicializando DashboardManager');
        this.timezone = 'America/Sao_Paulo';
        this.initializeComponents();
        this.setupEventListeners();
    }

    async initializeComponents() {
        try {
            // Inicializa gerenciador de dados primeiro e aguarda o carregamento
            this.dataManager = new DashboardDataManager();
            await this.dataManager.loadInitialData();
            
            // Após ter os dados, inicializa os componentes visuais
            this.chartManager = new ChartManager(this.dataManager.data.graficos);
            this.tableManager = new TableManager();
            this.filterManager = new FilterManager();
            
            // Inicializa atualizador por último
            this.updater = new DashboardUpdater();
            
            console.debug('Componentes inicializados com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar componentes:', error);
            this.showError('Erro ao inicializar dashboard');
        }
    }

    setupEventListeners() {
        document.addEventListener('dashboardUpdate', (event) => {
            console.debug('Evento de atualização recebido');
            this.updateDashboard(event.detail);
        });

        document.addEventListener('filterChange', (event) => {
            console.debug('Evento de filtro recebido:', event.detail);
            this.applyFilters(event.detail);
        });
    }

    updateDashboard(data) {
        console.debug('Atualizando dashboard com novos dados');
        
        try {
            if (!data) {
                throw new Error('Dados inválidos');
            }

            this.updateKPIs(data.kpis || {});
            
            if (this.chartManager) {
                this.chartManager.updateCharts(data.graficos || {});
            }
            
            if (this.tableManager) {
                this.tableManager.updateTable(data.registros || []);
            }
            
            this.updateTimestamp(data.ultima_atualizacao);
            
            console.info('Dashboard atualizado com sucesso:', {
                registros: data.registros?.length || 0,
                graficos: Object.keys(data.graficos || {})
            });
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
            this.showError('Erro ao atualizar dashboard');
        }
    }

    updateKPIs(kpis) {
        const elements = {
            totalAtendimentos: document.getElementById('totalAtendimentos'),
            totalPendentes: document.getElementById('totalPendentes'),
            totalConcluidos: document.getElementById('totalConcluidos'),
            taxaConclusao: document.getElementById('taxaConclusao')
        };

        try {
            if (elements.totalAtendimentos) {
                elements.totalAtendimentos.textContent = this.formatNumber(kpis.total_registros);
            }
            if (elements.totalPendentes) {
                elements.totalPendentes.textContent = this.formatNumber(kpis.total_pendentes);
            }
            if (elements.totalConcluidos) {
                elements.totalConcluidos.textContent = this.formatNumber(kpis.total_concluidos);
            }
            if (elements.taxaConclusao) {
                elements.taxaConclusao.textContent = `${this.formatNumber(kpis.taxa_conclusao, 1)}%`;
            }
        } catch (error) {
            console.error('Erro ao atualizar KPIs:', error);
        }
    }

    updateTimestamp(timestamp) {
        const element = document.getElementById('lastUpdate');
        if (!element || !timestamp) return;

        try {
            const formattedDate = DateUtils.formatDateTime(timestamp);
            if (!formattedDate) {
                throw new Error('Falha ao formatar data');
            }
            element.textContent = formattedDate;
        } catch (error) {
            console.error('Erro ao atualizar timestamp:', error);
            element.textContent = 'Data indisponível';
        }
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

    applyFilters(filters) {
        if (!filters || typeof filters !== 'object') {
            console.warn('Filtros inválidos:', filters);
            return;
        }

        try {
            if (!this.dataManager?.data?.registros) {
                console.warn('Dados não disponíveis para filtrar');
                return;
            }

            const filteredData = this.dataManager.data.registros.filter(registro => {
                return Object.entries(filters).every(([key, value]) => {
                    if (!value || (Array.isArray(value) && value.length === 0)) {
                        return true;
                    }

                    if (key === 'period') {
                        if (!registro.data_hora || !value.start || !value.end) {
                            return true;
                        }

                        try {
                            const registroDate = DateUtils.formatTimestamp(registro.data_hora);
                            const startDate = DateUtils.getDateWithMinTime(value.start).getTime();
                            const endDate = DateUtils.getDateWithMaxTime(value.end).getTime();

                            return registroDate >= startDate && registroDate <= endDate;
                        } catch (error) {
                            console.error('Erro ao filtrar por período:', error);
                            return true;
                        }
                    }

                    const fieldValue = this.getFieldValue(registro, key);
                    return Array.isArray(value) ? 
                        value.includes(fieldValue) : 
                        fieldValue === value;
                });
            });

            const updatedData = {
                ...this.dataManager.data,
                registros: filteredData,
                ultima_atualizacao: DateUtils.getCurrentTime().getTime()
            };

            console.debug('Dados filtrados:', {
                antes: this.dataManager.data.registros.length,
                depois: filteredData.length,
                filtros: filters
            });

            this.updateDashboard(updatedData);

        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            this.showError('Erro ao aplicar filtros');
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
}
