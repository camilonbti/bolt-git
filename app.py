from flask import Flask, render_template, jsonify
from src.core.sheets_client import GoogleSheetsClient
from src.core.data_processor import ProcessadorDados
from src.config.campos_config import CAMPOS_CONFIGURACAO
from src.core.logger import log_manager  # Alterado
import os
from dotenv import load_dotenv
import traceback

# Configura logging
logger = log_manager.get_logger(__name__)  # Alterado

# Carrega variáveis de ambiente
load_dotenv()

app = Flask(__name__, 
    template_folder='src/templates',
    static_folder='src/static'
)

# Configura o modo debug
app.debug = os.getenv('FLASK_DEBUG') == '1'

processador = ProcessadorDados(CAMPOS_CONFIGURACAO)

@app.route('/')
def index():
    """Rota principal que renderiza o dashboard."""
    try:
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
        # Inicializa cliente e lê dados
        sheets_client = GoogleSheetsClient()
        dados_brutos = sheets_client.ler_planilha()
        
        # Processa os dados
        dados_processados = processador.processar_dados(dados_brutos)
        return jsonify(dados_processados)
        
    except Exception as e:
        logger.error(f"Erro ao processar dados: {str(e)}")
        logger.error(f"Stack trace: {traceback.format_exc()}")
        return jsonify({
            "error": True, 
            "message": str(e) if app.debug else "Erro ao atualizar dados",
            "type": type(e).__name__ if app.debug else None
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_RUN_PORT', 5002))
    host = os.getenv('FLASK_RUN_HOST', '0.0.0.0')
    app.run(debug=app.debug, host=host, port=port)