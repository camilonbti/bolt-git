"""
Processador de dados para o dashboard
"""
from typing import Dict, List, Any
import pandas as pd
from datetime import datetime
import logging
from ..config.campos_config import CAMPOS_CONFIGURACAO
from .logger import log_manager
from zoneinfo import ZoneInfo

logger = log_manager.get_logger(__name__)

class ProcessadorDados:
    def __init__(self, config=None):
        self.config = config or CAMPOS_CONFIGURACAO
        self.timezone = ZoneInfo("America/Sao_Paulo")
        logger.debug("ProcessadorDados inicializado")

    def processar_dados(self, dados_brutos: List[List]) -> Dict[str, Any]:
        """Processa dados brutos e retorna estrutura completa para o dashboard."""
        try:
            logger.info("Iniciando processamento dos dados")
            
            if not dados_brutos or len(dados_brutos) < 2:
                logger.warning("Dados brutos vazios ou insuficientes")
                return self._get_estrutura_vazia()
            
            # Cria DataFrame inicial
            df = self._criar_dataframe(dados_brutos)
            if df.empty:
                return self._get_estrutura_vazia()
            
            # Processa os campos
            df = self._processar_campos(df)
            df = self._processar_datas(df)
            
            # Gera estrutura de retorno
            resultado = {
                'registros': df.to_dict('records'),
                'kpis': self._calcular_kpis(df),
                'graficos': self._gerar_dados_graficos(df),
                'ultima_atualizacao': datetime.now(self.timezone).strftime('%Y-%m-%d %H:%M:%S')
            }
            
            logger.info(f"Dados processados com sucesso: {len(df)} registros")
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
        """Processa todos os campos aplicando valores default e validações."""
        try:
            # Valores default para campos vazios
            valores_default = {
                'funcionario': 'Não informado',
                'cliente': 'Não informado',
                'solicitante': 'Não informado',
                'solicitacao_cliente': 'Não informado',
                'descricao_atendimento': 'Sem descrição',
                'status_atendimento': 'Pendente',
                'tipo_atendimento': 'Não categorizado',
                'sistema': 'Não especificado',
                'canal_atendimento': 'Não especificado'
            }
            
            # Aplica valores default e normaliza strings
            df = df.fillna(valores_default)
            for coluna in ['funcionario', 'cliente', 'solicitante', 'sistema']:
                df[coluna] = df[coluna].str.strip().str.title()
            
            # Validação específica para status
            status_validos = ['Concluído', 'Pendente', 'Cancelado', 'Em Andamento']
            df.loc[~df['status_atendimento'].isin(status_validos), 'status_atendimento'] = 'Pendente'
            
            # Validação de campos obrigatórios
            for campo, config in self.config.items():
                nome_interno = config["nome_interno"]
                if config.get("obrigatorio", False):
                    invalidos = df[nome_interno].isin(['', None, 'nan', 'NaN', 'null'])
                    if invalidos.any():
                        df.loc[invalidos, nome_interno] = config["valor_default"]
            
            logger.debug("Campos processados com sucesso")
            return df
            
        except Exception as e:
            logger.error(f"Erro ao processar campos: {str(e)}")
            return df

    def _processar_datas(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa campos de data com tratamento de erro robusto."""
        try:
            def converter_data(valor):
                if pd.isna(valor):
                    return pd.Timestamp.now(tz=self.timezone)
                
                formatos = [
                    "%d/%m/%Y %H:%M:%S",
                    "%Y-%m-%d %H:%M:%S",
                    "%Y-%m-%dT%H:%M:%S",
                    "%Y-%m-%d"
                ]
                
                for formato in formatos:
                    try:
                        data = pd.to_datetime(valor, format=formato)
                        if data.tz is None:
                            data = data.tz_localize(self.timezone)
                        return data
                    except:
                        continue
                
                try:
                    data = pd.to_datetime(valor)
                    if data.tz is None:
                        data = data.tz_localize(self.timezone)
                    return data
                except:
                    logger.warning(f"Não foi possível converter data: {valor}")
                    return pd.Timestamp.now(tz=self.timezone)
            
            df['data_hora'] = df['data_hora'].apply(converter_data)
            
            # Trata datas inválidas
            datas_invalidas = df['data_hora'].isna()
            if datas_invalidas.any():
                logger.warning(f"Encontradas {datas_invalidas.sum()} datas inválidas")
                df.loc[datas_invalidas, 'data_hora'] = pd.Timestamp.now(tz=self.timezone)
            
            return df
            
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
            concluidos = df[df['status_atendimento'] == 'Concluído'].shape[0]
            pendentes = df[df['status_atendimento'] == 'Pendente'].shape[0]
            taxa_conclusao = (concluidos / total_registros * 100)
            
            # Tempo médio de atendimento
            tempo_medio = 0
            try:
                tempo_medio = df.groupby('funcionario')['data_hora'].agg(
                    lambda x: (x.max() - x.min()).total_seconds() / 60
                ).mean()
            except:
                logger.warning("Erro ao calcular tempo médio")
            
            return {
                'total_registros': total_registros,
                'total_concluidos': concluidos,
                'total_pendentes': pendentes,
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
                'timeline': self._gerar_timeline(df)
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
            'registros': [],
            'kpis': self._get_kpis_vazios(),
            'graficos': self._get_graficos_vazios(),
            'ultima_atualizacao': datetime.now(self.timezone).strftime('%Y-%m-%d %H:%M:%S')
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

    def _get_graficos_vazios(self) -> Dict[str, Any]:
        """Retorna estrutura vazia de gráficos."""
        return {
            'status': {'labels': [], 'values': []},
            'tipo': {'labels': [], 'values': []},
            'funcionario': {'labels': [], 'values': []},
            'cliente': {'labels': [], 'values': []},
            'sistema': {'labels': [], 'values': []},
            'canal': {'labels': [], 'values': []},
            'timeline': {'labels': [], 'values': []}
        }