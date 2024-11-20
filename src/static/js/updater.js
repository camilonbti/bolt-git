class DashboardUpdater {
    constructor() {
        this.setupEventListeners();
        this.isUpdating = false;
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