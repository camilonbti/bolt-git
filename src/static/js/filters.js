class FilterManager {
    constructor() {
        console.info('Inicializando FilterManager');
        this.filters = new Map();
        this.filterContainer = document.getElementById('activeFilters');
        this.filterCache = new Map();
        this.lastFilterHash = '';
        
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

        if (!this.filterContainer) {
            console.error('Elemento activeFilters não encontrado');
            return;
        }
        
        this.setupEventListeners();
        this.initializeDateFields();
    }

    setupEventListeners() {
        document.addEventListener('chartClick', (event) => {
            this.toggleFilter(event.detail.type, event.detail.value);
        });

        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');

        if (startDateInput && endDateInput) {
            startDateInput.addEventListener('change', () => this.handleDateChange());
            endDateInput.addEventListener('change', () => this.handleDateChange());
        }

        document.addEventListener('dashboardUpdate', (event) => {
            if (event.detail && event.detail.registros) {
                this.applyInitialPeriodFilter();
            }
        });
    }

    generateFilterHash(filters) {
        const sortedFilters = Object.entries(filters)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
            .join('|');
        return btoa(sortedFilters);
    }

    applyInitialPeriodFilter() {
        const filters = this.getActiveFilters();
        const filterHash = this.generateFilterHash(filters);

        if (filterHash === this.lastFilterHash) {
            return;
        }

        this.lastFilterHash = filterHash;
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
            const startDate = new Date(startDateInput.value + 'T00:00:00-03:00');
            const endDate = new Date(endDateInput.value + 'T23:59:59-03:00');
            
            this.data_ini = startDate;
            this.data_fim = endDate;

            if (!this.validateDates()) {
                return;
            }

            const filters = this.getActiveFilters();
            const filterHash = this.generateFilterHash(filters);

            if (filterHash === this.lastFilterHash) {
                return;
            }

            this.lastFilterHash = filterHash;
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
            
            startDateInput.value = this.formatDateForInput(this.data_ini);
            endDateInput.value = this.formatDateForInput(this.data_fim);
            
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

        const filters = this.getActiveFilters();
        const filterHash = this.generateFilterHash(filters);

        if (filterHash === this.lastFilterHash) {
            return;
        }

        this.lastFilterHash = filterHash;
        this.updateUI();
        this.notifyFilterChange();
    }

    updateUI() {
        if (!this.filterContainer) return;
        
        this.filterContainer.innerHTML = '';
        let totalFiltros = 0;
        
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

        if (totalFiltros > 1) {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'btn btn-sm btn-outline-secondary ms-2';
            clearBtn.innerHTML = '<i class="fas fa-times me-1"></i>Limpar Filtros';
            clearBtn.onclick = () => this.clearFilters();
            this.filterContainer.appendChild(clearBtn);
        }
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
            solicitacao: 'Solicitação'
        };
        return labels[type] || type;
    }

    getActiveFilters() {
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

        return activeFilters;
    }

    notifyFilterChange() {
        const filters = this.getActiveFilters();
        
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
        this.filters.clear();
        const filters = this.getActiveFilters();
        const filterHash = this.generateFilterHash(filters);

        if (filterHash === this.lastFilterHash) {
            return;
        }

        this.lastFilterHash = filterHash;
        this.updateUI();
        this.notifyFilterChange();
    }
}