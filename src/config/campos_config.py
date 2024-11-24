"""
Configuração centralizada dos campos do dashboard
"""
from typing import Dict, Any
from zoneinfo import ZoneInfo
import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Timezone padrão
TIMEZONE = ZoneInfo(os.getenv('TZ', "America/Sao_Paulo"))

# Configuração do Google Sheets
GOOGLE_SHEETS_CONFIG = {
    "credentials_path": os.getenv('GOOGLE_CREDENTIALS_PATH', 'credentials.json'),
    "sheet_url": os.getenv('GOOGLE_SHEETS_URL'),
    "scopes": [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ],
    "default_range": os.getenv('GOOGLE_SHEETS_RANGE', "Sheet1!A1:Z1000"),
    "update_interval": int(os.getenv('UPDATE_INTERVAL', '300')),  # 5 minutos
    "timezone": TIMEZONE,
    "date_format": os.getenv('DATE_FORMAT', "%d/%m/%Y %H:%M:%S"),
    "default_start_time": os.getenv('DEFAULT_START_TIME', "00:00:00"),
    "default_end_time": os.getenv('DEFAULT_END_TIME', "23:59:59.999999")
}

# Mapeamento de nomes das colunas da planilha para nomes internos
MAPEAMENTO_COLUNAS = {
    'Carimbo de data/hora': 'data_hora',
    'Prestador de Serviços:': 'funcionario',
    'Empresa atendida:': 'cliente',
    'Nome do solicitante:': 'solicitante',
    'Relato do pedido de atendimento:': 'solicitacao_cliente',
    'Descrição do atendimento realizado:': 'descricao_atendimento',
    'Status do atendimento:': 'status_atendimento',
    'Tipo do atendimento solicitado:': 'tipo_atendimento',
    'Sistema do cliente:': 'sistema',
    'Qual(s) canal(s) utilizado(s) para realizar o atendimento? ': 'canal_atendimento'
}

# Valores default para campos vazios
VALORES_DEFAULT = {
    'data_hora': os.getenv('DEFAULT_DATETIME', '1899-12-30 00:00:00'),
    'funcionario': os.getenv('DEFAULT_FUNCIONARIO', 'Não informado'),
    'cliente': os.getenv('DEFAULT_CLIENTE', 'Não informado'),
    'solicitante': os.getenv('DEFAULT_SOLICITANTE', 'Não informado'),
    'solicitacao_cliente': os.getenv('DEFAULT_SOLICITACAO', 'Sem relato'),
    'descricao_atendimento': os.getenv('DEFAULT_DESCRICAO', 'Sem descrição'),
    'status_atendimento': os.getenv('DEFAULT_STATUS', 'Pendente'),
    'tipo_atendimento': os.getenv('DEFAULT_TIPO', 'Não categorizado'),
    'sistema': os.getenv('DEFAULT_SISTEMA', 'Não especificado'),
    'canal_atendimento': os.getenv('DEFAULT_CANAL', 'Não especificado')
}

# Configuração completa dos campos
CAMPOS_CONFIGURACAO = {
    "Carimbo de data/hora": {
        "nome_interno": "data_hora",
        "tipo": "datetime",
        "obrigatorio": True,
        "formato": os.getenv('DATE_FORMAT', "%d/%m/%Y %H:%M:%S"),
        "valor_default": VALORES_DEFAULT['data_hora'],
        "permite_filtro": True,
        "tipo_filtro": "date",
        "label": "Data/Hora",
        "visivel": True
    },
    "Prestador de Serviços:": {
        "nome_interno": "funcionario",
        "tipo": "string",
        "obrigatorio": True,
        "valor_default": VALORES_DEFAULT['funcionario'],
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Funcionário",
        "visivel": True
    },
    "Empresa atendida:": {
        "nome_interno": "cliente",
        "tipo": "string",
        "obrigatorio": True,
        "valor_default": VALORES_DEFAULT['cliente'],
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Cliente",
        "visivel": True
    },
    "Nome do solicitante:": {
        "nome_interno": "solicitante",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": VALORES_DEFAULT['solicitante'],
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Solicitante",
        "visivel": True
    },
    "Relato do pedido de atendimento:": {
        "nome_interno": "solicitacao_cliente",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": VALORES_DEFAULT['solicitacao_cliente'],
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Relato",
        "visivel": True
    },
    "Descrição do atendimento realizado:": {
        "nome_interno": "descricao_atendimento",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": VALORES_DEFAULT['descricao_atendimento'],
        "permite_filtro": False,
        "label": "Descrição",
        "visivel": True
    },
    "Status do atendimento:": {
        "nome_interno": "status_atendimento",
        "tipo": "string",
        "obrigatorio": True,
        "valor_default": VALORES_DEFAULT['status_atendimento'],
        "valores_permitidos": os.getenv('STATUS_PERMITIDOS', "Concluído,Pendente,Cancelado,Em Andamento").split(','),
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Status",
        "visivel": True
    },
    "Tipo do atendimento solicitado:": {
        "nome_interno": "tipo_atendimento",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": VALORES_DEFAULT['tipo_atendimento'],
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Tipo",
        "visivel": True
    },
    "Sistema do cliente:": {
        "nome_interno": "sistema",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": VALORES_DEFAULT['sistema'],
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Sistema",
        "visivel": True
    },
    "Qual(s) canal(s) utilizado(s) para realizar o atendimento? ": {
        "nome_interno": "canal_atendimento",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": VALORES_DEFAULT['canal_atendimento'],
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Canal",
        "visivel": True
    }
}

def get_mapeamento_colunas() -> Dict[str, str]:
    """Retorna o mapeamento de colunas da planilha para nomes internos."""
    return MAPEAMENTO_COLUNAS

def get_valores_default() -> Dict[str, Any]:
    """Retorna os valores default para cada campo."""
    return VALORES_DEFAULT

def get_campos_visiveis() -> Dict[str, Dict[str, Any]]:
    """Retorna apenas os campos configurados como visíveis."""
    return {
        nome: config for nome, config in CAMPOS_CONFIGURACAO.items()
        if config.get('visivel', False)
    }

def get_campos_filtraveis() -> Dict[str, Dict[str, Any]]:
    """Retorna apenas os campos que permitem filtro."""
    return {
        nome: config for nome, config in CAMPOS_CONFIGURACAO.items()
        if config.get('permite_filtro', False)
    }

def validar_cabecalho(cabecalho: list) -> bool:
    """Valida se o cabeçalho da planilha corresponde à configuração."""
    campos_obrigatorios = {
        nome for nome, config in CAMPOS_CONFIGURACAO.items()
        if config.get('obrigatorio', False)
    }
    campos_planilha = set(cabecalho)
    return campos_obrigatorios.issubset(campos_planilha)
