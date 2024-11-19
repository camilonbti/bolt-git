import os

# Configurações de credenciais
CREDENTIALS_PATH = 'credentials.json'
SHEET_URL = "https://docs.google.com/spreadsheets/d/1ccjt8MlDcp-QAlY_yrRA-r7eIVLPeaNcAsBFghyvlEc/edit?usp=sharing"

def get_credentials_path():
    return os.path.join(os.path.dirname(__file__), '..', CREDENTIALS_PATH)