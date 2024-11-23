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
logger.info(f"Diretório Base: {Path(__file__).resolve().parent.parent.parent}")
logger.info(f"GOOGLE_CREDENTIALS_PATH: {os.getenv('GOOGLE_CREDENTIALS_PATH')}")

BASE_DIR = Path(__file__).resolve().parent.parent.parent

GOOGLE_SHEETS_CONFIG = {
    "credentials_path": os.getenv('GOOGLE_CREDENTIALS_PATH'),
    "sheet_url": "https://docs.google.com/spreadsheets/d/1ccjt8MlDcp-QAlY_yrRA-r7eIVLPeaNcAsBFghyvlEc/edit?usp=sharing",
    "scopes": [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ],
    "default_range": "Sheet1!A1:Z1000",
    "update_interval": 300,  # 5 minutos
    "timezone": ZoneInfo("America/Sao_Paulo"),
    "date_format": "%d/%m/%Y %H:%M:%S",
    "default_start_time": "00:00:00",
    "default_end_time": "23:59:59.999999"
}

# Log das configurações carregadas
logger.info("Configurações carregadas:")
for key, value in GOOGLE_SHEETS_CONFIG.items():
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