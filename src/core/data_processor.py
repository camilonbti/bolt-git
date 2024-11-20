"""
Processador de dados otimizado para o dashboard
"""
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
import logging
from ..config.campos_config import (
    CAMPOS_CONFIGURACAO,
    get_mapeamento_colunas,
    get_valores_default,
    get_campos_filtraveis
)
from ..utils.date_utils import (
    TIMEZONE,
    format_date_range,
    format_timestamp,
    format_display_date,
    get_current_time
)
from functools import lru_cache
from .logger import log_manager

logger = log_manager.get_logger(__name__)

class ProcessadorDados:
    def __init__(self, config=None):
        """Inicializa o processador com configurações."""
        self.config = config or CAMPOS_CONFIGURACAO
        self.mapeamento_colunas = get_mapeamento_colunas()
        self.valores_default = get_valores_default()
        self._cache = {}
        logger.debug("ProcessadorDados inicializado com sucesso")

    def processar_dados(self, dados_brutos: List[List]) -> Dict[str, Any]:
        """
        Processa dados brutos e retorna estrutura completa para o dashboard.
        
        Args:
            dados_brutos: Lista de linhas de dados
            
        Returns:
            Dict com dados processados, KPIs e gráficos
        """
        try:
            if not dados_brutos or len(dados_brutos) < 2:
                logger.warning("Dados brutos vazios ou insuficientes")
                return self._get_estrutura_vazia()

            # Cria DataFrame inicial
            df = pd.DataFrame(dados_brutos[1:], columns=dados_brutos[0])
            df = df.rename(columns=self.mapeamento_colunas)
            
            if df.empty:
                logger.warning("DataFrame vazio após processamento inicial")
                return self._get_estrutura_vazia()

            # Pipeline de processamento
            df = self._processar_campos(df)
            df = self._processar_datas(df)
            df = self._aplicar_transformacoes(df)

            # Gera resultados
            metricas = self._calcular_metricas(df)
            graficos = self._gerar_dados_graficos(df)
            
            # Converte datas para timestamp em milissegundos
            df_serializable = df.copy()
            if 'data_hora' in df_serializable.columns:
                df_serializable['data_hora'] = df_serializable['data_hora'].apply(
                    lambda x: format_timestamp(x) if pd.notnull(x) else None
                )
            
            registros = df_serializable.to_dict('records')

            resultado = {
                'kpis': metricas,
                'graficos': graficos,
                'registros': registros,
                'ultima_atualizacao': format_timestamp(get_current_time())
            }

            logger.info(f"Dados processados: {len(registros)} registros")
            return resultado

        except Exception as e:
            logger.error(f"Erro ao processar dados: {str(e)}", exc_info=True)
            return self._get_estrutura_vazia()

    def _processar_campos(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa todos os campos aplicando valores default e validações."""
        try:
            df_processado = df.copy()
            for campo, config in self.config.items():
                nome_interno = config["nome_interno"]
                
                # Cria coluna se não existir
                if nome_interno not in df_processado.columns:
                    df_processado[nome_interno] = config["valor_default"]
                    continue
                
                # Aplica valor default para valores nulos
                df_processado[nome_interno] = df_processado[nome_interno].fillna(config["valor_default"])
                
                # Validação específica para campos obrigatórios
                if config.get("obrigatorio", False):
                    mascara_invalidos = df_processado[nome_interno].isin(['', None, 'nan', 'NaN', 'null'])
                    df_processado.loc[mascara_invalidos, nome_interno] = config["valor_default"]
                
                # Validação de valores permitidos
                if "valores_permitidos" in config:
                    mascara_invalidos = ~df_processado[nome_interno].isin(config["valores_permitidos"])
                    df_processado.loc[mascara_invalidos, nome_interno] = config["valor_default"]
            
            return df_processado
            
        except Exception as e:
            logger.error(f"Erro ao processar campos: {str(e)}")
            return df

    def _processar_datas(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa campos de data com tratamento de erro robusto."""
        try:
            df_processado = df.copy()
            data_config = self.config["Carimbo de data/hora"]
            campo_data = data_config["nome_interno"]
            
            if campo_data not in df_processado.columns:
                logger.warning(f"Campo de data {campo_data} não encontrado")
                return df_processado
            
            def converter_data(valor):
                if pd.isna(valor) or valor == data_config["valor_default"]:
                    return format_date_range(date_only=True)
                
                try:
                    return format_date_range(valor, date_only=True)
                except:
                    logger.warning(f"Não foi possível converter data: {valor}")
                    return format_date_range(date_only=True)
            
            df_processado[campo_data] = df_processado[campo_data].apply(converter_data)
            return df_processado
            
        except Exception as e:
            logger.error(f"Erro ao processar datas: {str(e)}")
            return df

    def _aplicar_transformacoes(self, df: pd.DataFrame) -> pd.DataFrame:
        """Aplica transformações adicionais aos dados."""
        try:
            df_processado = df.copy()
            
            # Normaliza strings
            colunas_texto = ['funcionario', 'cliente', 'solicitante', 'sistema']
            for coluna in colunas_texto:
                if coluna in df_processado.columns:
                    df_processado[coluna] = df_processado[coluna].str.strip().str.title()
            
            # Calcula campos derivados
            if 'data_hora' in df_processado.columns:
                df_processado['mes'] = df_processado['data_hora'].dt.strftime('%Y-%m')
                df_processado['dia_semana'] = df_processado['data_hora'].dt.day_name()
            
            return df_processado
            
        except Exception as e:
            logger.error(f"Erro nas transformações: {str(e)}")
            return df

    def _calcular_metricas(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calcula KPIs principais do dashboard."""
        try:
            total_registros = len(df)
            
            if total_registros == 0:
                return self._get_kpis_vazios()

            # Status
            status_counts = df['status_atendimento'].value_counts()
            concluidos = status_counts.get('Concluído', 0)
            pendentes = status_counts.get('Pendente', 0)
            
            # Taxa de conclusão
            taxa_conclusao = (concluidos / total_registros * 100) if total_registros > 0 else 0
            
            # Tempo médio
            if 'data_hora' in df.columns:
                tempo_medio = df.groupby('funcionario')['data_hora'].agg(
                    lambda x: (x.max() - x.min()).total_seconds() / 60
                ).mean()
            else:
                tempo_medio = 0

            return {
                'total_registros': total_registros,
                'total_concluidos': int(concluidos),
                'total_pendentes': int(pendentes),
                'taxa_conclusao': round(taxa_conclusao, 1),
                'tempo_medio': round(float(tempo_medio if pd.notnull(tempo_medio) else 0), 1)
            }
            
        except Exception as e:
            logger.error(f"Erro ao calcular KPIs: {str(e)}")
            return self._get_kpis_vazios()

    def _gerar_dados_graficos(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Gera dados para todos os gráficos do dashboard."""
        try:
            graficos = {
                'status': self._contar_por_coluna(df, 'status_atendimento'),
                'tipo': self._contar_por_coluna(df, 'tipo_atendimento', 10),
                'funcionario': self._contar_por_coluna(df, 'funcionario', 10),
                'cliente': self._contar_por_coluna(df, 'cliente', 10),
                'sistema': self._contar_por_coluna(df, 'sistema', 10),
                'canal': self._contar_por_coluna(df, 'canal_atendimento'),
                'timeline': self._gerar_timeline(df),
                'relato': self._contar_por_coluna(df, 'solicitacao_cliente', 10),
                'solicitacao': self._contar_por_coluna(df, 'tipo_atendimento', 10)
            }
            
            logger.debug("Dados dos gráficos gerados com sucesso")
            return graficos
            
        except Exception as e:
            logger.error(f"Erro ao gerar dados dos gráficos: {str(e)}")
            return self._get_graficos_vazios()

    def _contar_por_coluna(self, df: pd.DataFrame, coluna: str, limite: Optional[int] = None) -> Dict[str, List]:
        """Conta ocorrências em uma coluna."""
        try:
            if coluna not in df.columns:
                logger.warning(f"Coluna {coluna} não encontrada no DataFrame")
                return {'labels': [], 'values': []}
                
            contagem = df[coluna].value_counts()
            if limite:
                contagem = contagem.head(limite)
            return {
                'labels': contagem.index.tolist(),
                'values': contagem.values.tolist()
            }
        except Exception as e:
            logger.error(f"Erro ao contar valores da coluna {coluna}: {str(e)}")
            return {'labels': [], 'values': []}

    def _gerar_timeline(self, df: pd.DataFrame) -> Dict[str, List]:
        """Gera dados para o gráfico de timeline."""
        try:
            if 'data_hora' not in df.columns:
                return {'labels': [], 'values': []}
                
            df_timeline = df.copy()
            df_timeline['data'] = df_timeline['data_hora'].dt.date
            contagem_diaria = df_timeline.groupby('data').size()
            
            return {
                'labels': [format_timestamp(pd.Timestamp(d).tz_localize(TIMEZONE)) for d in contagem_diaria.index],
                'values': contagem_diaria.values.tolist()
            }
        except Exception as e:
            logger.error(f"Erro ao gerar timeline: {str(e)}")
            return {'labels': [], 'values': []}

    def _get_estrutura_vazia(self) -> Dict[str, Any]:
        """Retorna estrutura vazia do dashboard."""
        return {
            'kpis': self._get_kpis_vazios(),
            'graficos': self._get_graficos_vazios(),
            'registros': [],
            'ultima_atualizacao': format_timestamp(get_current_time())
        }

    def _get_kpis_vazios(self) -> Dict[str, Any]:
        """Retorna estrutura vazia de KPIs."""
        return {
            'total_registros': 0,
            'total_concluidos': 0,
            'total_pendentes': 0,
            'taxa_conclusao': 0.0,
            'tempo_medio': 0.0
        }

    def _get_graficos_vazios(self) -> Dict[str, List]:
        """Retorna estrutura vazia de gráficos."""
        return {
            'status': {'labels': [], 'values': []},
            'tipo': {'labels': [], 'values': []},
            'funcionario': {'labels': [], 'values': []},
            'cliente': {'labels': [], 'values': []},
            'sistema': {'labels': [], 'values': []},
            'canal': {'labels': [], 'values': []},
            'timeline': {'labels': [], 'values': []},
            'relato': {'labels': [], 'values': []},
            'solicitacao': {'labels': [], 'values': []}
        }
