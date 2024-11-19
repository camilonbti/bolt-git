"""
Gerenciador de filtros dinâmicos para dashboard
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import pandas as pd
import logging
from .config.campos_config import CAMPOS_CONFIGURACAO

logger = logging.getLogger(__name__)

class FiltrosDashboard:
    def __init__(self):
        self.config = CAMPOS_CONFIGURACAO
        self.filtros_ativos = {}
        self.campos_filtraveis = self._get_campos_filtraveis()

    def _get_campos_filtraveis(self) -> Dict[str, Dict]:
        """Retorna campos que podem ser filtrados."""
        return {
            nome: config for nome, config in self.config.items()
            if config.get("permite_filtro", False)
        }

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
            data = datetime.strptime(valor, "%Y-%m-%d")
            return df[df[campo].dt.date == data.date()]
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