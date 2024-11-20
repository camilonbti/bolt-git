"""
Configurações específicas para integração com Google Sheets
"""
import os
from pathlib import Path
from zoneinfo import ZoneInfo

BASE_DIR = Path(__file__).resolve().parent.parent.parent

GOOGLE_SHEETS_CONFIG = {
    "credentials_path": os.path.join(BASE_DIR, "credentials.json"),
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
