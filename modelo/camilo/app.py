from flask import Flask, render_template, jsonify
from src.core.sheets_client import GoogleSheetsClient
from src.core.data_processor import ProcessadorDados
from src.config.campos_config import CAMPOS_CONFIGURACAO
from src.config.logging_config import setup_logging
import logging

# Configura logging
setup_logging()
logger = logging.getLogger(__name__)

app = Flask(__name__, 
    template_folder='src/templates',
    static_folder='src/static'
)

processador = ProcessadorDados(CAMPOS_CONFIGURACAO)

@app.route('/')
def index():
    """Rota principal que renderiza o dashboard."""
    try:
        logger.info("Iniciando carregamento do dashboard")
        return render_template('dashboard.html')
        
    except Exception as e:
        logger.error(f"Erro ao renderizar dashboard: {str(e)}", exc_info=True)
        error_msg = "Erro ao carregar dashboard. Por favor, tente novamente mais tarde."
        if app.debug:
            error_msg = str(e)
        return render_template('error.html', error=error_msg)

@app.route('/api/data')
def get_data():
    """API endpoint para carregamento e atualização dos dados."""
    try:
        logger.info("Iniciando carregamento de dados via API")
        
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
    # Mudança para permitir conexões externas (alterando host para '0.0.0.0')
    app.run(debug=True, host='0.0.0.0', port=5002)