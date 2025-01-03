"""
Calculador de dados para gráficos do dashboard
"""
from typing import Dict, List, Any
from collections import Counter
import logging
from ..logger import log_manager

logger = log_manager.get_logger(__name__)

class ChartCalculator:
    @staticmethod
    def calculate(data: List[Dict]) -> Dict[str, Any]:
        """Calcula dados para todos os gráficos."""
        try:
            if not data:
                return ChartCalculator._get_empty_charts()

            return {
                'status': ChartCalculator._count_by_field(data, 'status_atendimento'),
                'tipo': ChartCalculator._count_by_field(data, 'tipo_atendimento'),
                'funcionario': ChartCalculator._count_by_field(data, 'funcionario'),
                'cliente': ChartCalculator._count_by_field(data, 'cliente'),
                'sistema': ChartCalculator._count_by_field(data, 'sistema'),
                'canal': ChartCalculator._count_by_field(data, 'canal_atendimento'),
                'relato': ChartCalculator._count_by_field(data, 'solicitacao_cliente'),
                'solicitacao': ChartCalculator._count_by_field(data, 'tipo_atendimento'),
                'relatosDetalhados': ChartCalculator._count_by_field(data, 'solicitacao_cliente'),
                'origemProblema': ChartCalculator._count_by_field(data, 'origem_problema')
            }

        except Exception as e:
            logger.error(f"Erro ao calcular dados dos gráficos: {str(e)}")
            return ChartCalculator._get_empty_charts()

    @staticmethod
    def _count_by_field(data: List[Dict], field: str) -> Dict[str, List]:
        """Conta ocorrências de valores em um campo específico."""
        try:
            counter = Counter(item.get(field, 'Não informado') for item in data)
            sorted_items = sorted(counter.items(), key=lambda x: x[1], reverse=True)
            
            return {
                'labels': [item[0] for item in sorted_items],
                'values': [item[1] for item in sorted_items]
            }
        except Exception as e:
            logger.error(f"Erro ao contar valores do campo {field}: {str(e)}")
            return {'labels': [], 'values': []}

    @staticmethod
    def _get_empty_charts() -> Dict[str, Dict]:
        """Retorna estrutura vazia para os gráficos."""
        empty_chart = {'labels': [], 'values': []}
        return {
            'status': empty_chart.copy(),
            'tipo': empty_chart.copy(),
            'funcionario': empty_chart.copy(),
            'cliente': empty_chart.copy(),
            'sistema': empty_chart.copy(),
            'canal': empty_chart.copy(),
            'relato': empty_chart.copy(),
            'solicitacao': empty_chart.copy(),
            'relatosDetalhados': empty_chart.copy(),
            'origemProblema': empty_chart.copy()
        }