"""
Gerenciador de filtros dinâmicos para dashboard
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import pandas as pd
import logging
from .config.campos_config import (
    CAMPOS_CONFIGURACAO,
    get_mapeamento_colunas,
    get_valores_default,
    get_campos_filtraveis
)
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

class FiltrosDashboard:
    def __init__(self):
        self.config = CAMPOS_CONFIGURACAO
        self.mapeamento_colunas = get_mapeamento_colunas()
        self.valores_default = get_valores_default()
        self.campos_filtraveis = get_campos_filtraveis()
        self.timezone = ZoneInfo("America/Sao_Paulo")
        self.filtros_ativos = {}

    def aplicar_filtros(self, df: pd.DataFrame, filtros: Dict[str, Any]) -> pd.DataFrame:
        """Aplica filtros dinâmicos ao DataFrame."""
        try:
            df_filtrado = df.copy()
            
            for campo_original, valor in filtros.items():
                if not valor or campo_original not in self.config:
                    continue
                    
                config = self.config[campo_original]
                nome_interno = config["nome_interno"]
                
                if config["tipo"] == "datetime":
                    df_filtrado = self._aplicar_filtro_data(df_filtrado, nome_interno, valor)
                else:
                    df_filtrado = df_filtrado[df_filtrado[nome_interno] == valor]
            
            return df_filtrado
        except Exception as e:
            logger.error(f"Erro ao aplicar filtros: {str(e)}")
            return df

    def _aplicar_filtro_data(self, df: pd.DataFrame, campo: str, valor: str) -> pd.DataFrame:
        """Aplica filtro específico para datas."""
        try:
            # Converte a data para datetime com timezone
            data = pd.to_datetime(valor).tz_localize(self.timezone)
            
            # Define início (00:00:00) e fim (23:59:59.999999) do dia
            inicio_dia = data.replace(hour=0, minute=0, second=0, microsecond=0)
            fim_dia = data.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            # Filtra registros dentro do intervalo do dia
            return df[
                (df[campo] >= inicio_dia) & 
                (df[campo] <= fim_dia)
            ]
        except ValueError as e:
            logger.error(f"Erro ao processar data para filtro: {str(e)}")
            return df

    def gerar_dados_graficos(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Gera dados para gráficos baseados nos campos filtráveis."""
        dados_graficos = {}
        
        try:
            for campo, config in self.campos_filtraveis.items():
                nome_interno = config["nome_interno"]
                if config["tipo_filtro"] == "select":
                    contagem = df[nome_interno].value_counts()
                    dados_graficos[nome_interno] = {
                        "labels": contagem.index.tolist(),
                        "values": contagem.values.tolist(),
                        "title": config["label"]
                    }
            
            return dados_graficos
        except Exception as e:
            logger.error(f"Erro ao gerar dados para gráficos: {str(e)}")
            return {}

    def get_filtros_ativos(self) -> Dict[str, Any]:
        """Retorna os filtros atualmente ativos."""
        return self.filtros_ativos

    def limpar_filtros(self) -> None:
        """Limpa todos os filtros ativos."""
        self.filtros_ativos = {}

    def adicionar_filtro(self, campo: str, valor: Any) -> None:
        """Adiciona um novo filtro."""
        if campo in self.config and valor:
            self.filtros_ativos[campo] = valor

    def remover_filtro(self, campo: str) -> None:
        """Remove um filtro específico."""
        if campo in self.filtros_ativos:
            del self.filtros_ativos[campo]

    def validar_filtro(self, campo: str, valor: Any) -> bool:
        """Valida se um filtro é válido para o campo especificado."""
        if campo not in self.config:
            return False

        config = self.config[campo]
        
        if not config.get("permite_filtro", False):
            return False

        if config["tipo"] == "datetime":
            try:
                pd.to_datetime(valor)
                return True
            except:
                return False
        
        if "valores_permitidos" in config:
            return valor in config["valores_permitidos"]
        
        return True
