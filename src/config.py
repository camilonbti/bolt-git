import os

# Configurações de credenciais
CREDENTIALS_PATH = 'credentials.json'
SHEET_URL = "https://docs.google.com/spreadsheets/d/1ccjt8MlDcp-QAlY_yrRA-r7eIVLPeaNcAsBFghyvlEc/edit?usp=sharing"

def get_credentials_path():
    return os.path.join(os.path.dirname(__file__), '..', CREDENTIALS_PATH)

# Adiciona novas constantes para o Forms
FORM_URL = "https://docs.google.com/forms/d/1ZXROIH3x8bMzgtQRHRVhlV-xJi5GTKWHaZTcnKiOYOY/edit"
FORM_ID = "1ZXROIH3x8bMzgtQRHRVhlV-xJi5GTKWHaZTcnKiOYOY"

# Adiciona configurações do Forms sem mexer nas existentes
GOOGLE_FORMS_CONFIG = {
    "credentials_path": get_credentials_path(),  # Reusa a função existente
    "form_id": FORM_ID,
    "scopes": ['https://www.googleapis.com/auth/forms']
}