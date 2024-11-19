class FilterManager {
    constructor() {
        console.info('Inicializando FilterManager');
        this.filters = new Map();
        this.filterContainer = document.getElementById('activeFilters');
        
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

        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');

        if (startDate && endDate) {
            startDate.addEventListener('change', () => this.handleDateChange());
            endDate.addEventListener('change', () => this.handleDateChange());
        }
    }

    handleDateChange() {
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');

        if (startDate && endDate && startDate.value && endDate.value) {
            if (this.validateDates(startDate.value, endDate.value)) {
                this.toggleFilter('period', {
                    start: this.getDateWithMinTime(startDate.value),
                    end: this.getDateWithMaxTime(endDate.value)
                });
            }
        }
    }

    getDateWithMinTime(dateStr) {
        // Cria data com horário inicial do dia (00:00:00)
        const date = new Date(dateStr + 'T00:00:00-03:00'); // GMT-3 (Brasília)
        return date.toISOString();
    }

    getDateWithMaxTime(dateStr) {
        // Cria data com horário final do dia (23:59:59)
        const date = new Date(dateStr + 'T23:59:59-03:00'); // GMT-3 (Brasília)
        return date.toISOString();
    }

    initializeDateFields() {
        try {
            const brasiliaOffset = -180; // GMT-3 em minutos
            const now = new Date();
            const brasiliaTime = new Date(now.getTime() + (now.getTimezoneOffset() + brasiliaOffset) * 60000);
            const firstDayOfMonth = new Date(brasiliaTime.getFullYear(), brasiliaTime.getMonth(), 1);
            
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');
            
            if (!startDateInput || !endDateInput) {
                console.error('Campos de data não encontrados');
                return;
            }
            
            startDateInput.value = this.formatDateForInput(firstDayOfMonth);
            endDateInput.value = this.formatDateForInput(brasiliaTime);
            
            this.toggleFilter('period', {
                start: this.getDateWithMinTime(startDateInput.value),
                end: this.getDateWithMaxTime(endDateInput.value)
            });
            
            console.debug('Campos de data inicializados:', {
                start: startDateInput.value,
                end: endDateInput.value
            });
        } catch (error) {
            console.error('Erro ao inicializar campos de data:', error);
        }
    }

    formatDateForInput(date) {
        try {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Erro ao formatar data para input:', error);
            return '';
        }
    }

    formatDateForDisplay(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR', {
                timeZone: 'America/Sao_Paulo'
            });
        } catch (error) {
            console.error('Erro ao formatar data para exibição:', error);
            return dateStr;
        }
    }

    validateDates(startDate, endDate) {
        try {
            const start = new Date(startDate + 'T00:00:00-03:00');
            const end = new Date(endDate + 'T23:59:59-03:00');

            // Ajustando a data de hoje para o fuso horário de Brasília (GMT-3)
            const now = new Date();
            const brasiliaOffset = -180; // GMT-3 em minutos
            const today = new Date(now.getTime() + (now.getTimezoneOffset() + brasiliaOffset) * 60000);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                this.showError('Data inválida');
                return false;
            }

            if (start > end) {
                this.showError('Data inicial não pode ser maior que a data final');
                return false;
            }

            if (start > today || end > today) {
                this.showError('Não é possível selecionar datas futuras');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erro ao validar datas:', error);
            return false;
        }
    }

    toggleFilter(type, value) {
        console.debug(`Alternando filtro: ${type} = ${JSON.stringify(value)}`);

        if (type === 'period') {
            this.filters.set(type, value);
        } else {
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
        }

        this.updateUI();
        this.notifyFilterChange();
    }

    updateUI() {
        this.filterContainer.innerHTML = '';
        let totalFiltros = 0;
        
        const periodFilter = this.filters.get('period');
        if (periodFilter) {
            totalFiltros++;
            const filterItem = this.createPeriodFilterItem(periodFilter);
            this.filterContainer.appendChild(filterItem);
        }
        
        this.filters.forEach((values, type) => {
            if (type !== 'period') {
                values.forEach(value => {
                    totalFiltros++;
                    const filterItem = this.createFilterItem(type, value);
                    this.filterContainer.appendChild(filterItem);
                });
            }
        });

        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn btn-sm btn-outline-secondary ms-2';
        clearBtn.innerHTML = '<i class="fas fa-times me-1"></i>Limpar Filtros';
        clearBtn.onclick = () => this.clearFilters();
        this.filterContainer.appendChild(clearBtn);

        if (totalFiltros === 0) {
            const noFilters = document.createElement('div');
            noFilters.className = 'no-filters';
            noFilters.textContent = 'Nenhum filtro aplicado';
            this.filterContainer.appendChild(noFilters);
            this.initializeDateFields();
        }
    }

    createPeriodFilterItem(period) {
        const item = document.createElement('div');
        item.className = 'filter-item period-filter-item';
        
        const label = document.createElement('span');
        label.className = 'filter-label';
        
        const startDate = this.formatDateForDisplay(period.start);
        const endDate = this.formatDateForDisplay(period.end);
        label.textContent = `Período: ${startDate} até ${endDate}`;
        
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-filter';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            this.initializeDateFields();
        };

        item.appendChild(label);
        item.appendChild(removeBtn);
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
            period: 'Período'
        };
        return labels[type] || type;
    }

    notifyFilterChange() {
        const activeFilters = this.getActiveFilters();
        document.dispatchEvent(new CustomEvent('filterChange', {
            detail: activeFilters
        }));
    }

    getActiveFilters() {
        const activeFilters = {};
        this.filters.forEach((values, type) => {
            if (type === 'period') {
                activeFilters.period = values;
            } else {
                activeFilters[type] = Array.from(values);
            }
        });
        return activeFilters;
    }

    showError(message) {
        console.error(message);
        alert(message);
    }

    clearFilters() {
        console.debug('Limpando todos os filtros');
        this.filters.clear();
        this.initializeDateFields();
        this.updateUI();
        this.notifyFilterChange();
    }
}
