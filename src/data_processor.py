"""
Processador de dados para o dashboard
"""
from datetime import datetime, timezone
from typing import Dict, List, Any
import pandas as pd
import logging
from .config.campos_config import CAMPOS_CONFIGURACAO
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

class ProcessadorDados:
    def __init__(self, config=None):
        self.config = config or CAMPOS_CONFIGURACAO
        self.timezone = ZoneInfo("America/Sao_Paulo")
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

    def _processar_campos(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa todos os campos aplicando valores default e validações."""
        try:
            for campo, config in self.config.items():
                nome_interno = config["nome_interno"]
                
                if nome_interno not in df.columns:
                    df[nome_interno] = config["valor_default"]
                    continue
                
                df[nome_interno].fillna(config["valor_default"], inplace=True)
                
                if config.get("obrigatorio", False):
                    invalidos = df[nome_interno].isin(['', None, 'nan', 'NaN', 'null'])
                    if invalidos.any():
                        df.loc[invalidos, nome_interno] = config["valor_default"]
                
                if "valores_permitidos" in config:
                    invalidos = ~df[nome_interno].isin(config["valores_permitidos"])
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
                    return pd.NaT
                
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
                    return pd.NaT
            
            df[campo_data] = df[campo_data].apply(converter_data)
            
            datas_invalidas = df[campo_data].isna()
            if datas_invalidas.any():
                logger.warning(f"Encontradas {datas_invalidas.sum()} datas inválidas")
                df.loc[datas_invalidas, campo_data] = pd.Timestamp.now(tz=self.timezone)
            
            return df
            
        except Exception as e:
            logger.error(f"Erro ao processar datas: {str(e)}")
            return df

    def _criar_dataframe(self, dados_brutos: List[List]) -> pd.DataFrame:
        """Cria DataFrame a partir dos dados brutos."""
        try:
            cabecalho = dados_brutos[0]
            dados = dados_brutos[1:]
            
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
            'timeline': {'labels': [], 'values': []}
        }