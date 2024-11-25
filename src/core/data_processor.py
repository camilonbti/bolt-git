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
        """Processa dados brutos e retorna estrutura completa para o dashboard."""
        try:
            if not dados_brutos or len(dados_brutos) < 2:
                logger.warning("Dados brutos vazios ou insuficientes")
                return self._get_estrutura_vazia()

            # Debug: Mostrar primeiras linhas dos dados brutos
            logger.debug("Primeiras 5 linhas dos dados brutos:")
            for i, linha in enumerate(dados_brutos[1:6]):
                if len(linha) > 0:
                    logger.debug(f"Linha {i+1} - data_hora bruto: {linha[0]}")

            # Cria DataFrame inicial
            df = pd.DataFrame(dados_brutos[1:], columns=dados_brutos[0])
            df = df.rename(columns=self.mapeamento_colunas)
            
            # Debug: Mostrar dados do campo data_hora após criar DataFrame
            if 'data_hora' in df.columns:
                logger.debug("Valores de data_hora após criar DataFrame:")
                logger.debug(df['data_hora'].head().to_list())

            # Aplica valores default e validações para cada campo
            df = self._processar_campos(df)
            
            # Concatena os campos de relato após processar os campos
            df = self._concatenar_campos_relato(df)
            
            # Debug: Mostrar dados após processar campos
            if 'data_hora' in df.columns:
                logger.debug("Valores de data_hora após processar campos:")
                logger.debug(df['data_hora'].head().to_list())

            # Processa datas com tratamento de erro específico
            df = self._processar_datas(df)
            
            # Debug: Mostrar dados após processar datas
            if 'data_hora' in df.columns:
                logger.debug("Valores de data_hora após processar datas:")
                logger.debug(df['data_hora'].head().to_list())

            resultado = {
                'kpis': self._calcular_kpis(df),
                'graficos': self._gerar_dados_graficos(df),
                'registros': df.to_dict('records'),
                'ultima_atualizacao': format_timestamp(get_current_time())
            }
            
            # Debug: Mostrar amostra dos registros finais
            logger.debug("Amostra dos registros finais:")
            for i, registro in enumerate(resultado['registros'][:5]):
                logger.debug(f"Registro {i+1} - data_hora: {registro.get('data_hora')}")

            logger.info(f"Dados processados: {len(resultado['registros'])} registros")
            return resultado
            
        except Exception as e:
            logger.error(f"Erro ao processar dados: {str(e)}", exc_info=True)
            return self._get_estrutura_vazia()

    def _concatenar_campos_relato(self, df: pd.DataFrame) -> pd.DataFrame:
        """Concatena os campos de relato detalhado em um único campo."""
        try:
            campos_relato = [
                'relato_detalhado_1', 'relato_detalhado_2', 'relato_detalhado_3',
                'relato_detalhado_4', 'relato_detalhado_5'
            ]
        
            def concatenar_relatos(row):
                relatos = []
                for campo in campos_relato:
                    if pd.notna(row.get(campo)) and str(row.get(campo)).strip():
                        relatos.append(str(row.get(campo)).strip())
                return "\n".join(relatos) if relatos else row.get('solicitacao_cliente', '')
        
            # Aplica a concatenação apenas se os campos existirem
            if all(campo in df.columns for campo in campos_relato):
                df['solicitacao_cliente'] = df.apply(concatenar_relatos, axis=1)
                df = df.drop(columns=campos_relato)
        
            return df
        
        except Exception as e:
            logger.error(f"Erro ao concatenar campos de relato: {str(e)}")
            return df


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
                
                # Debug: Mostrar valores antes de processar se for data_hora
                if nome_interno == 'data_hora':
                    logger.debug(f"Valores de {nome_interno} antes de processar:")
                    logger.debug(df_processado[nome_interno].head().to_list())
                
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
                
                # Debug: Mostrar valores após processar se for data_hora
                if nome_interno == 'data_hora':
                    logger.debug(f"Valores de {nome_interno} após processar:")
                    logger.debug(df_processado[nome_interno].head().to_list())
            
            return df_processado
            
        except Exception as e:
            logger.error(f"Erro ao processar campos: {str(e)}")
            return df

    def _processar_datas(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa campos de data preservando a hora."""
        try:
            df_processado = df.copy()
            data_config = self.config["Carimbo de data/hora"]
            campo_data = data_config["nome_interno"]
            
            if campo_data not in df_processado.columns:
                logger.warning(f"Campo de data {campo_data} não encontrado")
                return df_processado
            
            def converter_data(valor):
                if pd.isna(valor) or valor == data_config["valor_default"]:
                    logger.debug(f"Valor nulo ou default encontrado: {valor}")
                    return format_timestamp(get_current_time())
                
                try:
                    # Debug do valor antes da conversão
                    logger.debug(f"Convertendo valor: {valor} (tipo: {type(valor)})")
                    
                    # Tenta converter diretamente se for timestamp
                    if isinstance(valor, (int, float)):
                        logger.debug(f"Valor numérico encontrado: {valor}")
                        return valor
                    
                    # Se for string, tenta converter para timestamp
                    data = datetime.strptime(str(valor).strip(), "%d/%m/%Y %H:%M:%S")
                    timestamp = int(data.timestamp() * 1000)
                    logger.debug(f"String '{valor}' convertida para timestamp: {timestamp}")
                    return timestamp
                    
                except Exception as e:
                    logger.warning(f"Erro ao converter data '{valor}': {str(e)}")
                    return format_timestamp(get_current_time())
            
            # Debug antes da conversão
            logger.debug("Amostra de datas antes da conversão:")
            logger.debug(df_processado[campo_data].head().to_list())
            
            df_processado[campo_data] = df_processado[campo_data].apply(converter_data)
            
            # Debug após a conversão
            logger.debug("Amostra de datas após conversão:")
            logger.debug(df_processado[campo_data].head().to_list())
            
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
            graficos = {
                'status': self._contar_por_coluna(df, 'status_atendimento'),
                'tipo': self._contar_por_coluna(df, 'tipo_atendimento'),
                'funcionario': self._contar_por_coluna(df, 'funcionario'),
                'cliente': self._contar_por_coluna(df, 'cliente'),
                'sistema': self._contar_por_coluna(df, 'sistema'),
                'canal': self._contar_por_coluna(df, 'canal_atendimento'),
                'timeline': self._gerar_timeline(df),
                'relato': self._contar_por_coluna(df, 'solicitacao_cliente'),
                'solicitacao': self._contar_por_coluna(df, 'tipo_atendimento'),
                'relatosDetalhados': self._contar_por_coluna(df, 'solicitacao_cliente')
            }
        
            logger.debug("Dados dos gráficos gerados com sucesso")
            return graficos
        
        except Exception as e:
            logger.error(f"Erro ao gerar dados dos gráficos: {str(e)}")
            return self._get_graficos_vazios()

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
            'solicitacao': {'labels': [], 'values': []},
            'relatosDetalhados': {'labels': [], 'values': []}
        }

    def _contar_por_coluna(self, df: pd.DataFrame, coluna: str) -> Dict[str, List]:
        """Conta ocorrências em uma coluna."""
        try:
            if coluna not in df.columns:
                logger.warning(f"Coluna {coluna} não encontrada no DataFrame")
                return {'labels': [], 'values': []}
                
            contagem = df[coluna].value_counts()
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