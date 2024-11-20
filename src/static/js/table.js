class TableManager {
    constructor() {
        this.table = document.getElementById('tableBody');
        this.pagination = document.getElementById('pagination');
        this.itemsPerPage = 10;
        this.currentPage = 1;
        this.timezone = 'America/Sao_Paulo';
        
        if (!this.table) {
            console.error('Elemento da tabela não encontrado. ID esperado: tableBody');
            return;
        }

        console.info('TableManager inicializado com sucesso');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.table.addEventListener('click', (e) => {
            if (e.target.classList.contains('description-toggle')) {
                const content = e.target.previousElementSibling;
                content.classList.toggle('expanded');
                e.target.textContent = content.classList.contains('expanded') ? 'Ver menos' : 'Ver mais';
            }
        });

        document.addEventListener('pageChange', () => {
            console.debug('Evento pageChange recebido');
            const data = window.dashboardManager?.dataManager?.data?.registros || [];
            this.updateTable(data);
        });

        document.addEventListener('dashboardUpdate', (event) => {
            console.debug('Evento dashboardUpdate recebido');
            if (event.detail && Array.isArray(event.detail.registros)) {
                this.updateTable(event.detail.registros);
            }
        });
    }

    formatDateTime(dateStr) {
        if (!dateStr) return { date: 'N/A', time: '' };
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return { date: 'Data inválida', time: '' };

            return {
                date: date.toLocaleDateString('pt-BR', {
                    timeZone: this.timezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }),
                time: date.toLocaleTimeString('pt-BR', {
                    timeZone: this.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            };
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return { date: 'Data inválida', time: '' };
        }
    }

    getStatusClass(status) {
        const classes = {
            'Concluído': 'status-concluido',
            'Pendente': 'status-pendente',
            'Cancelado': 'status-cancelado',
            'Em Andamento': 'status-em-andamento'
        };
        return classes[status] || '';
    }

    updateTable(data) {
        if (!this.table || !Array.isArray(data)) {
            console.error('Falha ao atualizar tabela:', {
                tableExists: !!this.table,
                dataIsArray: Array.isArray(data)
            });
            return;
        }
        
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = data.slice(start, end);

        try {
            this.table.innerHTML = pageData.map(item => {
                const datetime = this.formatDateTime(item.data_hora);
                const statusClass = this.getStatusClass(item.status_atendimento);

                return `
                    <tr>
                        <td class="datetime-cell">
                            <span class="date">${datetime.date}</span>
                            <span class="time">${datetime.time}</span>
                        </td>
                        <td class="entity-cell">
                            <span class="entity-name">${item.cliente || 'N/A'}</span>
                            <span class="entity-detail">${item.solicitante || 'Não informado'}</span>
                        </td>
                        <td class="entity-cell">
                            <span class="entity-name">${item.funcionario || 'N/A'}</span>
                        </td>
                        <td>
                            <span class="status-badge ${statusClass}">
                                ${item.status_atendimento || 'N/A'}
                            </span>
                        </td>
                        <td>${item.tipo_atendimento || 'N/A'}</td>
                        <td>${item.sistema || 'N/A'}</td>
                        <td>${item.canal_atendimento || 'N/A'}</td>
                        <td class="description-cell">
                            <div class="description-content">
                                ${item.descricao_atendimento || 'Sem descrição'}
                            </div>
                            <span class="description-toggle">Ver mais</span>
                        </td>
                    </tr>
                `;
            }).join('');

            this.updatePagination(data.length);
        } catch (error) {
            console.error('Erro ao renderizar tabela:', error);
        }
    }

    updatePagination(totalItems) {
        if (!this.pagination) return;

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pages = this.getPaginationRange(this.currentPage, totalPages);

        this.pagination.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="pagination-info">
                    Mostrando ${Math.min(totalItems, 1)}-${Math.min(this.itemsPerPage * this.currentPage, totalItems)} 
                    de ${totalItems} registros
                </div>
                <ul class="pagination mb-0">
                    ${this.currentPage > 1 ? `
                        <li class="page-item">
                            <a class="page-link" href="#" data-page="prev">
                                <i class="fas fa-chevron-left"></i>
                            </a>
                        </li>
                    ` : ''}
                    
                    ${pages.map(page => `
                        <li class="page-item ${page === this.currentPage ? 'active' : ''}">
                            <a class="page-link" href="#" data-page="${page}">
                                ${page === '...' ? page : page}
                            </a>
                        </li>
                    `).join('')}
                    
                    ${this.currentPage < totalPages ? `
                        <li class="page-item">
                            <a class="page-link" href="#" data-page="next">
                                <i class="fas fa-chevron-right"></i>
                            </a>
                        </li>
                    ` : ''}
                </ul>
            </div>
        `;

        this.setupPaginationListeners(totalPages);
    }

    getPaginationRange(current, total) {
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        if (current <= 3) {
            return [1, 2, 3, 4, '...', total];
        }

        if (current >= total - 2) {
            return [1, '...', total - 3, total - 2, total - 1, total];
        }

        return [1, '...', current - 1, current, current + 1, '...', total];
    }

    setupPaginationListeners(totalPages) {
        this.pagination.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.closest('.page-link');
            if (!target) return;

            const page = target.dataset.page;
            
            if (page === 'prev') {
                this.currentPage = Math.max(1, this.currentPage - 1);
            } else if (page === 'next') {
                this.currentPage = Math.min(totalPages, this.currentPage + 1);
            } else if (page !== '...') {
                this.currentPage = parseInt(page);
            }

            document.dispatchEvent(new CustomEvent('pageChange'));
        });
    }
}