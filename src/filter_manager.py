"""
Gerenciador de filtros dinâmicos para dashboard
"""
from typing import Dict, List, Any, Optional
import pandas as pd
import logging
from .config.campos_config import (
    CAMPOS_CONFIGURACAO,
    get_mapeamento_colunas,
    get_valores_default,
    get_campos_filtraveis
)
from .utils.date_utils import (
    TIMEZONE,
    format_date_range,
    format_timestamp,
    format_display_date,
    get_current_time
)

logger = logging.getLogger(__name__)

class FiltrosDashboard:
    def __init__(self):
        self.config = CAMPOS_CONFIGURACAO
        self.mapeamento_colunas = get_mapeamento_colunas()
        self.valores_default = get_valores_default()
        self.campos_filtraveis = get_campos_filtraveis()
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
            if campo not in df.columns:
                return df
                
            if isinstance(valor, dict) and 'start' in valor and 'end' in valor:
                inicio, fim = format_date_range(valor['start'], valor['end'])
            else:
                inicio, fim = format_date_range(valor)
            
            return df[
                (df[campo] >= inicio) & 
                (df[campo] <= fim)
            ]
            
        except Exception as e:
            logger.error(f"Erro ao aplicar filtro de data: {str(e)}")
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
                if isinstance(valor, dict):
                    format_date_range(valor.get('start'), valor.get('end'))
                else:
                    format_date_range(valor)
                return True
            except:
                return False
        
        if "valores_permitidos" in config:
            return valor in config["valores_permitidos"]
        
        return True