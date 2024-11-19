from datetime import datetime
import logging
from collections import Counter

logger = logging.getLogger(__name__)

class ProcessadorDados:
    def __init__(self):
        self.config = {
            "Carimbo de data/hora": {
                "nome_interno": "data_hora",
                "tipo": "datetime",
                "formato": "%d/%m/%Y %H:%M:%S"
            },
            "Prestador de Serviços:": {
                "nome_interno": "funcionario",
                "tipo": "string"
            },
            "Empresa atendida:": {
                "nome_interno": "cliente",
                "tipo": "string"
            },
            "Status do atendimento:": {
                "nome_interno": "status_atendimento",
                "tipo": "string"
            },
            "Relato mais detalhado do pedido do cliente:": {
                "nome_interno": "descricao_atendimento",
                "tipo": "string"
            }
        }

    def converter_valor(self, valor, config):
        """Converte valor para o tipo apropriado com validação."""
        try:
            if not valor:
                return None
                
            if config["tipo"] == "datetime":
                try:
                    return datetime.strptime(valor, config["formato"])
                except ValueError:
                    logger.warning(f"Erro ao converter data: {valor}")
                    return None
                    
            return str(valor).strip()
        except Exception as e:
            logger.error(f"Erro ao converter valor: {str(e)}")
            return None

    def formatar_dados(self, dados_brutos):
        """Processa dados brutos da planilha com validação."""
        if not dados_brutos:
            logger.warning("Dados brutos vazios")
            return []
            
        try:
            cabecalho = dados_brutos[0]
            dados_formatados = []
            
            for linha in dados_brutos[1:]:
                registro = dict(zip(cabecalho, linha))
                registro_formatado = {}
                
                for campo_original, config in self.config.items():
                    if campo_original in registro:
                        valor = registro[campo_original]
                        valor_formatado = self.converter_valor(valor, config)
                        if valor_formatado is not None:
                            registro_formatado[config["nome_interno"]] = valor_formatado
                
                if self.validar_registro(registro_formatado):
                    dados_formatados.append(registro_formatado)
            
            logger.info(f"Dados formatados com sucesso: {len(dados_formatados)} registros")
            return dados_formatados
            
        except Exception as e:
            logger.error(f"Erro ao processar dados: {str(e)}")
            return []

    def validar_registro(self, registro):
        """Valida se o registro contém todos os campos obrigatórios."""
        campos_obrigatorios = ["data_hora", "status_atendimento"]
        return all(campo in registro for campo in campos_obrigatorios)

    def calcular_estatisticas(self, dados):
        """Calcula estatísticas para os gráficos com validação."""
        try:
            if not dados:
                logger.warning("Dados vazios ao calcular estatísticas")
                return self.get_estatisticas_vazias()

            # Contagem de status
            status_count = Counter(
                item['status_atendimento'] 
                for item in dados 
                if 'status_atendimento' in item
            )
            
            if not status_count:
                logger.warning("Nenhum status encontrado")
                return self.get_estatisticas_vazias()

            return {
                'status': {
                    'labels': list(status_count.keys()),
                    'values': list(status_count.values())
                }
            }
        except Exception as e:
            logger.error(f"Erro ao calcular estatísticas: {str(e)}")
            return self.get_estatisticas_vazias()

    def get_estatisticas_vazias(self):
        """Retorna estrutura vazia padrão para estatísticas."""
        return {
            'status': {
                'labels': [],
                'values': []
            }
        }