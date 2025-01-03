"""
Configurações específicas para integração com Google Sheets
"""
import os
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
import logging

# Configura logging
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

# Configurações do Google Sheets
GOOGLE_SHEETS_CONFIG = {
    "credentials_path": os.getenv('GOOGLE_CREDENTIALS_PATH'),
    "sheet_url": os.getenv('GOOGLE_SHEETS_URL', 
                          "https://docs.google.com/spreadsheets/d/1ccjt8MlDcp-QAlY_yrRA-r7eIVLPeaNcAsBFghyvlEc/edit?usp=sharing"),
    "scopes": [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ],
    "default_range": os.getenv('GOOGLE_SHEETS_RANGE', "Sheet1!A1:Z1000"),
    "update_interval": int(os.getenv('UPDATE_INTERVAL', 300)),
    "timezone": ZoneInfo(os.getenv('TZ', "America/Sao_Paulo")),
    "date_format": os.getenv('DATE_FORMAT', "%d/%m/%Y %H:%M:%S"),
    "default_start_time": os.getenv('DEFAULT_START_TIME', "00:00:00"),
    "default_end_time": os.getenv('DEFAULT_END_TIME', "23:59:59.999999"),
    "max_retries": int(os.getenv('GOOGLE_SHEETS_MAX_RETRIES', 3)),
    "retry_delay": int(os.getenv('GOOGLE_SHEETS_RETRY_DELAY', 5)),
    "cache_timeout": int(os.getenv('GOOGLE_SHEETS_CACHE_TIMEOUT', 300)),
    "batch_size": int(os.getenv('GOOGLE_SHEETS_BATCH_SIZE', 1000))
}

print(f"Chave da API: {os.getenv('GOOGLE_CREDENTIALS_PATH')}")

def get_timezone():
    """Retorna o timezone configurado."""
    return GOOGLE_SHEETS_CONFIG["timezone"]

def get_date_format():
    """Retorna o formato de data configurado."""
    return GOOGLE_SHEETS_CONFIG["date_format"]

def get_time_range():
    """Retorna o intervalo de tempo padrão para um dia."""
    return (
        GOOGLE_SHEETS_CONFIG["default_start_time"],
        GOOGLE_SHEETS_CONFIG["default_end_time"]
    )
