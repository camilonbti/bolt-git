from flask import Flask, render_template
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
        
        # Lê o template
        template_path = os.path.join(app.template_folder, 'dashboard.html')
        with open(template_path, 'r', encoding='utf-8') as f:
            template_html = f.read()
        
        # Processa o template com os dados
        html_processado = processador.formatar_dataset_js(dados_brutos)
        
        return render_template('dashboard.html', dataset_js=html_processado)
        
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
        
        # Formata os dados para JavaScript
        dataset_js = processador.formatar_dataset_js(dados_brutos)
        
        return dataset_js
        
    except Exception as e:
        logger.error(f"Erro ao buscar dados: {str(e)}", exc_info=True)
        return {"error": True, "message": str(e) if app.debug else "Erro ao atualizar dados"}, 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)