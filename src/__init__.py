"""
Pacote principal do processador de dados
"""

from .data_processor import ProcessadorDados
from .sheets_client import GoogleSheetsClient
from .dashboard_manager import DashboardManager
from .filter_manager import FiltrosDashboard

__all__ = [
    'ProcessadorDados',
    'GoogleSheetsClient',
    'DashboardManager',
    'FiltrosDashboard'
]