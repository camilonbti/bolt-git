"""
Processador de dados para o dashboard
"""
from datetime import datetime, timezone
from typing import Dict, List, Any
import pandas as pd
import logging
from .config.campos_config import CAMPOS_CONFIGURACAO

logger = logging.getLogger(__name__)

class ProcessadorDados:
    def __init__(self, config=None):
        self.config = config or CAMPOS_CONFIGURACAO
        logger.debug("ProcessadorDados inicializado")

    def _processar_datas(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa campos de data com tratamento de timezone."""
        try:
            data_config = self.config["Carimbo de data/hora"]
            campo_data = data_config["nome_interno"]
            
            if campo_data not in df.columns:
                logger.warning(f"Campo de data {campo_data} não encontrado")
                return df
            
            def converter_data(valor):
                if pd.isna(valor) or valor == data_config["valor_default"]:
                    return pd.NaT
                
                try:
                    # Tenta diferentes formatos de data
                    formatos = [
                        '%d/%m/%Y %H:%M:%S',
                        '%Y-%m-%d %H:%M:%S',
                        '%d/%m/%Y',
                        '%Y-%m-%d'
                    ]
                    
                    for formato in formatos:
                        try:
                            data = pd.to_datetime(valor, format=formato)
                            if pd.notna(data):
                                # Se não tem hora, define como início do dia
                                if formato in ['%d/%m/%Y', '%Y-%m-%d']:
                                    data = data.replace(hour=0, minute=0, second=0)
                                # Garante timezone UTC
                                if data.tz is None:
                                    data = data.tz_localize('UTC')
                                return data
                        except:
                            continue
                    
                    # Última tentativa com parse automático
                    data = pd.to_datetime(valor)
                    if data.tz is None:
                        data = data.tz_localize('UTC')
                    return data
                    
                except Exception as e:
                    logger.warning(f"Erro ao converter data '{valor}': {str(e)}")
                    return pd.NaT
            
            df[campo_data] = df[campo_data].apply(converter_data)
            
            # Trata datas inválidas
            datas_invalidas = df[campo_data].isna()
            if datas_invalidas.any():
                logger.warning(f"Encontradas {datas_invalidas.sum()} datas inválidas")
                df.loc[datas_invalidas, campo_data] = pd.Timestamp.now(tz='UTC')
            
            # Adiciona colunas auxiliares para filtros
            df['data'] = df[campo_data].dt.date
            df['hora'] = df[campo_data].dt.strftime('%H:%M')
            
            return df
            
        except Exception as e:
            logger.error(f"Erro ao processar datas: {str(e)}")
            return df

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
            
            # Processa datas primeiro
            df = self._processar_datas(df)
            
            # Processa demais campos
            df = self._processar_campos(df)
            
            # Prepara resultado
            resultado = {
                'kpis': self._calcular_metricas(df),
                'graficos': self._gerar_dados_graficos(df),
                'registros': self._preparar_registros(df),
                'ultima_atualizacao': datetime.now(timezone.utc).isoformat()
            }
            
            logger.info(f"Dados processados: {len(resultado['registros'])} registros")
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
            
            logger.debug("Campos processados com sucesso")
            return df
            
        except Exception as e:
            logger.error(f"Erro ao processar campos: {str(e)}")
            return df

    def _preparar_registros(self, df: pd.DataFrame) -> List[Dict]:
        """Prepara registros para retorno, formatando datas."""
        try:
            registros = []
            for _, row in df.iterrows():
                registro = row.to_dict()
                
                # Formata data_hora para ISO com timezone
                if pd.notna(registro['data_hora']):
                    registro['data_hora'] = registro['data_hora'].isoformat()
                    
                # Adiciona campos formatados para exibição
                registro['data_formatada'] = row['data'].strftime('%d/%m/%Y') if pd.notna(row['data']) else ''
                registro['hora_formatada'] = row['hora'] if pd.notna(row['hora']) else ''
                
                registros.append(registro)
            
            return registros
        except Exception as e:
            logger.error(f"Erro ao preparar registros: {str(e)}")
            return []

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

            return {
                'total_registros': total_registros,
                'taxa_conclusao': round(taxa_conclusao, 1),
                'tempo_medio': round(float(tempo_medio), 1),
                'total_pendentes': total_registros - concluidos
            }
            
        except Exception as e:
            logger.error(f"Erro ao calcular métricas: {str(e)}")
            return self._get_metricas_vazias()

    def _gerar_dados_graficos(self, df: pd.DataFrame) -> Dict[str, Dict[str, List]]:
        """Gera dados para todos os gráficos."""
        try:
            return {
                'status': self._contar_valores(df, 'status_atendimento'),
                'tipo': self._contar_valores(df, 'tipo_atendimento', 10),
                'funcionario': self._contar_valores(df, 'funcionario', 10),
                'cliente': self._contar_valores(df, 'cliente', 10),
                'sistema': self._contar_valores(df, 'sistema', 10),
                'canal': self._contar_valores(df, 'canal_atendimento'),
                'solicitacao': self._contar_valores(df, 'solicitacao_cliente', 15)
            }
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
            'ultima_atualizacao': datetime.now(timezone.utc).isoformat()
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