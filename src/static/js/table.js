class TableManager {
    constructor() {
        this.table = document.getElementById('tableBody');
        this.pagination = document.getElementById('pagination');
        this.itemsPerPage = 10;
        this.currentPage = 1;
        
        if (!this.table) {
            console.warn('Elemento tableBody não encontrado');
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Delegação de eventos para descrições expandíveis
        this.table.addEventListener('click', (e) => {
            if (e.target.classList.contains('description-toggle')) {
                const content = e.target.previousElementSibling;
                content.classList.toggle('expanded');
                e.target.textContent = content.classList.contains('expanded') ? 'Ver menos' : 'Ver mais';
            }
        });
    }

    formatDate(dateStr) {
        if (!dateStr) return { date: 'N/A', time: '' };
        try {
            const date = new Date(dateStr);
            return {
                date: date.toLocaleDateString('pt-BR'),
                time: date.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })
            };
        } catch (e) {
            console.error('Erro ao formatar data:', e);
            return { date: 'Data inválida', time: '' };
        }
    }

    formatDuration(startTime, endTime) {
        if (!startTime || !endTime) return 'N/A';
        try {
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            const durationMin = (endHour * 60 + endMin) - (startHour * 60 + startMin);
            return durationMin > 0 ? `${durationMin} min` : 'N/A';
        } catch (e) {
            console.error('Erro ao calcular duração:', e);
            return 'N/A';
        }
    }

    getStatusClass(status) {
        const classes = {
            'Concluído': 'status-concluido',
            'Pendente': 'status-pendente',
            'Cancelado': 'status-cancelado'
        };
        return classes[status] || '';
    }

    updateTable(data) {
        if (!this.table || !Array.isArray(data)) {
            console.warn('Dados inválidos ou elemento da tabela não encontrado');
            return;
        }
        
        console.log('Atualizando tabela com', data.length, 'registros');
        
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageData = data.slice(start, end);

        this.table.innerHTML = pageData.map(item => {
            const datetime = this.formatDate(item.data_hora);
            const duration = this.formatDuration(item.start_time, item.end_time);
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
                    <td class="duration-cell">${duration}</td>
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

        return [
            1,
            '...',
            current - 1,
            current,
            current + 1,
            '...',
            total
        ];
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