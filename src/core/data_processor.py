"""
Processador de dados para o dashboard
"""
from typing import Dict, List, Any
import pandas as pd
from datetime import datetime
import logging
import json
from ..config.campos_config import CAMPOS_CONFIGURACAO
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

class ProcessadorDados:
    def __init__(self, config=None):
        self.config = config or CAMPOS_CONFIGURACAO
        self.timezone = ZoneInfo("America/Sao_Paulo")
        logger.debug("ProcessadorDados inicializado")

    def formatar_dataset_js(self, dados_brutos: List[List]) -> str:
        """
        Formata os dados para o formato de dataset JavaScript.
        Retorna uma string com o array JavaScript formatado.
        """
        try:
            if not dados_brutos or len(dados_brutos) < 2:
                logger.warning("Dados brutos vazios ou insuficientes")
                return "const ATENDIMENTOS_DATASET = [];"

            # Processa os dados
            df = self._criar_dataframe(dados_brutos)
            if df.empty:
                return "const ATENDIMENTOS_DATASET = [];"

            # Processa os campos
            df = self._processar_campos(df)
            df = self._processar_datas(df)

            # Converte para o formato desejado
            registros = []
            for _, row in df.iterrows():
                registro = {
                    'data_hora': row['data_hora'].strftime('%Y-%m-%d %H:%M:%S'),
                    'funcionario': self._formatar_texto(row['funcionario']),
                    'cliente': self._formatar_texto(row['cliente']),
                    'solicitante': self._formatar_texto(row['solicitante']),
                    'tipo_atendimento': self._formatar_texto(row['tipo_atendimento']),
                    'status_atendimento': self._formatar_texto(row['status_atendimento']),
                    'sistema': self._formatar_texto(row['sistema']),
                    'canal_atendimento': self._formatar_texto(row['canal_atendimento']),
                    'descricao_realizado': self._formatar_texto(row['descricao_realizado'])
                }
                registros.append(registro)

            # Formata como string JavaScript
            js_array = json.dumps(registros, ensure_ascii=False, indent=2)
            return f"const ATENDIMENTOS_DATASET = {js_array};"

        except Exception as e:
            logger.error(f"Erro ao formatar dataset: {str(e)}", exc_info=True)
            return "const ATENDIMENTOS_DATASET = [];"

    def processar_template(self, template_html: str, dados_brutos: List[List]) -> str:
        """
        Processa o template HTML substituindo o dataset vazio pelo formatado.
        """
        try:
            dataset_js = self.formatar_dataset_js(dados_brutos)
            return template_html.replace(
                "const ATENDIMENTOS_DATASET = [];",
                dataset_js
            )
        except Exception as e:
            logger.error(f"Erro ao processar template: {str(e)}", exc_info=True)
            return template_html

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
                'Descrição do atendimento realizado:': 'descricao_realizado',
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
            # Trata valores nulos
            valores_default = {
                'funcionario': 'Não informado',
                'cliente': 'Não informado',
                'solicitante': 'Não informado',
                'solicitacao_cliente': 'Não informado',
                'descricao_realizado': 'Sem descrição',
                'status_atendimento': 'Pendente',
                'tipo_atendimento': 'Não categorizado',
                'sistema': 'Não especificado',
                'canal_atendimento': 'Não especificado'
            }
            
            df = df.fillna(valores_default)
            
            # Normaliza strings
            for coluna in ['funcionario', 'cliente', 'solicitante', 'sistema']:
                df[coluna] = df[coluna].str.strip().str.title()
            
            # Validação específica para status
            status_validos = ['Concluído', 'Pendente', 'Cancelado']
            df.loc[~df['status_atendimento'].isin(status_validos), 'status_atendimento'] = 'Pendente'
            
            logger.debug("Campos processados com sucesso")
            return df
            
        except Exception as e:
            logger.error(f"Erro ao processar campos: {str(e)}")
            return df

    def _processar_datas(self, df: pd.DataFrame) -> pd.DataFrame:
        """Processa campos de data com tratamento de erro robusto."""
        try:
            # Converte datas com múltiplos formatos possíveis
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

    def _formatar_texto(self, valor: Any) -> str:
        """Formata valores de texto removendo espaços extras e normalizando."""
        if pd.isna(valor):
            return ""
        return str(valor).strip().replace('\n', ' ').replace('\r', '')