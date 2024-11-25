class FilterManager {
    constructor() {
        console.info('Inicializando FilterManager');
        this.filters = new Map();
        this.filterContainer = document.getElementById('activeFilters');
        
        // Inicializa as constantes de data e hora com timezone São Paulo
        const today = new Date();
        const brasiliaOffset = -180; // GMT-3 em minutos
        const brasiliaTime = new Date(today.getTime() + (today.getTimezoneOffset() + brasiliaOffset) * 60000);
        
        // Define data inicial e final como hoje
        this.data_ini = new Date(brasiliaTime);
        this.data_fim = new Date(brasiliaTime);

        // Aplica horários nas datas
        this.data_ini.setHours(0, 0, 0, 0);
        this.data_fim.setHours(23, 59, 59, 999);

        console.debug('Datas inicializadas:', {
            dataInicial: this.data_ini.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            dataFinal: this.data_fim.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        });
        
        if (!this.filterContainer) {
            console.error('Elemento activeFilters não encontrado');
            return;
        }
        
        this.setupEventListeners();
        this.initializeDateFields();
    }

    setupEventListeners() {
        document.addEventListener('chartClick', (event) => {
            console.debug('Clique no gráfico:', event.detail);
            this.toggleFilter(event.detail.type, event.detail.value);
        });

        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');

        if (startDateInput && endDateInput) {
            startDateInput.addEventListener('change', () => this.handleDateChange());
            endDateInput.addEventListener('change', () => this.handleDateChange());
        }

        // Escuta o evento de dados carregados
        document.addEventListener('dashboardUpdate', (event) => {
            if (event.detail && event.detail.registros) {
                console.debug('Dados atualizados, total de registros:', event.detail.registros.length);
                // Aplica filtros aos novos dados
                this.applyInitialPeriodFilter();
            }
        });
    }

    applyInitialPeriodFilter() {
        console.debug('Aplicando filtro de período inicial');
        
        const filters = this.getActiveFilters();
        console.debug('Filtros ativos:', filters);
        
        // Força a atualização da UI e notifica a mudança
        this.updateUI();
        this.notifyFilterChange();
    }

    handleDateChange() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');

        if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
            console.warn('Campos de data não preenchidos');
            return;
        }

        try {
            console.debug('Valores dos inputs:', {
                startDate: startDateInput.value,
                endDate: endDateInput.value
            });

            // Atualiza as datas mantendo o timezone de São Paulo
            const startDate = new Date(startDateInput.value + 'T00:00:00-03:00');
            const endDate = new Date(endDateInput.value + 'T23:59:59-03:00');
            
            this.data_ini = startDate;
            this.data_fim = endDate;

            console.debug('Datas atualizadas:', {
                dataInicial: this.data_ini.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                dataFinal: this.data_fim.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            });

            if (!this.validateDates()) {
                return;
            }

            this.updateUI();
            this.notifyFilterChange();
        } catch (error) {
            console.error('Erro ao processar datas:', error);
            this.showError('Erro ao processar datas');
        }
    }

    validateDates() {
        try {
            const now = new Date();
            const today = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
            today.setHours(23, 59, 59, 999);

            console.debug('Validando datas:', {
                dataInicial: this.data_ini.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                dataFinal: this.data_fim.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                hoje: today.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            });

            if (isNaN(this.data_ini.getTime()) || isNaN(this.data_fim.getTime())) {
                this.showError('Data inválida');
                return false;
            }

            if (this.data_ini > this.data_fim) {
                this.showError('Data inicial não pode ser maior que a data final');
                return false;
            }

            if (this.data_fim > today) {
                this.showError('Não é possível selecionar datas futuras');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erro ao validar datas:', error);
            return false;
        }
    }

    initializeDateFields() {
        try {
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');
            
            if (!startDateInput || !endDateInput) {
                console.error('Campos de data não encontrados');
                return;
            }
            
            // Formata as datas para o input
            startDateInput.value = this.formatDateForInput(this.data_ini);
            endDateInput.value = this.formatDateForInput(this.data_fim);
            
            console.debug('Campos de data inicializados:', {
                dataInicial: startDateInput.value,
                dataFinal: endDateInput.value
            });

            // Aplica o filtro inicial
            this.applyInitialPeriodFilter();
        } catch (error) {
            console.error('Erro ao inicializar campos de data:', error);
        }
    }

    formatDateForInput(date) {
        try {
            const d = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Erro ao formatar data para input:', error);
            return '';
        }
    }

    toggleFilter(type, value) {
        console.debug('Toggle filter:', { type, value });

        // Período é sempre obrigatório e não pode ser removido
        if (type === 'period') return;

        if (!this.filters.has(type)) {
            this.filters.set(type, new Set());
        }

        const filterSet = this.filters.get(type);
        if (filterSet.has(value)) {
            filterSet.delete(value);
        } else {
            filterSet.add(value);
        }

        if (filterSet.size === 0) {
            this.filters.delete(type);
        }

        console.debug('Filtros após toggle:', this.getActiveFilters());

        this.updateUI();
        this.notifyFilterChange();
    }

    updateUI() {
        if (!this.filterContainer) return;
        
        this.filterContainer.innerHTML = '';
        let totalFiltros = 0;
        
        // Sempre mostra o filtro de período
        const periodFilter = this.createPeriodFilterItem();
        this.filterContainer.appendChild(periodFilter);
        totalFiltros++;
        
        this.filters.forEach((values, type) => {
            values.forEach(value => {
                totalFiltros++;
                const filterItem = this.createFilterItem(type, value);
                this.filterContainer.appendChild(filterItem);
            });
        });

        if (totalFiltros > 1) { // > 1 porque o período sempre está presente
            const clearBtn = document.createElement('button');
            clearBtn.className = 'btn btn-sm btn-outline-secondary ms-2';
            clearBtn.innerHTML = '<i class="fas fa-times me-1"></i>Limpar Filtros';
            clearBtn.onclick = () => this.clearFilters();
            this.filterContainer.appendChild(clearBtn);
        }

        console.debug('UI atualizada, total de filtros:', totalFiltros);
    }

    createPeriodFilterItem() {
        const item = document.createElement('div');
        item.className = 'filter-item period-filter-item';
        
        const label = document.createElement('span');
        label.className = 'filter-label';
        label.textContent = `Período: ${this.data_ini.toLocaleDateString('pt-BR')} até ${this.data_fim.toLocaleDateString('pt-BR')}`;
        
        item.appendChild(label);
        return item;
    }

    createFilterItem(type, value) {
        const item = document.createElement('div');
        item.className = 'filter-item';
        
        const label = document.createElement('span');
        label.className = 'filter-label';
        label.textContent = `${this.getFilterLabel(type)}: ${value}`;
        
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-filter';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleFilter(type, value);
        };

        item.appendChild(label);
        item.appendChild(removeBtn);
        return item;
    }

    getFilterLabel(type) {
        const labels = {
            status: 'Status',
            tipo: 'Tipo',
            funcionario: 'Funcionário',
            cliente: 'Cliente',
            sistema: 'Sistema',
            canal: 'Canal',
            relato: 'Relato',
            solicitacao: 'Solicitação',
            relatosDetalhados: 'Relatos Detalhados' // Adicionado o novo label
        };
        return labels[type] || type;
    }

    getActiveFilters() {
        // Sempre inclui o período nos filtros ativos
        const activeFilters = {
            period: {
                start: this.data_ini.getTime(),
                end: this.data_fim.getTime()
            }
        };
        
        this.filters.forEach((values, type) => {
            if (values instanceof Set) {
                activeFilters[type] = Array.from(values);
            }
        });

        console.debug('Filtros ativos:', activeFilters);
        return activeFilters;
    }

    notifyFilterChange() {
        const filters = this.getActiveFilters();
        console.debug('Notificando mudança de filtros:', filters);
        
        document.dispatchEvent(new CustomEvent('filterChange', {
            detail: filters
        }));
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

    clearFilters() {
        console.debug('Limpando filtros (exceto período)');
        this.filters.clear();
        this.updateUI();
        this.notifyFilterChange();
    }
}