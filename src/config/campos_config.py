"""
Configuração dos campos do dashboard
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
        "label": "Data/Hora"
    },
    "Prestador de Serviços:": {
        "nome_interno": "funcionario",
        "tipo": "string",
        "obrigatorio": True,
        "valor_default": "Não informado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Funcionário"
    },
    "Empresa atendida:": {
        "nome_interno": "cliente",
        "tipo": "string",
        "obrigatorio": True,
        "valor_default": "Não informado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Cliente"
    },
    "Nome do solicitante:": {
        "nome_interno": "funcionario_empresa",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Não informado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Solicitante"
    },
    "Relato do pedido de atendimento:": {
        "nome_interno": "solicitacao_cliente",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Sem relato",
        "permite_filtro": False,
        "label": "Solicitação"
    },
    "Relato mais detalhado do pedido do cliente:": {
        "nome_interno": "descricao_atendimento",
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Sem descrição detalhada",
        "permite_filtro": False,
        "label": "Descrição"
    },
    "Status do atendimento:": {
        "nome_interno": "status_atendimento",
        "tipo": "string",
        "obrigatorio": True,
        "valor_default": "Pendente",
        "valores_permitidos": ["Concluído", "Pendente", "Cancelado", "Em Andamento"],
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Status"
    },
    "Tipo do atendimento solicitado:": {
        "nome_interno": "tipo_atendimento",  # Corrigido de sistema_cliente para tipo_atendimento
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Não categorizado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Tipo"
    },
    "Sistema do cliente:": {
        "nome_interno": "sistema",  # Simplificado de tipo_sistema para sistema
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Não especificado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Sistema"
    },
    "Qual(s) canal(s) utilizado(s) para realizar o atendimento? ": {
        "nome_interno": "canal_atendimento",  # Simplificado de plataforma_atendimento para canal_atendimento
        "tipo": "string",
        "obrigatorio": False,
        "valor_default": "Não especificado",
        "permite_filtro": True,
        "tipo_filtro": "select",
        "label": "Canal"
    }
}