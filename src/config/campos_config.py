"""
Configuração centralizada dos campos do dashboard
"""
from typing import Dict, Any
from zoneinfo import ZoneInfo

# Timezone padrão
TIMEZONE = ZoneInfo("America/Sao_Paulo")

# Mapeamento de nomes das colunas da planilha para nomes internos
MAPEAMENTO_COLUNAS = {
    'Carimbo de data/hora': 'data_hora',
    'Prestador de Serviços:': 'funcionario',
    'Empresa atendida:': 'cliente',
    'Nome do solicitante:': 'solicitante',
    'Relato do pedido de atendimento:': 'solicitacao_cliente',
    'Relato mais detalhado do pedido do cliente:': 'descricao_atendimento',
    'Descrição do atendimento realizado:': 'descricao_realizado',
    'Status do atendimento:': 'status_atendimento',
    'Tipo do atendimento solicitado:': 'tipo_atendimento',
    'Sistema do cliente:': 'sistema',
    'Qual(s) canal(s) utilizado(s) para realizar o atendimento? ': 'canal_atendimento'
}

# Valores default para campos vazios
VALORES_DEFAULT = {
    'data_hora': '1899-12-30 00:00:00',
    'funcionario': 'Não informado',
    'cliente': 'Não informado',
    'solicitante': 'Não informado',
    'solicitacao_cliente': 'Sem relato',
    'descricao_atendimento': 'Sem descrição detalhada',
    'descricao_realizado': 'Sem descrição do atendimento',
    'status_atendimento': 'Pendente',
    'tipo_atendimento': 'Não categorizado',
    'sistema': 'Não especificado',
    'canal_atendimento': 'Não especificado'
}

# Configuração completa dos campos
CAMPOS_CONFIGURACAO = {
    "Carimbo de data/hora": {
        "nome_interno": "data_hora",
        "tipo": "datetime",
        "obrigatorio": True,
        "formato": "%d/%m/%Y %H:%M:%S",
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
    "Relato mais detalhado do pedido do cliente:": {
        "nome_interno": "descricao_atendimento",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": VALORES_DEFAULT['descricao_atendimento'],
        "permite_filtro": False,
        "label": "Descrição Detalhada",
        "visivel": True
    },
    "Descrição do atendimento realizado:": {
        "nome_interno": "descricao_realizado",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": VALORES_DEFAULT['descricao_realizado'],
        "permite_filtro": False,
        "label": "Descrição do Atendimento",
        "visivel": True
    },
    "Status do atendimento:": {
        "nome_interno": "status_atendimento",
        "tipo": "string",
        "obrigatorio": True,
        "valor_default": VALORES_DEFAULT['status_atendimento'],
        "valores_permitidos": ["Concluído", "Pendente", "Cancelado", "Em Andamento"],
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
