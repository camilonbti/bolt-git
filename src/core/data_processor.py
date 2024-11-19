"""
Processador de dados para o dashboard
"""
from typing import Dict, List, Any
import pandas as pd
from datetime import datetime
import logging
from ..config.campos_config import CAMPOS_CONFIGURACAO

logger = logging.getLogger(__name__)

class ProcessadorDados:
    def __init__(self, config=None):
        self.config = config or CAMPOS_CONFIGURACAO
        logger.debug("ProcessadorDados inicializado")

    def processar_dados(self, dados_brutos: List[List]) -> Dict[str, Any]:
        """Processa dados brutos com validação."""
        try:
            if not dados_brutos or len(dados_brutos) < 2:
                logger.warning("Dados brutos vazios ou insuficientes")
                return self._get_estrutura_vazia()
                
            # Converte para DataFrame
            df = self._criar_dataframe(dados_brutos)
            if df.empty:
                return self._get_estrutura_vazia()
            
            # Processa e valida campos
            df = self._processar_campos(df)
            
            # Calcula métricas
            metricas = self._calcular_metricas(df)
            
            # Prepara dados para gráficos
            graficos = self._gerar_dados_graficos(df)
            
            # Prepara registros para tabela
            registros = df.to_dict('records')
            
            resultado = {
                'kpis': metricas,
                'graficos': graficos,
                'registros': registros,
                'ultima_atualizacao': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
            }
            
            logger.info(f"Dados processados: {len(registros)} registros")
            logger.debug(f"KPIs calculados: {metricas}")
            logger.debug(f"Gráficos gerados: {list(graficos.keys())}")
            
            return resultado
            
        except Exception as e:
            logger.error(f"Erro ao processar dados: {str(e)}", exc_info=True)
            return self._get_estrutura_vazia()

    def _criar_dataframe(self, dados_brutos: List[List]) -> pd.DataFrame:
        """Cria DataFrame a partir dos dados brutos."""
        try:
            cabecalho = dados_brutos[0]
            dados = dados_brutos[1:]
            
            # Mapeia nomes das colunas
            mapeamento_colunas = {
                'Carimbo de data/hora': 'data_hora',
                'Prestador de Serviços:': 'funcionario',
                'Empresa atendida:': 'cliente',
                'Nome do solicitante:': 'solicitante',
                'Relato do pedido de atendimento:': 'solicitacao_cliente',
                'Relato mais detalhado do pedido do cliente:': 'descricao_atendimento',
                'Status do atendimento:': 'status_atendimento',
                'Tipo do atendimento solicitado:': 'tipo_atendimento',
                'Sistema do cliente:': 'sistema',
                'Qual(s) canal(s) utilizado(s) para realizar o atendimento? ': 'canal_atendimento'
            }
            
            df = pd.DataFrame(dados, columns=cabecalho)
            df = df.rename(columns=mapeamento_colunas)
            
            logger.debug(f"DataFrame criado com {len(df)} linhas")
            return df
        except Exception as e:
            logger.error(f"Erro ao criar DataFrame: {str(e)}")
            return pd.DataFrame()

    def _processar_campos(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa e valida campos do DataFrame."""
        try:
            # Trata valores nulos
            df = df.fillna({
                'funcionario': 'Não informado',
                'cliente': 'Não informado',
                'solicitante': 'Não informado',
                'solicitacao_cliente': 'Não informado',
                'descricao_atendimento': 'Não informado',
                'status_atendimento': 'Pendente',
                'tipo_atendimento': 'Não categorizado',
                'sistema': 'Não especificado',
                'canal_atendimento': 'Não especificado'
            })
            
            # Normaliza strings
            for coluna in ['funcionario', 'cliente', 'solicitante', 'sistema']:
                df[coluna] = df[coluna].str.strip().str.title()
            
            # Processa datas
            df['data_hora'] = pd.to_datetime(df['data_hora'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
            df['data_hora'] = df['data_hora'].fillna(pd.Timestamp.now())
            
            logger.debug("Campos processados com sucesso")
            return df
            
        except Exception as e:
            logger.error(f"Erro ao processar campos: {str(e)}")
            return df

    def _calcular_metricas(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calcula métricas principais."""
        try:
            total_registros = len(df)
            
            if total_registros == 0:
                return self._get_metricas_vazias()

            # Status
            concluidos = df[df['status_atendimento'] == 'Concluído'].shape[0]
            taxa_conclusao = (concluidos / total_registros * 100)
            
            # Tempo médio (em minutos)
            tempo_medio = df.groupby('funcionario')['data_hora'].agg(
                lambda x: (x.max() - x.min()).total_seconds() / 60
            ).mean()
            
            if pd.isna(tempo_medio):
                tempo_medio = 0

            metricas = {
                'total_registros': total_registros,
                'taxa_conclusao': round(taxa_conclusao, 1),
                'tempo_medio': round(float(tempo_medio), 1),
                'total_pendentes': total_registros - concluidos
            }
            
            logger.debug(f"Métricas calculadas: {metricas}")
            return metricas
            
        except Exception as e:
            logger.error(f"Erro ao calcular métricas: {str(e)}")
            return self._get_metricas_vazias()

    def _gerar_dados_graficos(self, df: pd.DataFrame) -> Dict[str, Dict[str, List]]:
        """Gera dados para todos os gráficos."""
        try:
            graficos = {
                'status': self._contar_valores(df, 'status_atendimento'),
                'tipo': self._contar_valores(df, 'tipo_atendimento', 10),
                'funcionario': self._contar_valores(df, 'funcionario', 10),
                'cliente': self._contar_valores(df, 'cliente', 10),
                'sistema': self._contar_valores(df, 'sistema', 10),
                'canal': self._contar_valores(df, 'canal_atendimento'),
                'solicitacao': self._contar_valores(df, 'solicitacao_cliente', 15)
            }
            
            logger.debug(f"Dados dos gráficos gerados: {list(graficos.keys())}")
            return graficos
            
        except Exception as e:
            logger.error(f"Erro ao gerar dados dos gráficos: {str(e)}")
            return self._get_graficos_vazios()

    def _contar_valores(self, df: pd.DataFrame, coluna: str, limite: int = None) -> Dict[str, List]:
        """Conta valores únicos em uma coluna."""
        try:
            if coluna not in df.columns:
                logger.warning(f"Coluna {coluna} não encontrada")
                return {'labels': [], 'values': []}
                
            contagem = df[coluna].value_counts()
            
            if limite:
                contagem = contagem.head(limite)
            
            return {
                'labels': contagem.index.tolist(),
                'values': contagem.values.tolist()
            }
        except Exception as e:
            logger.error(f"Erro ao contar valores de {coluna}: {str(e)}")
            return {'labels': [], 'values': []}

    def _get_estrutura_vazia(self) -> Dict[str, Any]:
        """Retorna estrutura vazia de dados."""
        return {
            'kpis': self._get_metricas_vazias(),
            'graficos': self._get_graficos_vazios(),
            'registros': [],
            'ultima_atualizacao': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
        }

    def _get_metricas_vazias(self) -> Dict[str, Any]:
        """Retorna estrutura vazia de métricas."""
        return {
            'total_registros': 0,
            'taxa_conclusao': 0.0,
            'tempo_medio': 0.0,
            'total_pendentes': 0
        }

    def _get_graficos_vazios(self) -> Dict[str, Dict[str, List]]:
        """Retorna estrutura vazia de gráficos."""
        return {
            'status': {'labels': [], 'values': []},
            'tipo': {'labels': [], 'values': []},
            'funcionario': {'labels': [], 'values': []},
            'cliente': {'labels': [], 'values': []},
            'sistema': {'labels': [], 'values': []},
            'canal': {'labels': [], 'values': []},
            'solicitacao': {'labels': [], 'values': []}
        }