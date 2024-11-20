"""
Processador de dados para o dashboard
"""
from typing import Dict, List, Any
from datetime import datetime, time
import pandas as pd
import logging
from ..config.campos_config import CAMPOS_CONFIGURACAO, get_mapeamento_colunas, get_valores_default
from zoneinfo import ZoneInfo
from .logger import log_manager

logger = log_manager.get_logger(__name__)

class ProcessadorDados:
    def __init__(self, config=None):
        self.config = config or CAMPOS_CONFIGURACAO
        self.timezone = ZoneInfo("America/Sao_Paulo")
        self.mapeamento_colunas = get_mapeamento_colunas()
        self.valores_default = get_valores_default()
        logger.debug("ProcessadorDados inicializado")

    def processar_dados(self, dados_brutos: List[List]) -> Dict[str, Any]:
        """Processa dados brutos com validação."""
        try:
            if not dados_brutos or len(dados_brutos) < 2:
                logger.warning("Dados brutos vazios ou insuficientes")
                return self._get_estrutura_vazia()
                
            df = self._criar_dataframe(dados_brutos)
            if df.empty:
                return self._get_estrutura_vazia()
            
            df = self._processar_campos(df)
            df = self._processar_datas(df)
            
            metricas = self._calcular_metricas(df)
            graficos = self._gerar_dados_graficos(df)
            registros = df.to_dict('records')
            
            resultado = {
                'kpis': metricas,
                'graficos': graficos,
                'registros': registros,
                'ultima_atualizacao': datetime.now(self.timezone).strftime('%d/%m/%Y %H:%M:%S')
            }
            
            logger.info(f"Dados processados: {len(registros)} registros")
            return resultado
            
        except Exception as e:
            logger.error(f"Erro ao processar dados: {str(e)}", exc_info=True)
            return self._get_estrutura_vazia()

    def _criar_dataframe(self, dados_brutos: List[List]) -> pd.DataFrame:
        """Cria DataFrame a partir dos dados brutos."""
        try:
            cabecalho = dados_brutos[0]
            dados = dados_brutos[1:]
            
            df = pd.DataFrame(dados, columns=cabecalho)
            df = df.rename(columns=self.mapeamento_colunas)
            
            logger.debug(f"DataFrame criado com {len(df)} linhas")
            return df
            
        except Exception as e:
            logger.error(f"Erro ao criar DataFrame: {str(e)}")
            return pd.DataFrame()

    def _processar_campos(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa todos os campos aplicando valores default e validações."""
        try:
            # Aplica valores default para campos vazios
            df = df.fillna(self.valores_default)
            
            # Normaliza strings
            for coluna in ['funcionario', 'cliente', 'solicitante', 'sistema']:
                if coluna in df.columns:
                    df[coluna] = df[coluna].str.strip().str.title()
            
            # Validação específica para status
            status_config = self.config["Status do atendimento:"]
            if "valores_permitidos" in status_config:
                status_validos = status_config["valores_permitidos"]
                df.loc[~df['status_atendimento'].isin(status_validos), 'status_atendimento'] = status_config["valor_default"]
            
            # Validação de campos obrigatórios
            for campo, config in self.config.items():
                nome_interno = config["nome_interno"]
                if config.get("obrigatorio", False):
                    invalidos = df[nome_interno].isin(['', None, 'nan', 'NaN', 'null'])
                    if invalidos.any():
                        df.loc[invalidos, nome_interno] = config["valor_default"]
            
            return df
            
        except Exception as e:
            logger.error(f"Erro ao processar campos: {str(e)}")
            return df

    def _processar_datas(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa campos de data com tratamento de erro robusto."""
        try:
            data_config = self.config["Carimbo de data/hora"]
            campo_data = data_config["nome_interno"]
            
            if campo_data not in df.columns:
                logger.warning(f"Campo de data {campo_data} não encontrado")
                return df
            
            def converter_data(valor):
                if pd.isna(valor) or valor == data_config["valor_default"]:
                    # Define data atual com início do dia (00:00:00)
                    hoje = pd.Timestamp.now(tz=self.timezone)
                    return hoje.replace(hour=0, minute=0, second=0, microsecond=0)
                
                formatos = [
                    "%d/%m/%Y %H:%M:%S",
                    "%Y-%m-%d %H:%M:%S",
                    "%Y-%m-%dT%H:%M:%S",
                    "%Y-%m-%d"
                ]
                
                for formato in formatos:
                    try:
                        # Tenta converter com o formato específico
                        data = pd.to_datetime(valor, format=formato)
                        
                        # Se é só data sem hora, define início do dia
                        if formato == "%Y-%m-%d":
                            data = data.replace(hour=0, minute=0, second=0, microsecond=0)
                        
                        # Se não tem timezone, assume horário de Brasília
                        if data.tz is None:
                            data = data.tz_localize(self.timezone)
                        else:
                            # Se tem timezone diferente, converte para Brasília
                            data = data.tz_convert(self.timezone)
                        
                        return data
                    except:
                        continue
                
                try:
                    # Última tentativa com parse automático
                    data = pd.to_datetime(valor)
                    if data.tz is None:
                        data = data.tz_localize(self.timezone)
                    else:
                        data = data.tz_convert(self.timezone)
                    return data
                except:
                    logger.warning(f"Não foi possível converter data: {valor}")
                    hoje = pd.Timestamp.now(tz=self.timezone)
                    return hoje.replace(hour=0, minute=0, second=0, microsecond=0)
            
            df[campo_data] = df[campo_data].apply(converter_data)
            
            # Trata datas inválidas
            datas_invalidas = df[campo_data].isna()
            if datas_invalidas.any():
                logger.warning(f"Encontradas {datas_invalidas.sum()} datas inválidas")
                hoje = pd.Timestamp.now(tz=self.timezone)
                df.loc[datas_invalidas, campo_data] = hoje.replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
            
            return df
            
        except Exception as e:
            logger.error(f"Erro ao processar datas: {str(e)}")
            return df

    def _get_day_range(self, date):
        """Retorna o início e fim do dia para uma data."""
        # Início do dia (00:00:00.000)
        start = pd.Timestamp(date).tz_localize(self.timezone).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        
        # Fim do dia (23:59:59.999999)
        end = pd.Timestamp(date).tz_localize(self.timezone).replace(
            hour=23, minute=59, second=59, microsecond=999999
        )
        
        return start, end

    def _calcular_metricas(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calcula KPIs principais do dashboard."""
        try:
            total_registros = len(df)
            
            if total_registros == 0:
                return self._get_kpis_vazios()

            # Status
            status_config = self.config["Status do atendimento:"]
            concluidos = df[df[status_config["nome_interno"]] == "Concluído"].shape[0]
            taxa_conclusao = (concluidos / total_registros * 100)
            
            # Tempo médio
            tempo_medio = 0
            try:
                tempo_medio = df.groupby('funcionario')['data_hora'].agg(
                    lambda x: (x.max() - x.min()).total_seconds() / 60
                ).mean()
            except:
                logger.warning("Erro ao calcular tempo médio")

            return {
                'total_registros': total_registros,
                'taxa_conclusao': round(taxa_conclusao, 1),
                'tempo_medio': round(float(tempo_medio if pd.notnull(tempo_medio) else 0), 1),
                'total_pendentes': total_registros - concluidos
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
            # Converte para timezone local e extrai apenas a data
            df['data'] = df['data_hora'].dt.tz_convert(self.timezone).dt.date
            contagem_diaria = df.groupby('data').size()
            
            return {
                'labels': [d.strftime('%d/%m/%Y') for d in contagem_diaria.index],
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
            'ultima_atualizacao': datetime.now(self.timezone).strftime('%d/%m/%Y %H:%M:%S')
        }

    def _get_kpis_vazios(self) -> Dict[str, Any]:
        """Retorna estrutura vazia de KPIs."""
        return {
            'total_registros': 0,
            'taxa_conclusao': 0.0,
            'tempo_medio': 0.0,
            'total_pendentes': 0
        }

    def _get_graficos_vazios(self) -> Dict[str, Any]:
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
