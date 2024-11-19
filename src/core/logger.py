"""
Sistema centralizado de logs para o projeto
"""
import logging
import logging.handlers
import os
from datetime import datetime
from pathlib import Path

class LoggerManager:
    def __init__(self):
        self.log_dir = Path(__file__).resolve().parent.parent.parent / 'logs'
        self.log_dir.mkdir(exist_ok=True)
        
        # Formatos de log detalhados
        self.file_format = logging.Formatter(
            '[%(asctime)s] %(levelname)-8s [%(name)s:%(funcName)s:%(lineno)d] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        self.console_format = logging.Formatter(
            '[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s',
            datefmt='%H:%M:%S'
        )
        
        # Configuração global
        logging.getLogger().setLevel(logging.INFO)

    def get_logger(self, name: str) -> logging.Logger:
        """
        Retorna um logger configurado para o módulo especificado.
        
        Args:
            name: Nome do módulo/logger
            
        Returns:
            Logger configurado com handlers de arquivo e console
        """
        logger = logging.getLogger(name)
        
        # Evita duplicação de handlers
        if logger.handlers:
            return logger
            
        # Handler de arquivo com rotação
        log_file = self.log_dir / f"{name.split('.')[-1]}_{datetime.now():%Y%m}.log"
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=5 * 1024 * 1024,  # 5 MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setFormatter(self.file_format)
        file_handler.setLevel(logging.DEBUG)
        
        # Handler de console com cores
        console_handler = ColoredConsoleHandler()
        console_handler.setFormatter(self.console_format)
        console_handler.setLevel(logging.INFO)
        
        # Adiciona handlers
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger

class ColoredConsoleHandler(logging.StreamHandler):
    """Handler personalizado para console com cores"""
    
    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[41m',  # Red background
        'RESET': '\033[0m'       # Reset
    }

    def emit(self, record):
        try:
            message = self.format(record)
            color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
            self.stream.write(f'{color}{message}{self.COLORS["RESET"]}\n')
            self.flush()
        except Exception:
            self.handleError(record)

# Instância global do gerenciador de logs
log_manager = LoggerManager()