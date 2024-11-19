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
        // Listener para cliques nos gráficos
        document.addEventListener('chartClick', (event) => {
            console.debug('Clique no gráfico:', event.detail);
            this.toggleFilter(event.detail.type, event.detail.value);
        });

        // Listener para mudanças nos campos de data
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
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    }

    getDateWithMaxTime(dateStr) {
        const date = new Date(dateStr);
        date.setHours(23, 59, 59, 999);
        return date.toISOString();
    }

    initializeDateFields() {
        try {
            const today = new Date();
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');
            
            if (!startDateInput || !endDateInput) {
                console.error('Campos de data não encontrados');
                return;
            }
            
            startDateInput.value = this.formatDateForInput(firstDayOfMonth);
            endDateInput.value = this.formatDateForInput(today);
            
            // Aplica o filtro inicial de período
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
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error('Erro ao formatar data para input:', error);
            return '';
        }
    }

    formatDateForDisplay(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            console.error('Erro ao formatar data para exibição:', error);
            return dateStr;
        }
    }

    validateDates(startDate, endDate) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const today = new Date();
            today.setHours(23, 59, 59, 999);

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
            // Para período, sempre substituímos o valor atual
            this.filters.set(type, value);
        } else {
            // Para outros filtros, alternamos a presença do valor
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

    clearFilters() {
        console.debug('Limpando todos os filtros');
        this.filters.clear();
        this.initializeDateFields(); // Reaplica o filtro de período padrão
        this.updateUI();
        this.notifyFilterChange();
    }

    updateUI() {
        this.filterContainer.innerHTML = '';
        let totalFiltros = 0;
        
        // Primeiro, adiciona o filtro de período se existir
        const periodFilter = this.filters.get('period');
        if (periodFilter) {
            totalFiltros++;
            const filterItem = this.createPeriodFilterItem(periodFilter);
            this.filterContainer.appendChild(filterItem);
        }
        
        // Depois, adiciona os demais filtros
        this.filters.forEach((values, type) => {
            if (type !== 'period') {
                values.forEach(value => {
                    totalFiltros++;
                    const filterItem = this.createFilterItem(type, value);
                    this.filterContainer.appendChild(filterItem);
                });
            }
        });

        // Adiciona o botão de limpar filtros
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
            this.initializeDateFields(); // Reaplica o filtro de período padrão
        }

        console.info(`Total de filtros ativos: ${totalFiltros}`);
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
            this.initializeDateFields(); // Reaplica o filtro de período padrão
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
        // TODO: Implementar um sistema de notificação mais elegante
        alert(message);
    }
}