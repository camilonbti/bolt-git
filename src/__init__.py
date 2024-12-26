"""
Pacote principal do processador de dados
"""

from .core.data_processor import ProcessadorDados
from .core.sheets_client import GoogleSheetsClient
from .core.dashboard_manager import DashboardManager

__all__ = [
    'ProcessadorDados',
    'GoogleSheetsClient',
    'DashboardManager'
]