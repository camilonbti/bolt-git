"""
Utilitário centralizado para manipulação de datas
"""
from datetime import datetime
from typing import Optional, Tuple, Union
from zoneinfo import ZoneInfo

TIMEZONE = ZoneInfo("America/Sao_Paulo")

def format_date_range(
    start_date: Optional[Union[str, datetime]] = None,
    end_date: Optional[Union[str, datetime]] = None,
    date_only: bool = False
) -> Union[datetime, Tuple[datetime, datetime]]:
    """
    Formata datas com horário inicial (00:00:00) e final (23:59:59).
    """
    def parse_date(date_str: Optional[Union[str, datetime]], is_end: bool = False) -> datetime:
        if isinstance(date_str, datetime):
            date = date_str
        elif date_str:
            try:
                if 'T' in str(date_str):
                    date = datetime.fromisoformat(str(date_str).replace('Z', '+00:00'))
                else:
                    date = datetime.strptime(str(date_str), '%Y-%m-%d')
            except ValueError:
                date = datetime.now(TIMEZONE)
        else:
            date = datetime.now(TIMEZONE)
            
        if date.tzinfo is None:
            date = date.replace(tzinfo=TIMEZONE)
            
        if is_end:
            return date.replace(hour=23, minute=59, second=59, microsecond=999999)
        return date.replace(hour=0, minute=0, second=0, microsecond=0)
    
    if date_only:
        return parse_date(start_date)
        
    return (
        parse_date(start_date or datetime.now(TIMEZONE)),  # Mudança aqui
        parse_date(end_date or datetime.now(TIMEZONE), True)  # Mudança aqui
    )

def format_timestamp(date: datetime) -> int:
    """Converte datetime para timestamp em milissegundos."""
    return int(date.timestamp() * 1000)

def format_display_date(date: datetime) -> str:
    """Formata data para exibição no formato brasileiro."""
    return date.strftime('%d/%m/%Y %H:%M:%S')

def get_current_time() -> datetime:
    """Retorna data/hora atual com timezone."""
    return datetime.now(TIMEZONE)