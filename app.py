from flask import Flask, render_template, jsonify
from src.core.sheets_client import GoogleSheetsClient
from src.core.data_processor import ProcessadorDados
from src.config.campos_config import CAMPOS_CONFIGURACAO
from src.core.logger import log_manager
from datetime import datetime
import json

app = Flask(__name__, 
    template_folder='src/templates',
    static_folder='src/static'
)

logger = log_manager.get_logger(__name__)
processador = ProcessadorDados(CAMPOS_CONFIGURACAO)

def format_datetime(value):
    """Filtro Jinja2 para formatar data/hora."""
    if isinstance(value, str):
        try:
            value = datetime.strptime(value, '%Y-%m-%dT%H:%M:%S')
        except ValueError as e:
            logger.warning(f"Erro ao converter data '{value}': {str(e)}")
            return value
    return value.strftime('%d/%m/%Y %H:%M')

# Registra os filtros customizados
app.jinja_env.filters['datetime'] = format_datetime

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
        
        # Processa dados
        resultado = processador.processar_dados(dados_brutos)
        logger.debug(f"Dados processados: {len(resultado.get('registros', []))} registros")
        
        # Log da estrutura de dados
        logger.debug(f"KPIs calculados: {json.dumps(resultado['kpis'], default=str)}")
        logger.debug(f"Gráficos gerados: {list(resultado['graficos'].keys())}")
        
        logger.info("Dashboard processado com sucesso")
        return render_template('dashboard.html', dados=resultado)
        
    except Exception as e:
        logger.error(f"Erro ao renderizar dashboard: {str(e)}", exc_info=True)
        error_msg = "Erro ao carregar dashboard. Por favor, tente novamente mais tarde."
        if app.debug:
            error_msg = str(e)
        return render_template('error.html', error=error_msg)

@app.route('/api/data')
def get_data():
    """API endpoint para atualização dos dados via AJAX."""
    try:
        logger.info("Iniciando atualização de dados via API")
        
        sheets_client = GoogleSheetsClient()
        dados_brutos = sheets_client.ler_planilha()
        logger.debug(f"Dados brutos obtidos: {len(dados_brutos)} linhas")
        
        resultado = processador.processar_dados(dados_brutos)
        logger.info("Dados processados com sucesso")
        
        return jsonify(resultado)
        
    except Exception as e:
        logger.error(f"Erro ao buscar dados: {str(e)}", exc_info=True)
        return jsonify({
            'error': True,
            'message': str(e) if app.debug else "Erro ao atualizar dados"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)