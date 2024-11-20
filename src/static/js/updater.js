class DashboardUpdater {
    constructor() {
        this.setupEventListeners();
        this.isUpdating = false;
        this.timezone = 'America/Sao_Paulo';
    }
    
    setupEventListeners() {
        const updateButton = document.querySelector('.btn-update');
        if (updateButton) {
            updateButton.addEventListener('click', () => this.updateDashboard());
        }
    }
    
    async updateDashboard() {
        if (this.isUpdating) return;
        
        try {
            this.isUpdating = true;
            const updateButton = document.querySelector('.btn-update');
            if (updateButton) {
                updateButton.disabled = true;
                updateButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Atualizando...';
            }

            const response = await fetch('/api/data');
            if (!response.ok) {
                throw new Error(`Erro ao atualizar dados: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (!data || !data.registros) {
                throw new Error('Dados inválidos recebidos do servidor');
            }

            // Formata datas considerando timezone
            data.registros = data.registros.map(registro => ({
                ...registro,
                data_hora: this.formatDateTime(registro.data_hora)
            }));

            // Atualiza timestamp de última atualização
            data.ultima_atualizacao = new Date().toLocaleString('pt-BR', {
                timeZone: this.timezone,
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            window.dashboardManager?.dataManager?.update(data);
            this.showUpdateSuccess();
            
        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
            this.showUpdateError(error.message);
        } finally {
            this.isUpdating = false;
            const updateButton = document.querySelector('.btn-update');
            if (updateButton) {
                updateButton.disabled = false;
                updateButton.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar';
            }
        }
    }

    formatDateTime(dateStr) {
        if (!dateStr) return null;
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return null;

            // Formata considerando timezone
            return date.toLocaleString('pt-BR', {
                timeZone: this.timezone,
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return null;
        }
    }
    
    showUpdateSuccess() {
        const successAlert = document.getElementById('updateSuccess');
        if (successAlert) {
            successAlert.classList.remove('d-none');
            setTimeout(() => {
                successAlert.classList.add('d-none');
            }, 3000);
        }
    }
    
    showUpdateError(message) {
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
