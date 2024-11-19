class DashboardUpdater {
    constructor(updateInterval) {
        this.updateInterval = updateInterval * 1000; // Converte para milissegundos
        this.timer = null;
        this.lastUpdate = null;
        
        this.initializeUpdater();
        this.setupEventListeners();
    }
    
    initializeUpdater() {
        this.updateTimer();
        this.startUpdateTimer();
    }
    
    setupEventListeners() {
        document.querySelector('.btn-update').addEventListener('click', () => {
            this.updateDashboard();
        });
    }
    
    startUpdateTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            this.updateDashboard();
        }, this.updateInterval);
    }
    
    updateTimer() {
        const nextUpdateElement = document.getElementById('nextUpdate');
        if (!nextUpdateElement) return;
        
        let timeLeft = this.updateInterval / 1000;
        
        const updateTimerDisplay = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            nextUpdateElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft > 0) {
                timeLeft--;
            }
        };
        
        updateTimerDisplay();
        setInterval(updateTimerDisplay, 1000);
    }
    
    async updateDashboard() {
        try {
            const response = await fetch('/api/dashboard/data');
            const data = await response.json();
            
            if (response.ok) {
                this.updateDashboardData(data);
                this.showUpdateSuccess();
            } else {
                throw new Error(data.message || 'Erro ao atualizar dados');
            }
        } catch (error) {
            this.showUpdateError(error.message);
        }
    }
    
    updateDashboardData(data) {
        // Atualiza KPIs
        document.getElementById('totalAtendimentos').textContent = data.kpis.total_registros;
        document.getElementById('taxaConclusao').textContent = `${data.kpis.taxa_conclusao.toFixed(1)}%`;
        document.getElementById('tempoMedio').textContent = `${Math.round(data.kpis.tempo_medio_atendimento)} min`;
        document.getElementById('totalPendentes').textContent = data.kpis.total_pendentes;
        
        // Atualiza informações de atualização
        document.getElementById('lastUpdate').textContent = data.last_update;
        document.getElementById('totalRecords').textContent = data.dados.length;
        
        // Atualiza gráficos
        window.dashboardManager.updateCharts(data.graficos);
        
        // Reinicia timer
        this.startUpdateTimer();
    }
    
    showUpdateSuccess() {
        const successAlert = document.getElementById('updateSuccess');
        successAlert.classList.remove('d-none');
        setTimeout(() => {
            successAlert.classList.add('d-none');
        }, 3000);
    }
    
    showUpdateError(message) {
        const errorAlert = document.getElementById('updateError');
        const errorMessage = errorAlert.querySelector('.error-message');
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
        setTimeout(() => {
            errorAlert.classList.add('d-none');
        }, 5000);
    }
}

// Inicializa o atualizador quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const updateInterval = parseInt(document.getElementById('nextUpdate').dataset.interval) || 300;
    window.dashboardUpdater = new DashboardUpdater(updateInterval);
});