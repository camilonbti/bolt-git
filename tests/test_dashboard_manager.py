import unittest
from unittest.mock import patch, MagicMock
import pandas as pd
from src.dashboard_manager import DashboardManager

class TestDashboardManager(unittest.TestCase):
    def setUp(self):
        self.dashboard = DashboardManager()
        self.dados_teste = pd.DataFrame({
            'status_atendimento': ['Concluído', 'Pendente', 'Concluído'],
            'cliente': ['Empresa A', 'Empresa B', 'Empresa A'],
            'data_hora': pd.to_datetime(['2024-01-01', '2024-01-02', '2024-01-03']),
            'start_time': ['10:00:00', '11:00:00', '14:00:00'],
            'end_time': ['10:30:00', '11:45:00', '14:15:00']
        })

    def test_calcular_kpis(self):
        """Testa o cálculo de KPIs."""
        kpis = self.dashboard.calcular_kpis(self.dados_teste)
        
        self.assertEqual(kpis['total_registros'], 3)
        self.assertEqual(kpis['total_pendentes'], 1)
        self.assertGreater(kpis['taxa_conclusao'], 0)

    def test_gerar_dados_graficos(self):
        """Testa a geração de dados para gráficos."""
        graficos = self.dashboard.gerar_dados_graficos(self.dados_teste)
        
        self.assertIn('status_atendimento', graficos)
        self.assertIn('cliente', graficos)
        
        status_data = graficos['status_atendimento']
        self.assertIn('labels', status_data)
        self.assertIn('values', status_data)

    def test_processar_dados(self):
        """Testa o processamento de dados brutos."""
        dados_brutos = [
            {
                'data_hora': '01/01/2024 10:00:00',
                'status_atendimento': 'Concluído',
                'cliente': 'Empresa A'
            }
        ]
        
        df = self.dashboard.processar_dados(dados_brutos)
        self.assertIsInstance(df, pd.DataFrame)
        self.assertEqual(len(df), 1)
        self.assertTrue(pd.api.types.is_datetime64_any_dtype(df['data_hora']))

if __name__ == '__main__':
    unittest.main()