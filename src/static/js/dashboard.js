class DashboardManager {
    constructor() {
        console.info('Inicializando DashboardManager');
        this.timezone = 'America/Sao_Paulo';

        // Garantir que applyFilters está vinculado ao contexto da classe
        this.applyFilters = this.applyFilters.bind(this);

        this.initializeComponents();
    }

    async initializeComponents() {
        try {
            this.dataManager = new DashboardDataManager(); // Gerenciador de dados
            const initialData = await this.dataManager.loadInitialData();
            if (!initialData) {
                throw new Error('Falha ao carregar dados iniciais');
            }

            this.chartManager = new ChartManager(initialData.graficos);
            this.tableManager = new TableManager();
            this.filterManager = new FilterManager();
            this.updater = new DashboardUpdater();

            this.setupEventListeners();

            console.debug('Componentes inicializados com sucesso');
            this.updateDashboard(initialData);
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
        if (!data) {
            console.error('Dados inválidos para atualização');
            return;
        }

        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            dashboardContent.classList.remove('d-none');
        } else {
            console.warn('Elemento #dashboardContent não encontrado');
        }

        const totalAtendimentosElem = document.getElementById('totalAtendimentos');
        const totalPendentesElem = document.getElementById('totalPendentes');
        const totalConcluidosElem = document.getElementById('totalConcluidos');
        const taxaConclusaoElem = document.getElementById('taxaConclusao');

        console.debug('Verificando elementos dos KPIs:', {
            totalAtendimentosElem,
            totalPendentesElem,
            totalConcluidosElem,
            taxaConclusaoElem
        });

        if (totalAtendimentosElem) totalAtendimentosElem.innerText = data.kpis.total_registros || 0;
        if (totalPendentesElem) totalPendentesElem.innerText = data.kpis.total_pendentes || 0;
        if (totalConcluidosElem) totalConcluidosElem.innerText = data.kpis.total_concluidos || 0;
        if (taxaConclusaoElem) taxaConclusaoElem.innerText = `${data.kpis.taxa_conclusao || 0}%`;

        this.updateKPIs(data.kpis || {});
        if (this.chartManager) this.chartManager.updateCharts(data.graficos || {});
        if (this.tableManager) this.tableManager.updateTable(data.registros || []);
        this.updateTimestamp(data.ultima_atualizacao);
    }

    updateKPIs(kpis) {
        const elements = {
            totalAtendimentos: document.getElementById('totalAtendimentos'),
            totalPendentes: document.getElementById('totalPendentes'),
            totalConcluidos: document.getElementById('totalConcluidos'),
            taxaConclusao: document.getElementById('taxaConclusao')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (!element) {
                console.warn(`Elemento ${key} não encontrado no DOM`);
                return;
            }

            const value = kpis[key.toLowerCase()] || 0;
            const formattedValue = key === 'taxaConclusao'
                ? `${this.formatNumber(value, 1)}%`
                : this.formatNumber(value);

            const currentValue = parseInt(element.textContent.replace(/[^0-9.-]+/g, '')) || 0;
            this.animateValue(element, currentValue, value);
        });
    }

    animateValue(element, start, end) {
        if (!element) return;

        const duration = 500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOutQuad = progress * (2 - progress);
            const current = Math.round(start + (end - start) * easeOutQuad);

            element.textContent = `${current}`;
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    updateTimestamp(timestamp) {
        const element = document.getElementById('lastUpdate');
        if (element && timestamp) {
            const date = new Date(parseInt(timestamp));
            const options = { timeZone: this.timezone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
            element.textContent = date.toLocaleString('pt-BR', options);
        } else {
            console.warn('Elemento ou timestamp inválido ao atualizar');
        }
    }

    formatNumber(value, decimals = 0) {
        return Number(value).toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    }

    showError(message) {
        const errorAlert = document.getElementById('updateError');
        if (errorAlert) {
            errorAlert.textContent = message;
            errorAlert.classList.remove('d-none');
            setTimeout(() => errorAlert.classList.add('d-none'), 5000);
        }
    }

    applyFilters(filters) {
        if (!filters) {
            console.error('Filtros inválidos');
            return;
        }

        console.debug('Aplicando filtros:', filters);

        const filteredData = this.dataManager.data.registros.filter((registro) => {
            let passaFiltro = true;

            if (filters.dataInicio && filters.dataFim) {
                const dataRegistro = new Date(registro.data);
                passaFiltro = passaFiltro && dataRegistro >= new Date(filters.dataInicio) && dataRegistro <= new Date(filters.dataFim);
            }

            if (filters.status && filters.status.length > 0) {
                passaFiltro = passaFiltro && filters.status.includes(registro.status_atendimento);
            }

            return passaFiltro;
        });

        console.debug('Dados filtrados:', filteredData.length, filteredData);

        const updatedData = {
            registros: filteredData,
            kpis: this.calculateKPIs(filteredData),
            graficos: this.calculateCharts(filteredData),
            ultima_atualizacao: Date.now(),
        };

        this.updateDashboard(updatedData);
    }

    calculateKPIs(data) {
        if (!data || data.length === 0) {
            console.warn('Nenhum dado para cálculo de KPIs');
            return {
                total_registros: 0,
                total_pendentes: 0,
                total_concluidos: 0,
                taxa_conclusao: 0,
            };
        }

        const totalRegistros = data.length;
        const totalPendentes = data.filter((registro) => registro.status_atendimento === 'Pendente').length;
        const totalConcluidos = data.filter((registro) => registro.status_atendimento === 'Concluído').length;
        const taxaConclusao = (totalConcluidos / totalRegistros) * 100;

        console.debug('KPIs calculados:', {
            total_registros: totalRegistros,
            total_pendentes: totalPendentes,
            total_concluidos: totalConcluidos,
            taxa_conclusao: taxaConclusao,
        });

        return {
            total_registros: totalRegistros,
            total_pendentes: totalPendentes,
            total_concluidos: totalConcluidos,
            taxa_conclusao: taxaConclusao.toFixed(1),
        };
    }

    calculateCharts(data) {
        if (!data || data.length === 0) {
            console.warn('Nenhum dado para cálculo de gráficos');
            return {};
        }

        const tiposAtendimento = data.reduce((acc, registro) => {
            const tipo = registro.tipo_atendimento || 'Não informado';
            acc[tipo] = (acc[tipo] || 0) + 1;
            return acc;
        }, {});

        const statusAtendimento = data.reduce((acc, registro) => {
            const status = registro.status_atendimento || 'Não informado';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        console.debug('Gráficos calculados:', { tiposAtendimento, statusAtendimento });

        return {
            tiposAtendimento,
            statusAtendimento,
        };
    }
}