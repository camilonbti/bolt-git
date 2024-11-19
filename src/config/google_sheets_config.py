"""
Configurações específicas para integração com Google Sheets
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

GOOGLE_SHEETS_CONFIG = {
    "credentials_path": os.path.join(BASE_DIR, "credentials.json"),
    "sheet_url": "https://docs.google.com/spreadsheets/d/1ccjt8MlDcp-QAlY_yrRA-r7eIVLPeaNcAsBFghyvlEc/edit?usp=sharing",
    "scopes": [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ],
    "default_range": "Sheet1!A1:Z1000",
    "update_interval": 300  # 5 minutos
}