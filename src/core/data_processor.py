"""
Processador de dados otimizado para o dashboard
"""
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
import logging
from datetime import datetime
from ..config.campos_config import (
    CAMPOS_CONFIGURACAO,
    STATUS_PERMITIDOS,
    get_mapeamento_colunas,
    get_valores_default,
    get_campos_filtraveis,
    get_campo_config
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
        """Processa dados brutos e retorna estrutura completa para o dashboard."""
        try:
            if not dados_brutos or len(dados_brutos) < 2:
                logger.warning("Dados brutos vazios ou insuficientes")
                return self._get_estrutura_vazia()

            # Obtém apenas as colunas que estão no mapeamento
            colunas_mapeadas = [col for col in dados_brutos[0] if col in self.mapeamento_colunas]
            dados_filtrados = []
            
            # Filtra os dados para incluir apenas as colunas mapeadas
            for linha in dados_brutos[1:]:
                dados_filtrados.append([valor for col, valor in zip(dados_brutos[0], linha) if col in self.mapeamento_colunas])

            # Cria DataFrame com as colunas mapeadas
            df = pd.DataFrame(dados_filtrados, columns=colunas_mapeadas)
            df = df.rename(columns=self.mapeamento_colunas)

            # Aplica valores default e validações para cada campo
            df = self._processar_campos(df)
            
            # Processa datas com tratamento de erro específico
            df = self._processar_datas(df)

            resultado = {
                'kpis': self._calcular_kpis(df),
                'graficos': self._gerar_dados_graficos(df),
                'registros': df.to_dict('records'),
                'ultima_atualizacao': format_timestamp(get_current_time())
            }

            logger.info(f"Dados processados: {len(resultado['registros'])} registros")
            return resultado
            
        except Exception as e:
            logger.error(f"Erro ao processar dados: {str(e)}", exc_info=True)
            return self._get_estrutura_vazia()

    def _processar_campos(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa todos os campos aplicando valores default e validações."""
        try:
            df_processado = df.copy()
            campos_ordenados = sorted(
                self.config.items(), 
                key=lambda x: x[1].get('ordem', 999)
            )
            
            for campo, config in campos_ordenados:
                nome_interno = config["nome_interno"]
                
                # Cria coluna se não existir
                if nome_interno not in df_processado.columns:
                    df_processado[nome_interno] = config["valor_default"]
                    continue
                
                # Aplica valor default para valores nulos
                df_processado[nome_interno] = df_processado[nome_interno].fillna(config["valor_default"])
                
                # Validação específica para campos obrigatórios
                if config.get("obrigatorio", False):
                    invalidos = df_processado[nome_interno].isin(['', None, 'nan', 'NaN', 'null'])
                    df_processado.loc[invalidos, nome_interno] = config["valor_default"]
                
                # Validação de valores permitidos
                if "valores_permitidos" in config:
                    invalidos = ~df_processado[nome_interno].isin(config["valores_permitidos"])
                    df_processado.loc[invalidos, nome_interno] = config["valor_default"]
            
            return df_processado
            
        except Exception as e:
            logger.error(f"Erro ao processar campos: {str(e)}")
            return df

    def _processar_datas(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa campos de data preservando a hora."""
        try:
            df_processado = df.copy()
            data_config = get_campo_config("Carimbo de data/hora")
            campo_data = data_config["nome_interno"]
            
            if campo_data not in df_processado.columns:
                logger.warning(f"Campo de data {campo_data} não encontrado")
                return df_processado
            
            def converter_data(valor):
                if pd.isna(valor) or valor == data_config["valor_default"]:
                    return format_timestamp(get_current_time())
                
                try:
                    if isinstance(valor, (int, float)):
                        return valor
                    
                    data = datetime.strptime(str(valor).strip(), data_config["formato"])
                    return format_timestamp(data)
                    
                except Exception as e:
                    logger.warning(f"Erro ao converter data '{valor}': {str(e)}")
                    return format_timestamp(get_current_time())
            
            df_processado[campo_data] = df_processado[campo_data].apply(converter_data)
            
            return df_processado
            
        except Exception as e:
            logger.error(f"Erro ao processar datas: {str(e)}")
            return df

    def _calcular_kpis(self, df: pd.DataFrame) -> Dict[str, Any]:
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
            tempo_medio = 0
            if 'data_hora' in df.columns:
                tempo_medio = df.groupby('funcionario')['data_hora'].agg(
                    lambda x: (x.max() - x.min()) / (1000 * 60)  # Convertendo de ms para minutos
                ).mean()

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
            campos_filtraveis = get_campos_filtraveis()
            graficos = {}
            
            for campo, config in campos_filtraveis.items():
                nome_interno = config["nome_interno"]
                if nome_interno in df.columns:
                    graficos[nome_interno.replace('_', '')] = self._contar_por_coluna(
                        df, 
                        nome_interno, 
                        limite=10 if config.get('tipo_filtro') == 'select' else None
                    )
            
            graficos['timeline'] = self._gerar_timeline(df)
            
            logger.debug("Dados dos gráficos gerados com sucesso")
            return graficos
            
        except Exception as e:
            logger.error(f"Erro ao gerar dados dos gráficos: {str(e)}")
            return self._get_graficos_vazios()

    def _contar_por_coluna(self, df: pd.DataFrame, coluna: str, limite: int = None) -> Dict[str, List]:
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
            df_timeline['data'] = pd.to_datetime(df_timeline['data_hora'], unit='ms').dt.date
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
        campos_filtraveis = get_campos_filtraveis()
        graficos_vazios = {
            nome_interno.replace('_', ''): {'labels': [], 'values': []}
            for _, config in campos_filtraveis.items()
            if config.get('permite_filtro', False)
        }
        graficos_vazios['timeline'] = {'labels': [], 'values': []}
        return graficos_vazios