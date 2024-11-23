from flask import Flask, render_template, jsonify
from src.core.sheets_client import GoogleSheetsClient
from src.core.data_processor import ProcessadorDados
from src.config.campos_config import CAMPOS_CONFIGURACAO
from src.config.logging_config import setup_logging
import logging
import os
from dotenv import load_dotenv

# Configura logging primeiro
setup_logging()
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

logger.info("=== Iniciando Aplicação ===")
logger.info(f"Working Directory: {os.getcwd()}")
logger.info(f"PYTHONPATH: {os.getenv('PYTHONPATH')}")

# Verifica existência do arquivo de credenciais
credentials_path = os.getenv('GOOGLE_CREDENTIALS_PATH')
if credentials_path:
    logger.info(f"Verificando arquivo de credenciais: {credentials_path}")
    if os.path.exists(credentials_path):
        logger.info("Arquivo de credenciais encontrado")
        logger.info("Arquivo de credenciais pode ser lido")
    else:
        logger.error(f"Arquivo de credenciais NÃO encontrado em: {credentials_path}")
else:
    logger.error("GOOGLE_CREDENTIALS_PATH não definido no arquivo .env")

app = Flask(__name__, 
    template_folder='src/templates',
    static_folder='src/static'
)

# Configura o modo debug baseado na variável de ambiente
app.debug = os.getenv('FLASK_DEBUG') == '1'
logger.info(f"Debug mode: {app.debug}")

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
        logger.info("=== Iniciando carregamento de dados via API ===")
        
        logger.info("Inicializando Google Sheets Client")
        sheets_client = GoogleSheetsClient()
        logger.info("Cliente do Google Sheets inicializado")
        
        logger.info("Solicitando leitura da planilha")
        dados_brutos = sheets_client.ler_planilha()
        logger.info(f"Dados brutos obtidos: {len(dados_brutos)} linhas")
        
        if len(dados_brutos) > 1:
            logger.debug("Amostra dos dados brutos:")
            for i, linha in enumerate(dados_brutos[1:3]):
                logger.debug(f"Linha {i+1}: {linha}")
        
        # Processa os dados
        logger.info("Processando dados...")
        dados_processados = processador.processar_dados(dados_brutos)
        logger.info("Dados processados com sucesso")
        
        return jsonify(dados_processados)
        
    except Exception as e:
        logger.error(f"Erro ao buscar dados: {str(e)}", exc_info=True)
        return jsonify({
            "error": True, 
            "message": str(e) if app.debug else "Erro ao atualizar dados"
        }), 500

if __name__ == '__main__':
    # Configurações do servidor baseadas nas variáveis de ambiente
    port = int(os.getenv('FLASK_RUN_PORT', 5002))
    host = os.getenv('FLASK_RUN_HOST', '0.0.0.0')
    
    logger.info(f"Iniciando servidor Flask em {host}:{port}")
    logger.info(f"Debug mode: {app.debug}")
    
    app.run(debug=app.debug, host=host, port=port)