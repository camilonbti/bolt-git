"""
Cliente para integração com Google Sheets
"""
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from ..config.campos_config import (
    GOOGLE_SHEETS_CONFIG, 
    validar_cabecalho,
    get_mapeamento_colunas
)
from ..utils.date_utils import (
    TIMEZONE,
    format_timestamp,
    get_current_time
)
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

logger = logging.getLogger(__name__)

class GoogleSheetsClient:
    def __init__(self):
        logger.info("=== Inicializando Google Sheets Client ===")
        
        # Carrega configurações
        self.config = GOOGLE_SHEETS_CONFIG
        logger.info("Configurações carregadas:")
        for key, value in self.config.items():
            if key != "scopes":  # Evita log muito extenso
                logger.info(f"{key}: {value}")
        
        # Obtém diretório atual
        self.current_dir = os.getcwd()
        logger.info(f"Diretório atual: {self.current_dir}")
        logger.info(f"PYTHONPATH: {os.getenv('PYTHONPATH')}")
        
        # Inicializa componentes
        self.credentials = self._get_credentials()
        self.service = self._create_service()
        self.spreadsheet_id = self._extract_spreadsheet_id()
        self.mapeamento_colunas = get_mapeamento_colunas()
        logger.info(f"Cliente inicializado com ID da planilha: {self.spreadsheet_id}")

    def _get_credentials(self):
        """Obtém as credenciais do Google Sheets."""
        try:
            credentials_path = self.config["credentials_path"]
            logger.info(f"Tentando carregar credenciais de: {credentials_path}")
            
            if not os.path.exists(credentials_path):
                error_msg = f"Arquivo de credenciais não encontrado em: {credentials_path}"
                logger.error(error_msg)
                raise FileNotFoundError(error_msg)
            
            logger.info("Arquivo de credenciais encontrado, tentando carregar...")
            credentials = service_account.Credentials.from_service_account_file(
                credentials_path, 
                scopes=self.config["scopes"]
            )
            logger.info("Credenciais carregadas com sucesso")
            return credentials
            
        except Exception as e:
            error_msg = f"Erro ao obter credenciais: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

    def _create_service(self):
        """Cria o serviço do Google Sheets."""
        try:
            logger.info("Criando serviço do Google Sheets")
            service = build('sheets', 'v4', credentials=self.credentials)
            logger.info("Serviço do Google Sheets criado com sucesso")
            return service
        except Exception as e:
            error_msg = f"Erro ao criar serviço do Google Sheets: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

    def _extract_spreadsheet_id(self):
        """Extrai o ID da planilha da URL."""
        try:
            spreadsheet_id = self.config["sheet_url"].split('/')[5]
            logger.info(f"ID da planilha extraído com sucesso: {spreadsheet_id}")
            return spreadsheet_id
        except IndexError:
            error_msg = f"URL da planilha inválida: {self.config['sheet_url']}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        except Exception as e:
            error_msg = f"Erro ao extrair ID da planilha: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

    def ler_planilha(self, range_name=None):
        """Lê dados da planilha do Google Sheets."""
        try:
            range_name = range_name or self.config["default_range"]
            logger.info(f"Iniciando leitura do range: {range_name}")
            
            # Obtém informações da planilha
            logger.info("Obtendo informações da planilha...")
            sheet_info = self.service.spreadsheets().get(
                spreadsheetId=self.spreadsheet_id
            ).execute()
            
            sheet_title = sheet_info['sheets'][0]['properties']['title']
            logger.info(f"Título da planilha: {sheet_title}")
            
            # Ajusta o range com o nome correto da planilha
            if not range_name.startswith("'"):
                range_name = f"'{sheet_title}'!A1:Z1000"
                logger.info(f"Range ajustado para: {range_name}")
            
            logger.info("Executando requisição para obter dados...")
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=range_name
            ).execute()
            
            dados = result.get('values', [])
            total_linhas = len(dados)
            
            if total_linhas == 0:
                logger.warning("Nenhum dado encontrado na planilha")
                return []
            
            logger.info(f"Total de linhas lidas: {total_linhas}")
            
            # Valida o cabeçalho da planilha
            cabecalho = dados[0]
            if not validar_cabecalho(cabecalho):
                error_msg = "Cabeçalho da planilha não corresponde ao mapeamento configurado"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Log das primeiras linhas para debug
            if len(dados) > 1:
                logger.debug("Primeiras 5 linhas da planilha:")
                for i, linha in enumerate(dados[1:6]):
                    if len(linha) > 0:
                        logger.debug(f"Linha {i+1}: {linha}")
            
            logger.info("Dados lidos com sucesso")
            return dados
            
        except HttpError as e:
            error_msg = f"Erro de API do Google Sheets: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise
        except ValueError as e:
            error_msg = f"Erro de estrutura da planilha: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise
        except Exception as e:
            error_msg = f"Erro ao ler planilha: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)

    def _extract_spreadsheet_id(self):
        """Extrai o ID da planilha da URL."""
        try:
            spreadsheet_id = self.config["sheet_url"].split('/')[5]
            logger.info(f"ID da planilha extraído com sucesso: {spreadsheet_id}")
            return spreadsheet_id
        except IndexError:
            error_msg = f"URL da planilha inválida: {self.config['sheet_url']}"
            logger.error(error_msg)
            raise ValueError(error_msg)
        except Exception as e:
            error_msg = f"Erro ao extrair ID da planilha: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise RuntimeError(error_msg)
