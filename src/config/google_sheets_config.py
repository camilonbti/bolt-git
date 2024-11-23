"""
Configurações específicas para integração com Google Sheets
"""
import os
from pathlib import Path
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
import logging

# Configura logging
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

# Log do carregamento das configurações
logger.info("=== Carregando Configurações do Google Sheets ===")

# Obtém o caminho base do projeto
BASE_DIR = Path(__file__).resolve().parent.parent.parent
logger.info(f"Diretório Base: {BASE_DIR}")

# Carrega e valida GOOGLE_CREDENTIALS_PATH
credentials_path = os.getenv('GOOGLE_CREDENTIALS_PATH')
if not credentials_path:
    # Fallback para o diretório do projeto
    credentials_path = os.path.join(BASE_DIR, 'credentials.json')
logger.info(f"GOOGLE_CREDENTIALS_PATH: {credentials_path}")

# Resolve caminho absoluto
credentials_path = os.path.abspath(credentials_path)
logger.info(f"Caminho absoluto das credenciais: {credentials_path}")

GOOGLE_SHEETS_CONFIG = {
    "credentials_path": credentials_path,
    "sheet_url": os.getenv('GOOGLE_SHEETS_URL', 
                          "https://docs.google.com/spreadsheets/d/1ccjt8MlDcp-QAlY_yrRA-r7eIVLPeaNcAsBFghyvlEc/edit?usp=sharing"),
    "scopes": [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ],
    "default_range": os.getenv('GOOGLE_SHEETS_RANGE', "Sheet1!A1:Z1000"),
    "update_interval": int(os.getenv('UPDATE_INTERVAL', 300)),  # 5 minutos
    "timezone": ZoneInfo(os.getenv('TZ', "America/Sao_Paulo")),
    "date_format": os.getenv('DATE_FORMAT', "%d/%m/%Y %H:%M:%S"),
    "default_start_time": "00:00:00",
    "default_end_time": "23:59:59.999999"
}

# Log das configurações carregadas
logger.info("Configurações carregadas:")
for key, value in GOOGLE_SHEETS_CONFIG.items():
    if key != "scopes":  # Evita log muito extenso
        logger.info(f"{key}: {value}")
logger.info("==========================================")

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