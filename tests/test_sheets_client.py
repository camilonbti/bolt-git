import unittest
from unittest.mock import patch, MagicMock
from src.sheets_client import GoogleSheetsClient
from src.config.google_sheets_config import GOOGLE_SHEETS_CONFIG

class TestGoogleSheetsClient(unittest.TestCase):
    @patch('src.sheets_client.service_account.Credentials.from_service_account_file')
    @patch('src.sheets_client.build')
    def setUp(self, mock_build, mock_creds):
        self.mock_creds = mock_creds
        self.mock_service = mock_build
        self.client = GoogleSheetsClient()

    def test_extract_spreadsheet_id(self):
        """Testa a extração do ID da planilha da URL."""
        expected_id = "1ccjt8MlDcp-QAlY_yrRA-r7eIVLPeaNcAsBFghyvlEc"
        self.assertEqual(self.client._extract_spreadsheet_id(), expected_id)

    @patch('src.sheets_client.GoogleSheetsClient._create_service')
    def test_ler_planilha(self, mock_create_service):
        """Testa a leitura de dados da planilha."""
        mock_sheets = MagicMock()
        mock_sheets.spreadsheets().get().execute.return_value = {
            'sheets': [{'properties': {'title': 'Sheet1'}}]
        }
        mock_sheets.spreadsheets().values().get().execute.return_value = {
            'values': [['Data', 'Nome'], ['01/01/2024', 'Teste']]
        }
        
        self.client.service = mock_sheets
        
        dados = self.client.ler_planilha()
        self.assertEqual(len(dados), 2)
        self.assertEqual(dados[0], ['Data', 'Nome'])
        self.assertEqual(dados[1], ['01/01/2024', 'Teste'])

    def test_get_credentials_error(self):
        """Testa o tratamento de erro ao obter credenciais."""
        with patch('src.sheets_client.service_account.Credentials.from_service_account_file',
                  side_effect=Exception('Erro de credenciais')):
            with self.assertRaises(Exception) as context:
                GoogleSheetsClient()
            self.assertTrue('Erro de credenciais' in str(context.exception))

if __name__ == '__main__':
    unittest.main()