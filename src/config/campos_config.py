"""
Configuração centralizada dos campos do dashboard
"""
from typing import Dict, Any
import os
from dotenv import load_dotenv
from .google_sheets_config import GOOGLE_SHEETS_CONFIG

# Carrega variáveis de ambiente
load_dotenv()

# Configuração unificada dos campos
CAMPOS_CONFIG = {
    'Carimbo de data/hora': {
        'nome_interno': 'data_hora',
        'tipo': 'datetime',
        'obrigatorio': True,
        'formato': GOOGLE_SHEETS_CONFIG['date_format'],
        'valor_default': os.getenv('DEFAULT_DATETIME', '1899-12-30 00:00:00'),
        'permite_filtro': True,
        'tipo_filtro': 'date',
        'label': 'Data/Hora',
        'visivel': True
    },
    'Data Atendimento': {
        'nome_interno': 'data_atendimento',
        'tipo': 'date',
        'obrigatorio': False,
        'formato': '%d/%m/%Y',
        'valor_default': None,
        'permite_filtro': True,
        'tipo_filtro': 'date',
        'label': 'Data',
        'visivel': True,
        'campo_origem': 'data_hora'
    },
    'Hora Atendimento': {
        'nome_interno': 'hora_atendimento',
        'tipo': 'time',
        'obrigatorio': False,
        'formato': '%H:%M:%S',
        'valor_default': None,
        'permite_filtro': True,
        'tipo_filtro': 'time',
        'label': 'Hora',
        'visivel': True,
        'campo_origem': 'data_hora'
    },
    'Prestador de Serviços:': {
        'nome_interno': 'funcionario',
        'tipo': 'string',
        'obrigatorio': True,
        'valor_default': os.getenv('DEFAULT_FUNCIONARIO', 'Não informado'),
        'permite_filtro': True,
        'tipo_filtro': 'select',
        'label': 'Funcionário',
        'visivel': True
    },
    'Empresa atendida:': {
        'nome_interno': 'cliente',
        'tipo': 'string',
        'obrigatorio': True,
        'valor_default': os.getenv('DEFAULT_CLIENTE', 'Não informado'),
        'permite_filtro': True,
        'tipo_filtro': 'select',
        'label': 'Cliente',
        'visivel': True
    },
    'Nome do solicitante:': {
        'nome_interno': 'solicitante',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': os.getenv('DEFAULT_SOLICITANTE', 'Não informado'),
        'permite_filtro': True,
        'tipo_filtro': 'select',
        'label': 'Solicitante',
        'visivel': True
    },
    'Relato mais detalhado do pedido do cliente1:': {
        'nome_interno': 'relato_detalhado_1',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': '',
        'permite_filtro': False,
        'visivel': False,
        'concatenar': True
    },
    'Relato mais detalhado do pedido do cliente2:': {
        'nome_interno': 'relato_detalhado_2',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': '',
        'permite_filtro': False,
        'visivel': False,
        'concatenar': True
    },
    'Relato mais detalhado do pedido do cliente3:': {
        'nome_interno': 'relato_detalhado_3',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': '',
        'permite_filtro': False,
        'visivel': False,
        'concatenar': True
    },
    'Relato mais detalhado do pedido do cliente4:': {
        'nome_interno': 'relato_detalhado_4',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': '',
        'permite_filtro': False,
        'visivel': False,
        'concatenar': True
    },
    'Relato mais detalhado do pedido do cliente5:': {
        'nome_interno': 'relato_detalhado_5',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': '',
        'permite_filtro': False,
        'visivel': False,
        'concatenar': True
    },
    'Relato do pedido de atendimento:': {
        'nome_interno': 'solicitacao_cliente',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': os.getenv('DEFAULT_SOLICITACAO', 'Sem relato'),
        'permite_filtro': True,
        'tipo_filtro': 'select',
        'label': 'Relato',
        'visivel': True,
        'campos_concatenados': [
            'relato_detalhado_1', 'relato_detalhado_2', 'relato_detalhado_3',
            'relato_detalhado_4', 'relato_detalhado_5'
        ]
    },
    'Descrição do atendimento realizado:': {
        'nome_interno': 'descricao_atendimento',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': os.getenv('DEFAULT_DESCRICAO', 'Sem descrição'),
        'permite_filtro': False,
        'label': 'Descrição',
        'visivel': True
    },
    'Status do atendimento:': {
        'nome_interno': 'status_atendimento',
        'tipo': 'string',
        'obrigatorio': True,
        'valor_default': os.getenv('DEFAULT_STATUS', 'Pendente'),
        'valores_permitidos': os.getenv('STATUS_PERMITIDOS', 'Concluído,Pendente,Cancelado,Em Andamento').split(','),
        'permite_filtro': True,
        'tipo_filtro': 'select',
        'label': 'Status',
        'visivel': True
    },
    'Tipo do atendimento solicitado:': {
        'nome_interno': 'tipo_atendimento',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': os.getenv('DEFAULT_TIPO', 'Não categorizado'),
        'permite_filtro': True,
        'tipo_filtro': 'select',
        'label': 'Tipo',
        'visivel': True
    },
    'Sistema do cliente:': {
        'nome_interno': 'sistema',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': os.getenv('DEFAULT_SISTEMA', 'Não especificado'),
        'permite_filtro': True,
        'tipo_filtro': 'select',
        'label': 'Sistema',
        'visivel': True
    },
    'Qual(s) canal(s) utilizado(s) para realizar o atendimento? ': {
        'nome_interno': 'canal_atendimento',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': os.getenv('DEFAULT_CANAL', 'Não especificado'),
        'permite_filtro': True,
        'tipo_filtro': 'select',
        'label': 'Canal',
        'visivel': True
    },
    'Origem do problema:': {
        'nome_interno': 'origem_problema',
        'tipo': 'string',
        'obrigatorio': False,
        'valor_default': os.getenv('DEFAULT_ORIGEM', 'Não especificado'),
        'permite_filtro': True,
        'tipo_filtro': 'select',
        'label': 'Origem',
        'visivel': True
    }
}

def get_mapeamento_colunas() -> Dict[str, str]:
    """Retorna o mapeamento de colunas da planilha para nomes internos."""
    return {k: v['nome_interno'] for k, v in CAMPOS_CONFIG.items()}

def get_valores_default() -> Dict[str, Any]:
    """Retorna os valores default para cada campo."""
    return {v['nome_interno']: v['valor_default'] for v in CAMPOS_CONFIG.values()}

def get_campos_visiveis() -> Dict[str, Dict[str, Any]]:
    """Retorna apenas os campos configurados como visíveis."""
    return {
        nome: config for nome, config in CAMPOS_CONFIG.items()
        if config.get('visivel', False)
    }

def get_campos_filtraveis() -> Dict[str, Dict[str, Any]]:
    """Retorna apenas os campos que permitem filtro."""
    return {
        nome: config for nome, config in CAMPOS_CONFIG.items()
        if config.get('permite_filtro', False)
    }

def validar_cabecalho(cabecalho: list) -> bool:
    """Valida se o cabeçalho da planilha corresponde à configuração."""
    campos_obrigatorios = {
        nome for nome, config in CAMPOS_CONFIG.items()
        if config.get('obrigatorio', False)
    }
    return campos_obrigatorios.issubset(set(cabecalho))