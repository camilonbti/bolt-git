"""
Processador de dados para o dashboard.
Responsável por transformar dados brutos em estrutura processada para visualização.
"""
from typing import Dict, List, Any
import pandas as pd
from datetime import datetime
import logging
from ..config.campos_config import CAMPOS_CONFIG
from ..utils.formatters import Formatters
from .logger import log_manager

logger = log_manager.get_logger(__name__)

class ProcessadorDados:
    def __init__(self):
        """Inicializa o processador com configurações."""
        self.config = CAMPOS_CONFIG

    def processar_dados(self, dados_brutos: List[List]) -> Dict[str, Any]:
        """Processa dados brutos e retorna estrutura para o dashboard."""
        try:
            if not dados_brutos or len(dados_brutos) < 2:
                logger.error("Dados brutos vazios ou insuficientes")
                return self._get_estrutura_vazia()

            # Cria DataFrame inicial
            df = pd.DataFrame(dados_brutos[1:], columns=dados_brutos[0])
            
            # Processa campos e datas
            df = self._processar_campos(df)
            df = self._processar_datas(df)
            
            # Remove registros sem data válida
            df = df[df['data_atendimento'].notna()].copy()
            
            if df.empty:
                logger.error("Nenhum registro com data válida encontrado")
                return self._get_estrutura_vazia()

            # Concatena campos de relato
            df = self._concatenar_campos_relato(df)

            return {
                'registros': df.to_dict('records'),
                'ultima_atualizacao': Formatters.format_datetime(datetime.now())
            }
            
        except Exception as e:
            logger.error(f"Erro ao processar dados: {str(e)}")
            return self._get_estrutura_vazia()

    def _processar_campos(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa campos aplicando valores default e validações."""
        try:
            df_processado = df.copy()
            for campo, config in self.config.items():
                nome_interno = config["nome_interno"]
                
                if nome_interno not in df_processado.columns:
                    df_processado[nome_interno] = config["valor_default"]
                    continue
                
                df_processado[nome_interno] = df_processado[nome_interno].fillna(config["valor_default"])
                
                if config.get("obrigatorio", False):
                    invalidos = df_processado[nome_interno].isin(['', None, 'nan', 'NaN', 'null'])
                    df_processado.loc[invalidos, nome_interno] = config["valor_default"]
                
                if "valores_permitidos" in config:
                    invalidos = ~df_processado[nome_interno].isin(config["valores_permitidos"])
                    df_processado.loc[invalidos, nome_interno] = config["valor_default"]
            
            return df_processado
            
        except Exception as e:
            logger.error(f"Erro ao processar campos: {str(e)}")
            return df

    def _processar_datas(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa campos de data extraindo data e hora do atendimento."""
        try:
            if 'data_hora' not in df.columns:
                logger.error("Campo data_hora não encontrado")
                return df

            def extrair_data_hora(valor):
                try:
                    if pd.isna(valor) or not str(valor).strip():
                        return pd.Series({'data_atendimento': None, 'hora_atendimento': None})
                    
                    data = datetime.strptime(str(valor).strip(), '%d/%m/%Y %H:%M:%S')
                    return pd.Series({
                        'data_atendimento': data.strftime('%d/%m/%Y'),
                        'hora_atendimento': data.strftime('%H:%M:%S')
                    })
                except Exception as e:
                    logger.error(f"Erro ao processar data '{valor}': {str(e)}")
                    return pd.Series({'data_atendimento': None, 'hora_atendimento': None})

            df[['data_atendimento', 'hora_atendimento']] = df['data_hora'].apply(extrair_data_hora)
            
            registros_invalidos = df['data_atendimento'].isna().sum()
            if registros_invalidos > 0:
                logger.warning(f"Encontrados {registros_invalidos} registros com data inválida")
            
            return df
            
        except Exception as e:
            logger.error(f"Erro ao processar datas: {str(e)}")
            return df

    def _concatenar_campos_relato(self, df: pd.DataFrame) -> pd.DataFrame:
        """Concatena campos de relato detalhado."""
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
        
            if all(campo in df.columns for campo in campos_relato):
                df['solicitacao_cliente'] = df.apply(concatenar_relatos, axis=1)
                df = df.drop(columns=campos_relato)
            
            return df
            
        except Exception as e:
            logger.error(f"Erro ao concatenar relatos: {str(e)}")
            return df

    def _get_estrutura_vazia(self) -> Dict[str, Any]:
        """Retorna estrutura vazia do dashboard."""
        return {
            'registros': [],
            'ultima_atualizacao': Formatters.format_datetime(datetime.now())
        }