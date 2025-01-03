"""
Configurações específicas para integração com Google Sheets
"""
import os
from dotenv import load_dotenv
import logging

# Configura logging
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

# Configurações do Google Sheets
GOOGLE_SHEETS_CONFIG = {
    "credentials_path": os.getenv('GOOGLE_CREDENTIALS_PATH'),
    "sheet_url": os.getenv('GOOGLE_SHEETS_URL'),
    "scopes": [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ],
    "default_range": os.getenv('GOOGLE_SHEETS_RANGE', "Sheet1!A1:Z1000"),
    "update_interval": int(os.getenv('UPDATE_INTERVAL', 300)),
    "date_format": os.getenv('DATE_FORMAT', "%d/%m/%Y %H:%M:%S"),
    "max_retries": int(os.getenv('GOOGLE_SHEETS_MAX_RETRIES', 3)),
    "retry_delay": int(os.getenv('GOOGLE_SHEETS_RETRY_DELAY', 5)),
    "cache_timeout": int(os.getenv('GOOGLE_SHEETS_CACHE_TIMEOUT', 300)),
    "batch_size": int(os.getenv('GOOGLE_SHEETS_BATCH_SIZE', 1000))
}

def get_date_format():
    """Retorna o formato de data configurado."""
    return GOOGLE_SHEETS_CONFIG["date_format"]