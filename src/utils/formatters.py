"""
Utilitários para formatação de dados
"""
from typing import Union
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class Formatters:
    @staticmethod
    def format_number(value: Union[int, float], decimals: int = 0) -> str:
        """Formata número com separadores de milhar e decimais."""
        try:
            if value is None or isinstance(value, str):
                return '0'
                
            return f"{value:,.{decimals}f}".replace(',', '_').replace('.', ',').replace('_', '.')
        except Exception as e:
            logger.error(f"Erro ao formatar número: {str(e)}")
            return '0'

    @staticmethod
    def format_datetime(value: Union[str, datetime], timezone: str = 'America/Sao_Paulo') -> str:
        """Formata data/hora para exibição."""
        try:
            if isinstance(value, str):
                value = datetime.strptime(value, '%d/%m/%Y %H:%M:%S')
                
            return value.strftime('%d/%m/%Y %H:%M:%S')
        except Exception as e:
            logger.error(f"Erro ao formatar data/hora: {str(e)}")
            return '-'

    @staticmethod 
    def format_currency(value: Union[int, float]) -> str:
        """Formata valor monetário."""
        try:
            if value is None or isinstance(value, str):
                return 'R$ 0,00'
                
            return f"R$ {value:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
        except Exception as e:
            logger.error(f"Erro ao formatar moeda: {str(e)}")
            return 'R$ 0,00'

    @staticmethod
    def format_percentage(value: Union[int, float], decimals: int = 1) -> str:
        """Formata percentual."""
        try:
            if value is None or isinstance(value, str):
                return '0%'
                
            return f"{value:,.{decimals}f}%".replace('.', ',')
        except Exception as e:
            logger.error(f"Erro ao formatar percentual: {str(e)}")
            return '0%'