from datetime import datetime
import unittest
import sys
import os

# Adiciona o diretório src ao path para importação
sys.path.append(os.path.abspath("src"))

from data_processor import ProcessadorDados

class TestProcessadorDados(unittest.TestCase):
    def setUp(self):
        self.processador = ProcessadorDados()
        
    def test_validar_cabecalho_completo(self):
        """Testa se um cabeçalho válido é aceito."""
        cabecalho = list(self.processador.config.keys())
        try:
            self.processador.validar_cabecalho(cabecalho)
        except ValueError:
            self.fail("validar_cabecalho levantou ValueError inesperadamente!")

    def test_converter_valor_data(self):
        """Testa a conversão de valores de data."""
        config = self.processador.config["Carimbo de data/hora"]
        resultado = self.processador.converter_valor("01/01/2024 10:00:00", config)
        self.assertIsInstance(resultado, datetime)
        self.assertEqual(resultado.year, 2024)
        self.assertEqual(resultado.month, 1)
        self.assertEqual(resultado.day, 1)

    def test_converter_valor_string(self):
        """Testa a conversão de valores string."""
        config = self.processador.config["Prestador de Serviços:"]
        resultado = self.processador.converter_valor("joão silva", config)
        self.assertEqual(resultado, "João Silva")

    def test_validar_valor_obrigatorio(self):
        """Testa a validação de campos obrigatórios."""
        config = self.processador.config["Status do atendimento:"]
        self.assertTrue(self.processador.validar_valor("Concluído", config))
        self.assertFalse(self.processador.validar_valor("", config))

    def test_formatar_dados_completos(self):
        """Testa o processamento completo de uma linha de dados."""
        dados_teste = [
            list(self.processador.config.keys()),
            ["01/01/2024 10:00:00", "joão silva", "empresa teste", "maria oliveira",
             "Problema no sistema", "Cliente não consegue acessar", "Concluído",
             "Suporte Técnico", "Sistema A", "Email"]
        ]
        
        resultado = self.processador.formatar_dados(dados_teste)
        primeiro_registro = resultado[0]
        
        self.assertEqual(primeiro_registro["funcionario"], "João Silva")
        self.assertEqual(primeiro_registro["status_atendimento"], "Concluído")
        self.assertEqual(primeiro_registro["cliente"], "Empresa Teste")

    def test_obter_campos_filtraveis(self):
        """Testa a obtenção de campos filtráveis."""
        campos_filtraveis = self.processador.obter_campos_filtraveis()
        self.assertTrue(any(campo["nome_interno"] == "status_atendimento" for campo in campos_filtraveis))
        self.assertTrue(all("tipo_filtro" in campo for campo in campos_filtraveis))

if __name__ == '__main__':
    unittest.main()