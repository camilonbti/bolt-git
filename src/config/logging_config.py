"""
Configuração otimizada de logs para depuração
"""
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from pathlib import Path

# Configurações base
BASE_DIR = Path(__file__).resolve().parent.parent.parent
LOG_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

# Formatos de log otimizados
FORMATO_ARQUIVO = (
    '%(asctime)s | %(levelname)-8s | %(name)s | '
    'L%(lineno)d | %(funcName)s | %(message)s'
)

FORMATO_CONSOLE = (
    '%(asctime)s | %(levelname)-8s | %(name)s | '
    '%(message)s'
)

def get_logger(nome_logger, nivel=logging.INFO):
    """Configura logger otimizado para depuração."""
    logger = logging.getLogger(nome_logger)
    logger.setLevel(nivel)
    
    if logger.handlers:
        return logger
    
    # Handler para arquivo
    nome_arquivo = f"{nome_logger}_{datetime.now().strftime('%Y%m')}.log"
    arquivo_log = os.path.join(LOG_DIR, nome_arquivo)
    
    file_handler = RotatingFileHandler(
        arquivo_log,
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(FORMATO_ARQUIVO))
    
    # Handler para console
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter(FORMATO_CONSOLE))
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger