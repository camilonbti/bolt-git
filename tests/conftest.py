import pytest
import sys
import os

# Adiciona o diretório raiz ao PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.fixture
def dados_teste():
    """Fixture com dados de teste padrão."""
    return [
        ["Carimbo de data/hora", "Prestador de Serviços:", "Empresa atendida:", 
         "Nome do solicitante:", "Relato do pedido de atendimento:",
         "Relato mais detalhado do pedido do cliente:", "Status do atendimento:",
         "Tipo do atendimento solicitado:", "Sistema do cliente:",
         "Qual(s) canal(s) utilizado(s) para realizar o atendimento? "],
        ["01/01/2024 10:00:00", "joão silva", "empresa teste", "maria oliveira",
         "Problema no sistema", "Cliente não consegue acessar", "Concluído",
         "Suporte Técnico", "Sistema A", "Email"]
    ]

@pytest.fixture
def config_teste():
    """Fixture com configurações de teste."""
    from src.config.campos_config import CAMPOS_CONFIGURACAO
    return CAMPOS_CONFIGURACAO