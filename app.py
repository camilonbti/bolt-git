"""
Aplicação principal do dashboard de atendimentos.
Responsável por servir a interface web e APIs.
"""
from flask import Flask, render_template, jsonify, make_response
from src.core.sheets_client import GoogleSheetsClient
from src.core.data_processor import ProcessadorDados
from src.core.managers.dashboard_manager import DashboardManager
from src.core.logger import log_manager
import os
from dotenv import load_dotenv

# Configura logging
logger = log_manager.get_logger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

app = Flask(__name__, 
    template_folder='src/templates',
    static_folder='src/static'
)

# Configura o modo debug
app.debug = os.getenv('FLASK_DEBUG') == '1'

# Desabilita cache
@app.after_request
def add_header(response):
    """Adiciona headers para prevenir cache."""
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# Inicializa componentes
data_processor = ProcessadorDados()
dashboard_manager = DashboardManager()

@app.route('/')
def index():
    """Rota principal que renderiza o dashboard."""
    try:
        response = make_response(render_template('dashboard.html'))
        return response
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
        # Lê dados da planilha
        sheets_client = GoogleSheetsClient()
        dados_brutos = sheets_client.ler_planilha()
        
        # Processa dados brutos
        dados_processados = data_processor.processar_dados(dados_brutos)
        
        # Processa dados para o dashboard
        resultado = dashboard_manager.process_dashboard_data(dados_processados['registros'])
        
        response = make_response(jsonify(resultado))
        return response
        
    except Exception as e:
        logger.error(f"Erro ao processar dados: {str(e)}", exc_info=True)
        return jsonify({
            "error": True, 
            "message": str(e) if app.debug else "Erro ao atualizar dados",
            "type": type(e).__name__ if app.debug else None
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_RUN_PORT', 5002))
    host = os.getenv('FLASK_RUN_HOST', '0.0.0.0')
    app.run(debug=app.debug, host=host, port=port)