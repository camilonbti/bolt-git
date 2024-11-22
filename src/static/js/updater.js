class DashboardUpdater {
    constructor() {
        console.info('Inicializando DashboardUpdater');
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
        if (this.isUpdating) {
            console.debug('Atualização já em andamento');
            return;
        }
        
        try {
            this.isUpdating = true;
            const updateButton = document.querySelector('.btn-update');
            if (updateButton) {
                updateButton.disabled = true;
                updateButton.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Atualizando...';
            }

            console.debug('Iniciando requisição de atualização');
            const response = await fetch('/api/data');
            if (!response.ok) {
                throw new Error(`Erro ao atualizar dados: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (!data || !data.registros) {
                throw new Error('Dados inválidos recebidos do servidor');
            }

            // Processa timestamps usando DateUtils
            data.registros = data.registros.map(registro => ({
                ...registro,
                data_hora: DateUtils.formatTimestamp(registro.data_hora)
            }));

            // Atualiza timestamp de última atualização
            data.ultima_atualizacao = DateUtils.formatTimestamp(new Date());

            console.info('Dados atualizados com sucesso:', {
                registros: data.registros.length,
                timestamp: DateUtils.formatDateTime(new Date())
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
