"""
Gerenciador de paleta de cores para gráficos e elementos visuais
"""
from typing import Dict, List, Union
import json

class ColorPalette:
    # Cores base do sistema
    BASE_COLORS = {
        "primary": "#4e73df",
        "success": "#1cc88a",
        "info": "#36b9cc",
        "warning": "#f6c23e",
        "danger": "#e74a3b",
        "secondary": "#858796"
    }
    
    # Cores para gráficos com diferentes opacidades
    CHART_COLORS = [
        'rgba(255, 99, 132, 0.6)',   # Red
        'rgba(54, 162, 235, 0.6)',   # Blue
        'rgba(255, 206, 86, 0.6)',   # Yellow
        'rgba(75, 192, 192, 0.6)',   # Green
        'rgba(153, 102, 255, 0.6)',  # Purple
        'rgba(255, 159, 64, 0.6)',   # Orange
        'rgba(199, 199, 199, 0.6)',  # Grey
        'rgba(83, 102, 255, 0.6)',   # Indigo
        'rgba(255, 99, 71, 0.6)',    # Tomato
        'rgba(46, 139, 87, 0.6)'     # Sea Green
    ]
    
    # Cores para status
    STATUS_COLORS = {
        "Concluído": "#1cc88a",
        "Pendente": "#f6c23e",
        "Cancelado": "#e74a3b",
        "Em Andamento": "#4e73df"
    }
    
    # Cores para KPIs
    KPI_COLORS = {
        "positivo": "#1cc88a",
        "neutro": "#858796",
        "negativo": "#e74a3b",
        "alerta": "#f6c23e"
    }

    @classmethod
    def get_chart_config(cls, tipo_grafico: str) -> Dict[str, Union[str, List[str]]]:
        """Retorna configuração de cores para um tipo específico de gráfico."""
        configs = {
            "bar": {
                "backgroundColor": cls.CHART_COLORS,
                "borderColor": [color.replace("0.6", "1") for color in cls.CHART_COLORS],
                "borderWidth": 1,
                "hoverBackgroundColor": [color.replace("0.6", "0.8") for color in cls.CHART_COLORS]
            },
            "line": {
                "borderColor": cls.CHART_COLORS[1],
                "backgroundColor": cls.CHART_COLORS[1].replace("0.6", "0.1"),
                "pointBackgroundColor": cls.CHART_COLORS[1],
                "pointBorderColor": "#fff",
                "pointHoverBackgroundColor": "#fff",
                "pointHoverBorderColor": cls.CHART_COLORS[1]
            },
            "pie": {
                "backgroundColor": cls.CHART_COLORS,
                "hoverBackgroundColor": [color.replace("0.6", "0.8") for color in cls.CHART_COLORS],
                "borderColor": "#fff",
                "borderWidth": 2
            },
            "doughnut": {
                "backgroundColor": cls.CHART_COLORS,
                "hoverBackgroundColor": [color.replace("0.6", "0.8") for color in cls.CHART_COLORS],
                "borderColor": "#fff",
                "borderWidth": 2
            }
        }
        return configs.get(tipo_grafico, configs["bar"])

    @classmethod
    def export_to_js(cls) -> str:
        """Exporta paletas para uso em JavaScript."""
        return json.dumps({
            "baseColors": cls.BASE_COLORS,
            "chartColors": cls.CHART_COLORS,
            "statusColors": cls.STATUS_COLORS,
            "kpiColors": cls.KPI_COLORS
        }, indent=2)