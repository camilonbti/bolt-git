from flask import Flask, render_template, jsonify
from src.core.sheets_client import GoogleSheetsClient
from src.core.data_processor import ProcessadorDados
from src.config.campos_config import CAMPOS_CONFIGURACAO
from src.core.logger import log_manager
import os

app = Flask(__name__, 
    template_folder='src/templates',
    static_folder='src/static'
)

logger = log_manager.get_logger(__name__)
processador = ProcessadorDados(CAMPOS_CONFIGURACAO)

@app.route('/')
def index():
    """Rota principal que renderiza o dashboard."""
    try:
        logger.info("Iniciando carregamento do dashboard")
        
        # Obtém dados do Google Sheets
        sheets_client = GoogleSheetsClient()
        logger.debug("Cliente do Google Sheets inicializado")
        
        dados_brutos = sheets_client.ler_planilha()
        logger.info(f"Dados obtidos: {len(dados_brutos)} linhas")
        
        # Processa os dados e formata para JavaScript
        dados_processados = processador.processar_dados(dados_brutos)
        dataset_js = f"const ATENDIMENTOS_DATASET = {dados_processados['registros']};"
        logger.info("Dataset JS formatado com sucesso")
        
        # Renderiza o template com o dataset
        return render_template('dashboard.html', dataset_js=dataset_js)
        
    except Exception as e:
        logger.error(f"Erro ao renderizar dashboard: {str(e)}", exc_info=True)
        error_msg = "Erro ao carregar dashboard. Por favor, tente novamente mais tarde."
        if app.debug:
            error_msg = str(e)
        return render_template('error.html', error=error_msg)

@app.route('/api/data')
def get_data():
    """API endpoint para atualização dos dados."""
    try:
        logger.info("Iniciando atualização de dados via API")
        
        sheets_client = GoogleSheetsClient()
        dados_brutos = sheets_client.ler_planilha()
        logger.debug(f"Dados brutos obtidos: {len(dados_brutos)} linhas")
        
        # Processa os dados
        dados_processados = processador.processar_dados(dados_brutos)
        logger.info("Dados processados com sucesso")
        
        return jsonify(dados_processados)
        
    except Exception as e:
        logger.error(f"Erro ao buscar dados: {str(e)}")
        return jsonify({
            "error": True, 
            "message": str(e) if app.debug else "Erro ao atualizar dados"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)