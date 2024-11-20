"""
Utilitário centralizado para manipulação de datas
"""
from datetime import datetime, time
from typing import Optional, Tuple, Union
from zoneinfo import ZoneInfo

# Timezone padrão (São Paulo/Brasília)
TIMEZONE = ZoneInfo("America/Sao_Paulo")

# Horários padrão para início e fim do dia
START_TIME = time(0, 0, 0, 0)  # 00:00:00.000000
END_TIME = time(23, 59, 59, 999999)  # 23:59:59.999999

# Formatos de data aceitos
DATE_FORMAT = '%Y-%m-%d'
DATETIME_FORMAT = '%d/%m/%Y %H:%M:%S'

def get_date_with_min_time(date_str: str) -> datetime:
    """
    Retorna datetime com horário inicial do dia (00:00:00).
    
    Args:
        date_str: Data no formato 'YYYY-MM-DD'
        
    Returns:
        datetime: Data com horário inicial do dia
    """
    try:
        date = datetime.strptime(date_str, DATE_FORMAT)
        return datetime.combine(date.date(), START_TIME, tzinfo=TIMEZONE)
    except ValueError as e:
        raise ValueError(f"Data inválida: {date_str}. Use o formato YYYY-MM-DD") from e

def get_date_with_max_time(date_str: str) -> datetime:
    """
    Retorna datetime com horário final do dia (23:59:59.999999).
    
    Args:
        date_str: Data no formato 'YYYY-MM-DD'
        
    Returns:
        datetime: Data com horário final do dia
    """
    try:
        date = datetime.strptime(date_str, DATE_FORMAT)
        return datetime.combine(date.date(), END_TIME, tzinfo=TIMEZONE)
    except ValueError as e:
        raise ValueError(f"Data inválida: {date_str}. Use o formato YYYY-MM-DD") from e

def format_date_range(
    start_date: Optional[Union[str, datetime]] = None,
    end_date: Optional[Union[str, datetime]] = None,
    date_only: bool = False
) -> Union[datetime, Tuple[datetime, datetime]]:
    """
    Formata datas com horário inicial (00:00:00) e final (23:59:59).
    
    Args:
        start_date: Data inicial (opcional)
        end_date: Data final (opcional)
        date_only: Se True, retorna apenas a primeira data
        
    Returns:
        Uma data ou tupla de datas com timezone
    """
    def parse_date(date_str: Optional[Union[str, datetime]], is_end: bool = False) -> datetime:
        if isinstance(date_str, datetime):
            date = date_str
        elif date_str:
            try:
                if 'T' in str(date_str):
                    date = datetime.fromisoformat(str(date_str).replace('Z', '+00:00'))
                else:
                    date = datetime.strptime(str(date_str), DATETIME_FORMAT)
            except ValueError:
                date = datetime.now(TIMEZONE)
        else:
            date = datetime.now(TIMEZONE)
            
        if date.tzinfo is None:
            date = date.replace(tzinfo=TIMEZONE)
            
        if is_end:
            return datetime.combine(date.date(), END_TIME, tzinfo=TIMEZONE)
        return datetime.combine(date.date(), START_TIME, tzinfo=TIMEZONE)
    
    if date_only:
        return parse_date(start_date)
        
    return (
        parse_date(start_date),
        parse_date(end_date, True)
    )

def format_timestamp(date: datetime) -> int:
    """
    Converte datetime para timestamp em milissegundos.
    
    Args:
        date: Data a ser convertida
        
    Returns:
        int: Timestamp em milissegundos
    """
    return int(date.timestamp() * 1000)

def format_display_date(date: datetime) -> str:
    """
    Formata data para exibição no formato brasileiro.
    
    Args:
        date: Data a ser formatada
        
    Returns:
        str: Data formatada (dd/mm/yyyy HH:MM:SS)
    """
    return date.strftime(DATETIME_FORMAT)

def validate_dates(start_date: str, end_date: str) -> bool:
    """
    Valida se as datas são válidas e se a data inicial não é maior que a final.
    
    Args:
        start_date: Data inicial no formato 'YYYY-MM-DD'
        end_date: Data final no formato 'YYYY-MM-DD'
        
    Returns:
        bool: True se as datas são válidas
    """
    try:
        start = get_date_with_min_time(start_date)
        end = get_date_with_max_time(end_date)
        
        if start > end:
            return False
            
        return True
    except ValueError:
        return False

def get_current_time() -> datetime:
    """
    Retorna data/hora atual com timezone.
    
    Returns:
        datetime: Data/hora atual
    """
    return datetime.now(TIMEZONE)