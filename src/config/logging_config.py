"""
Configuração centralizada de logging
"""
import logging
import os
from datetime import datetime
from pathlib import Path

# Configurações base
BASE_DIR = Path(__file__).resolve().parent.parent.parent
LOG_DIR = os.path.join(BASE_DIR, 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

# Formato detalhado para arquivo
FILE_FORMAT = logging.Formatter(
    '[%(asctime)s] %(levelname)-8s [%(name)s:%(funcName)s:%(lineno)d] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Formato simplificado para console
CONSOLE_FORMAT = logging.Formatter(
    '[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s',
    datefmt='%H:%M:%S'
)

def setup_logging():
    """Configura o sistema de logging."""
    # Configuração raiz
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Handler para arquivo
    log_file = os.path.join(LOG_DIR, f'app_{datetime.now():%Y%m}.log')
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setFormatter(FILE_FORMAT)
    file_handler.setLevel(logging.DEBUG)
    
    # Handler para console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(CONSOLE_FORMAT)
    console_handler.setLevel(logging.INFO)
    
    # Adiciona handlers
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    # Evita propagação duplicada
    root_logger.propagate = False