"""
Calculador de KPIs do dashboard
"""
from typing import Dict, List, Any
import logging
from ..logger import log_manager
from ...utils.formatters import Formatters

logger = log_manager.get_logger(__name__)

class KPICalculator:
    @staticmethod
    def calculate(data: List[Dict]) -> Dict[str, Any]:
        """Calcula todos os KPIs do dashboard."""
        try:
            if not data:
                return KPICalculator._get_empty_kpis()

            total = len(data)
            concluidos = len([r for r in data if r.get('status_atendimento') == 'Concluído'])
            pendentes = len([r for r in data if r.get('status_atendimento') == 'Pendente'])
            taxa = (concluidos / total * 100) if total > 0 else 0

            # Média diária
            dias_unicos = len(set(r.get('data_atendimento') for r in data if r.get('data_atendimento')))
            media_diaria = total / dias_unicos if dias_unicos > 0 else 0

            # Distribuição por período
            atendimentos_periodo = {'manha': 0, 'tarde': 0}
            for item in data:
                hora = item.get('hora_atendimento', '')
                if hora:
                    hora_num = int(hora.split(':')[0])
                    if hora_num < 12:
                        atendimentos_periodo['manha'] += 1
                    else:
                        atendimentos_periodo['tarde'] += 1

            perc_manha = (atendimentos_periodo['manha'] / total * 100) if total > 0 else 0
            perc_tarde = (atendimentos_periodo['tarde'] / total * 100) if total > 0 else 0

            return {
                'total_registros': Formatters.format_number(total),
                'total_pendentes': Formatters.format_number(pendentes),
                'total_concluidos': Formatters.format_number(concluidos),
                'taxa_conclusao': Formatters.format_percentage(taxa),
                'media_diaria': Formatters.format_number(media_diaria, 1),
                'atendimentos_manha': Formatters.format_percentage(perc_manha),
                'atendimentos_tarde': Formatters.format_percentage(perc_tarde)
            }

        except Exception as e:
            logger.error(f"Erro ao calcular KPIs: {str(e)}")
            return KPICalculator._get_empty_kpis()

    @staticmethod
    def _get_empty_kpis() -> Dict[str, str]:
        """Retorna estrutura vazia de KPIs."""
        return {
            'total_registros': '0',
            'total_pendentes': '0',
            'total_concluidos': '0',
            'taxa_conclusao': '0%',
            'media_diaria': '0,0',
            'atendimentos_manha': '0%',
            'atendimentos_tarde': '0%'
        }