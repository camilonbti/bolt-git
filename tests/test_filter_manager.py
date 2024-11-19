import unittest
import pandas as pd
from src.filter_manager import FiltrosDashboard

class TestFiltrosDashboard(unittest.TestCase):
    def setUp(self):
        self.filtros = FiltrosDashboard()
        self.df_teste = pd.DataFrame({
            'status_atendimento': ['Concluído', 'Pendente', 'Concluído'],
            'cliente': ['Empresa A', 'Empresa B', 'Empresa A'],
            'data_hora': pd.to_datetime(['2024-01-01', '2024-01-02', '2024-01-03'])
        })

    def test_aplicar_filtros(self):
        """Testa a aplicação de filtros."""
        filtros = {
            'Status do atendimento:': 'Concluído',
            'Empresa atendida:': 'Empresa A'
        }
        
        df_filtrado = self.filtros.aplicar_filtros(self.df_teste, filtros)
        self.assertEqual(len(df_filtrado), 2)
        self.assertTrue(all(df_filtrado['status_atendimento'] == 'Concluído'))
        self.assertTrue(all(df_filtrado['cliente'] == 'Empresa A'))

    def test_aplicar_filtro_data(self):
        """Testa filtro específico para datas."""
        df_filtrado = self.filtros._aplicar_filtro_data(
            self.df_teste,
            'data_hora',
            '2024-01-01'
        )
        self.assertEqual(len(df_filtrado), 1)
        self.assertEqual(
            df_filtrado['data_hora'].dt.date.iloc[0],
            pd.to_datetime('2024-01-01').date()
        )

    def test_gerar_dados_graficos(self):
        """Testa geração de dados para gráficos."""
        dados_graficos = self.filtros.gerar_dados_graficos(self.df_teste)
        
        self.assertIn('status_atendimento', dados_graficos)
        self.assertIn('cliente', dados_graficos)
        
        status_data = dados_graficos['status_atendimento']
        self.assertEqual(len(status_data['labels']), 2)
        self.assertEqual(len(status_data['values']), 2)

if __name__ == '__main__':
    unittest.main()