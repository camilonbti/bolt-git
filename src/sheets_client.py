from google.oauth2 import service_account
from googleapiclient.discovery import build
import logging
from .config import GOOGLE_SHEETS_CONFIG

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class GoogleSheetsClient:
    def __init__(self):
        self.config = GOOGLE_SHEETS_CONFIG
        self.credentials = self._get_credentials()
        self.service = self._create_service()
        self.spreadsheet_id = self._extract_spreadsheet_id()

    def _get_credentials(self):
        """Obtém as credenciais do Google Sheets."""
        try:
            return service_account.Credentials.from_service_account_file(
                self.config["credentials_path"], 
                scopes=self.config["scopes"]
            )
        except Exception as e:
            logger.error(f"Erro ao obter credenciais: {str(e)}")
            raise

    def _create_service(self):
        """Cria o serviço do Google Sheets."""
        try:
            return build('sheets', 'v4', credentials=self.credentials)
        except Exception as e:
            logger.error(f"Erro ao criar serviço: {str(e)}")
            raise

    def _extract_spreadsheet_id(self):
        """Extrai o ID da planilha da URL."""
        try:
            return self.config["sheet_url"].split('/')[5]
        except Exception as e:
            logger.error(f"Erro ao extrair ID da planilha: {str(e)}")
            raise

    def ler_planilha(self, range_name=None):
        """
        Lê dados da planilha do Google Sheets.
        
        Args:
            range_name (str, optional): Range específico para leitura.
                                      Se não fornecido, usa o range padrão.
        """
        try:
            range_name = range_name or self.config["default_range"]
            logger.info(f"Lendo dados do range: {range_name}")
            
            # Tenta primeiro obter as informações da planilha
            sheet_info = self.service.spreadsheets().get(
                spreadsheetId=self.spreadsheet_id
            ).execute()
            
            # Verifica se a planilha existe
            sheet_title = sheet_info['sheets'][0]['properties']['title']
            
            # Ajusta o range com o nome correto da planilha
            if not range_name.startswith("'"):
                range_name = f"'{sheet_title}'!A1:Z1000"
            
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=range_name
            ).execute()
            
            dados = result.get('values', [])
            logger.info(f"Dados lidos com sucesso. Total de linhas: {len(dados)}")
            
            return dados
            
        except Exception as e:
            logger.error(f"Erro ao ler planilha: {str(e)}")
            raise