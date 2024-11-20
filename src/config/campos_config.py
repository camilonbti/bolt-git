"""
Configuração centralizada dos campos do dashboard
"""

CAMPOS_CONFIGURACAO = {
    "Carimbo de data/hora": {
        "nome_interno": "data_hora",
        "tipo": "datetime",
        "obrigatorio": True,
        "formato": "%d/%m/%Y %H:%M:%S",
        "valor_default": "1899-12-30 00:00:00",
        "permite_filtro": True,
        "tipo_filtro": "date",
        "label": "Data/Hora",
        "ordem": 1
    },
    "Prestador de Serviços:": {
        "nome_interno": "funcionario",
        "tipo": "string",
        "obrigatorio": True,
        "valor_default": "Não informado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Funcionário",
        "ordem": 2
    },
    "Empresa atendida:": {
        "nome_interno": "cliente",
        "tipo": "string",
        "obrigatorio": True,
        "valor_default": "Não informado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Cliente",
        "ordem": 3
    },
    "Nome do solicitante:": {
        "nome_interno": "solicitante",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Não informado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Solicitante",
        "ordem": 4
    },
    "Relato do pedido de atendimento:": {
        "nome_interno": "solicitacao_cliente",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Sem relato",
        "permite_filtro": False,
        "label": "Solicitação",
        "ordem": 5
    },
    "Relato mais detalhado do pedido do cliente:": {
        "nome_interno": "descricao_atendimento",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Sem descrição detalhada",
        "permite_filtro": False,
        "label": "Descrição",
        "ordem": 6
    },
    "Descrição do atendimento realizado:": {
        "nome_interno": "descricao_realizado",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Sem descrição do atendimento",
        "permite_filtro": False,
        "label": "Descrição",
        "ordem": 7
    },
    "Status do atendimento:": {
        "nome_interno": "status_atendimento",
        "tipo": "string",
        "obrigatorio": True,
        "valor_default": "Pendente",
        "valores_permitidos": ["Concluído", "Pendente", "Cancelado", "Em Andamento"],
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Status",
        "ordem": 8
    },
    "Tipo do atendimento solicitado:": {
        "nome_interno": "tipo_atendimento",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Não categorizado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Tipo",
        "ordem": 9
    },
    "Sistema do cliente:": {
        "nome_interno": "sistema",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Não especificado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Sistema",
        "ordem": 10
    },
    "Qual(s) canal(s) utilizado(s) para realizar o atendimento? ": {
        "nome_interno": "canal_atendimento",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Não especificado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Canal",
        "ordem": 11
    }
}