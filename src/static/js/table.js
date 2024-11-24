class TableManager {
    constructor() {
        this.table = document.getElementById('tableBody');
        this.pagination = document.getElementById('pagination');
        this.itemsPerPage = 10;
        this.currentPage = 1;
        
        if (!this.table) {
            console.error('Elemento da tabela não encontrado. ID esperado: tableBody');
            return;
        }

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
            const data = window.dashboardManager?.dataManager?.data?.registros || [];
            this.updateTable(data);
        });

        document.addEventListener('dashboardUpdate', (event) => {
            if (event.detail && Array.isArray(event.detail.registros)) {
                this.updateTable(event.detail.registros);
            }
        });
    }

    formatDateTime(data_hora_raw) {
        if (!data_hora_raw) return { date: 'N/A', time: '' };
        
        try {
            const timestamp = typeof data_hora_raw === 'string' ? 
                parseInt(data_hora_raw, 10) : data_hora_raw;
            
            if (isNaN(timestamp)) {
                return { date: 'Data inválida', time: '' };
            }

            const date = new Date(timestamp);
            
            if (isNaN(date.getTime())) {
                return { date: 'Data inválida', time: '' };
            }

            return {
                date: date.toLocaleDateString('pt-BR'),
                time: date.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                })
            };
        } catch (error) {
            console.error('Erro ao formatar data_hora:', data_hora_raw, error);
            return { date: 'Erro', time: '' };
        }
    }

    updateTable(data) {
        if (!this.table || !Array.isArray(data)) {
            if (!this.table) {
                console.error('Elemento da tabela não encontrado');
            }
            if (this.table) {
                this.table.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            Nenhum registro encontrado
                        </td>
                    </tr>
                `;
            }
            this.updatePagination(0);
            return;
        }
        
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = data.slice(start, end);

        try {
            this.table.innerHTML = pageData.length ? pageData.map(item => {
                const datetime = this.formatDateTime(item.data_hora);
                const statusClass = this.getStatusClass(item.status_atendimento);
                const descricao = item.descricao_atendimento || item.solicitacao_cliente || 'Sem descrição';

                return `
                    <tr>
                        <td class="datetime-cell">
                            <span class="date">${datetime.date}</span>
                            <span class="time">${datetime.time}</span>
                        </td>
                        <td class="entity-cell">
                            <span class="entity-name">${this.sanitizeText(item.cliente)}</span>
                            <span class="entity-detail">${this.sanitizeText(item.solicitante)}</span>
                        </td>
                        <td class="entity-cell">
                            <span class="entity-name">${this.sanitizeText(item.funcionario)}</span>
                        </td>
                        <td>
                            <span class="status-badge ${statusClass}">
                                ${this.sanitizeText(item.status_atendimento)}
                            </span>
                        </td>
                        <td>${this.sanitizeText(item.tipo_atendimento)}</td>
                        <td>${this.sanitizeText(item.sistema)}</td>
                        <td>${this.sanitizeText(item.canal_atendimento)}</td>
                        <td class="description-cell">
                            <div class="description-content">
                                ${this.sanitizeText(descricao)}
                            </div>
                            <span class="description-toggle">Ver mais</span>
                        </td>
                    </tr>
                `;
            }).join('') : `
                <tr>
                    <td colspan="8" class="text-center">
                        Nenhum registro encontrado
                    </td>
                </tr>
            `;

            this.updatePagination(data.length);
        } catch (error) {
            console.error('Erro ao renderizar tabela:', error);
            this.showError('Erro ao atualizar tabela de dados');
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

    sanitizeText(text) {
        if (text === null || text === undefined) return 'N/A';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    updatePagination(totalItems) {
        if (!this.pagination) return;

        if (totalItems === 0) {
            this.pagination.innerHTML = '';
            return;
        }

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
