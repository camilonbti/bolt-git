"""
Gerenciador de Dashboard com filtros dinâmicos e gráficos
"""
from typing import Dict, List, Any, Optional
import pandas as pd
from datetime import datetime
import logging
from .config.campos_config import CAMPOS_CONFIGURACAO
from .config.color_palette import ColorPalette
from .filter_manager import FiltrosDashboard

logger = logging.getLogger(__name__)

class DashboardManager:
    def __init__(self):
        self.config = CAMPOS_CONFIGURACAO
        self.filtros_ativos = {}
        self.campos_graficos = self._get_campos_graficos()
        self.paleta_cores = ColorPalette()
        self.filtros = FiltrosDashboard()

    def _get_campos_graficos(self) -> Dict[str, Dict]:
        """Retorna campos configurados para exibição em gráficos."""
        return {
            nome: config for nome, config in self.config.items()
            if config.get("permite_filtro") and config.get("visivel")
        }

    def processar_dados(self, dados: List[Dict]) -> pd.DataFrame:
        """Processa dados brutos para DataFrame."""
        try:
            df = pd.DataFrame(dados)
            for campo, config in self.config.items():
                if config["tipo"] == "datetime":
                    df[config["nome_interno"]] = pd.to_datetime(
                        df[config["nome_interno"]], 
                        format=config["formato"]
                    )
            return df
        except Exception as e:
            logger.error(f"Erro ao processar dados: {str(e)}")
            return pd.DataFrame()

    def aplicar_filtros(self, df: pd.DataFrame) -> pd.DataFrame:
        """Aplica filtros ativos aos dados."""
        return self.filtros.aplicar_filtros(df, self.filtros_ativos)

    def gerar_dados_graficos(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Gera dados para todos os gráficos configurados."""
        return self.filtros.gerar_dados_graficos(df)

    def calcular_kpis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calcula KPIs principais do dashboard."""
        try:
            total_registros = len(df)
            if total_registros == 0:
                return {
                    "total_registros": 0,
                    "taxa_conclusao": 0,
                    "tempo_medio_atendimento": 0,
                    "total_pendentes": 0
                }

            # Contagem por status
            concluidos = df[df["status_atendimento"] == "Concluído"].shape[0]
            taxa_conclusao = (concluidos / total_registros * 100) if total_registros > 0 else 0
            
            # Cálculo de tempo médio (usando apenas data_hora para simplificar)
            df_ordenado = df.sort_values("data_hora")
            tempo_medio = (df_ordenado.groupby("funcionario")["data_hora"]
                         .agg(lambda x: (x.max() - x.min()).total_seconds() / 60)
                         .mean())
            
            return {
                "total_registros": total_registros,
                "taxa_conclusao": round(taxa_conclusao, 2),
                "tempo_medio_atendimento": round(float(tempo_medio if pd.notnull(tempo_medio) else 0), 2),
                "total_pendentes": total_registros - concluidos
            }
        except Exception as e:
            logger.error(f"Erro ao calcular KPIs: {str(e)}")
            return {
                "total_registros": 0,
                "taxa_conclusao": 0,
                "tempo_medio_atendimento": 0,
                "total_pendentes": 0
            }