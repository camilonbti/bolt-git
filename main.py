from src.sheets_client import GoogleSheetsClient
from src.data_processor import ProcessadorDados

def main():
    try:
        # Inicializa o cliente do Google Sheets
        cliente = GoogleSheetsClient()
        print("Conexão com Google Sheets estabelecida com sucesso!")

        # Lê dados da primeira planilha (ajuste o range conforme necessário)
        dados_brutos = cliente.ler_planilha('Sheet1!A1:Z1000')
        
        # Processa os dados
        processador = ProcessadorDados()
        dados_formatados = processador.formatar_dados(dados_brutos)
        
        # Exibe alguns resultados
        print(f"\nTotal de registros processados: {len(dados_formatados)}")
        if dados_formatados:
            print("\nPrimeiro registro como exemplo:")
            print(dados_formatados[0])

    except Exception as e:
        print(f"Erro ao processar planilha: {str(e)}")

if __name__ == "__main__":
    main()