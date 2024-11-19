from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from .logger import log_manager
from ..config import GOOGLE_SHEETS_CONFIG
import json

logger = log_manager.get_logger(__name__)

class GoogleSheetsClient:
    def __init__(self):
        self.config = GOOGLE_SHEETS_CONFIG
        logger.info("Inicializando cliente do Google Sheets")
        self.credentials = self._get_credentials()
        self.service = self._create_service()
        self.spreadsheet_id = self._extract_spreadsheet_id()
        logger.info(f"Cliente inicializado com sucesso. Spreadsheet ID: {self.spreadsheet_id}")

    def _get_credentials(self):
        """Obtém as credenciais do Google Sheets."""
        try:
            logger.debug(f"Obtendo credenciais do arquivo: {self.config['credentials_path']}")
            credentials = service_account.Credentials.from_service_account_file(
                self.config["credentials_path"], 
                scopes=self.config["scopes"]
            )
            logger.info("Credenciais obtidas com sucesso")
            return credentials
        except FileNotFoundError:
            error_msg = f"Arquivo de credenciais não encontrado: {self.config['credentials_path']}"
            logger.critical(error_msg)
            raise FileNotFoundError(error_msg)
        except Exception as e:
            error_msg = f"Erro ao obter credenciais: {str(e)}"
            logger.critical(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

    def _create_service(self):
        """Cria o serviço do Google Sheets."""
        try:
            logger.debug("Criando serviço do Google Sheets")
            service = build('sheets', 'v4', credentials=self.credentials)
            logger.info("Serviço do Google Sheets criado com sucesso")
            return service
        except Exception as e:
            error_msg = f"Erro ao criar serviço do Google Sheets: {str(e)}"
            logger.critical(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

    def _extract_spreadsheet_id(self):
        """Extrai o ID da planilha da URL."""
        try:
            spreadsheet_id = self.config["sheet_url"].split('/')[5]
            logger.debug(f"ID da planilha extraído: {spreadsheet_id}")
            return spreadsheet_id
        except IndexError:
            error_msg = f"URL da planilha inválida: {self.config['sheet_url']}"
            logger.critical(error_msg)
            raise ValueError(error_msg)
        except Exception as e:
            error_msg = f"Erro ao extrair ID da planilha: {str(e)}"
            logger.critical(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

    def ler_planilha(self, range_name=None):
        """
        Lê dados da planilha do Google Sheets.
        
        Args:
            range_name: Range específico para leitura (opcional)
            
        Returns:
            Lista de linhas da planilha
            
        Raises:
            HttpError: Erro de comunicação com a API
            RuntimeError: Outros erros durante a leitura
        """
        try:
            range_name = range_name or self.config["default_range"]
            logger.info(f"Iniciando leitura do range: {range_name}")
            
            # Obtém informações da planilha
            sheet_info = self.service.spreadsheets().get(
                spreadsheetId=self.spreadsheet_id
            ).execute()
            
            sheet_title = sheet_info['sheets'][0]['properties']['title']
            logger.debug(f"Título da planilha: {sheet_title}")
            
            # Ajusta o range com o nome correto da planilha
            if not range_name.startswith("'"):
                range_name = f"'{sheet_title}'!A1:Z1000"
            
            logger.debug(f"Executando requisição para range: {range_name}")
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=range_name
            ).execute()
            
            dados = result.get('values', [])
            total_linhas = len(dados)
            logger.info(f"Dados lidos com sucesso. Total de linhas: {total_linhas}")
            
            if total_linhas == 0:
                logger.warning("Nenhum dado encontrado na planilha")
            else:
                logger.debug(f"Amostra dos dados: {json.dumps(dados[0], ensure_ascii=False)}")
            
            return dados
            
        except HttpError as e:
            error_msg = f"Erro de API do Google Sheets: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise HttpError(e.resp, e.content)
        except Exception as e:
            error_msg = f"Erro ao ler planilha: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)