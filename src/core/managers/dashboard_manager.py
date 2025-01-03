"""
Gerenciador principal do dashboard
"""
from typing import Dict, List, Any
import logging
from ..logger import log_manager
from ..calculators.kpi_calculator import KPICalculator
from ..calculators.chart_calculator import ChartCalculator
from ...utils.formatters import Formatters
from datetime import datetime

logger = log_manager.get_logger(__name__)

class DashboardManager:
    def __init__(self):
        """Inicializa o gerenciador do dashboard."""
        self.kpi_calculator = KPICalculator()
        self.chart_calculator = ChartCalculator()

    def process_dashboard_data(self, data: List[Dict]) -> Dict[str, Any]:
        """Processa dados para o dashboard."""
        try:
            if not data:
                logger.warning("Dados vazios recebidos")
                return self._get_empty_dashboard()

            return {
                'kpis': self.kpi_calculator.calculate(data),
                'graficos': self.chart_calculator.calculate(data),
                'registros': data,
                'ultima_atualizacao': Formatters.format_datetime(datetime.now())
            }

        except Exception as e:
            logger.error(f"Erro ao processar dados do dashboard: {str(e)}")
            return self._get_empty_dashboard()

    def _get_empty_dashboard(self) -> Dict[str, Any]:
        """Retorna estrutura vazia do dashboard."""
        return {
            'kpis': self.kpi_calculator._get_empty_kpis(),
            'graficos': self.chart_calculator._get_empty_charts(),
            'registros': [],
            'ultima_atualizacao': Formatters.format_datetime(datetime.now())
        }