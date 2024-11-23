from flask import Flask, render_template, jsonify
from src.core.sheets_client import GoogleSheetsClient
from src.core.data_processor import ProcessadorDados
from src.config.campos_config import CAMPOS_CONFIGURACAO
from src.config.logging_config import setup_logging
import logging
import os
from dotenv import load_dotenv
import sys
import traceback

# Configura logging primeiro
setup_logging()
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

logger.info("=== Iniciando Aplicação ===")
logger.info(f"Working Directory: {os.getcwd()}")

# Log detalhado do ambiente
logger.info("=== Configurações do Ambiente ===")
logger.info(f"Sistema Operacional: {os.name}")
logger.info(f"Plataforma: {sys.platform}")
logger.info(f"Versão Python: {sys.version}")
logger.info(f"Encoding do Sistema: {sys.getfilesystemencoding()}")

# Log das variáveis de ambiente
env_vars = {
    'PYTHONPATH': os.getenv('PYTHONPATH'),
    'FLASK_DEBUG': os.getenv('FLASK_DEBUG'),
    'FLASK_APP': os.getenv('FLASK_APP'),
    'FLASK_ENV': os.getenv('FLASK_ENV'),
    'GOOGLE_CREDENTIALS_PATH': os.getenv('GOOGLE_CREDENTIALS_PATH')
}

logger.info("=== Variáveis de Ambiente ===")
for key, value in env_vars.items():
    logger.info(f"{key}: {value or 'não definido'}")

# Verifica existência do arquivo de credenciais
credentials_path = os.getenv('GOOGLE_CREDENTIALS_PATH')
if credentials_path:
    logger.info(f"GOOGLE_CREDENTIALS_PATH configurado: {credentials_path}")
    # Verifica se o caminho é absoluto
    logger.info(f"Caminho é absoluto? {os.path.isabs(credentials_path)}")
    # Tenta resolver caminho relativo se necessário
    full_path = os.path.abspath(credentials_path)
    logger.info(f"Caminho completo resolvido: {full_path}")
    
    if os.path.exists(full_path):
        logger.info("✓ Arquivo de credenciais encontrado")
        try:
            with open(full_path, 'r') as f:
                content = f.read()
                logger.info("✓ Arquivo de credenciais pode ser lido")
                # Verifica tamanho do arquivo
                file_size = len(content)
                logger.info(f"✓ Tamanho do arquivo: {file_size} bytes")
                # Verifica se é JSON válido
                import json
                try:
                    json.loads(content)
                    logger.info("✓ Arquivo de credenciais é um JSON válido")
                except json.JSONDecodeError as e:
                    logger.error(f"✗ Arquivo de credenciais não é um JSON válido: {str(e)}")
        except Exception as e:
            logger.error(f"✗ Erro ao ler arquivo de credenciais: {str(e)}")
            logger.error(f"✗ Permissões do arquivo: {oct(os.stat(full_path).st_mode)[-3:]}")
    else:
        logger.error(f"✗ Arquivo de credenciais NÃO encontrado em: {full_path}")
        # Lista diretório pai para debug
        parent_dir = os.path.dirname(full_path)
        if os.path.exists(parent_dir):
            logger.info(f"Conteúdo do diretório pai ({parent_dir}):")
            try:
                for item in os.listdir(parent_dir):
                    logger.info(f"  - {item}")
            except Exception as e:
                logger.error(f"✗ Erro ao listar diretório: {str(e)}")
else:
    logger.error("✗ GOOGLE_CREDENTIALS_PATH não definido no arquivo .env")

# Verifica paths do projeto
project_path = os.getenv('PYTHONPATH')
if project_path:
    logger.info(f"Verificando diretório do projeto: {project_path}")
    # Verifica se o caminho é absoluto
    logger.info(f"Caminho é absoluto? {os.path.isabs(project_path)}")
    # Tenta resolver caminho relativo se necessário
    full_project_path = os.path.abspath(project_path)
    logger.info(f"Caminho completo resolvido: {full_project_path}")
    
    if os.path.exists(full_project_path):
        logger.info("✓ Diretório do projeto encontrado")
        try:
            contents = os.listdir(full_project_path)
            logger.info("✓ Diretório do projeto pode ser lido")
            logger.info("Conteúdo do diretório do projeto:")
            for item in contents:
                logger.info(f"  - {item}")
        except Exception as e:
            logger.error(f"✗ Erro ao ler diretório do projeto: {str(e)}")
            logger.error(f"✗ Permissões do diretório: {oct(os.stat(full_project_path).st_mode)[-3:]}")
    else:
        logger.error(f"✗ Diretório do projeto NÃO encontrado em: {full_project_path}")
else:
    logger.error("✗ PYTHONPATH não definido no arquivo .env")

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
        try:
            sheets_client = GoogleSheetsClient()
            logger.info("✓ Cliente do Google Sheets inicializado com sucesso")
        except Exception as e:
            logger.error("✗ Erro ao inicializar Google Sheets Client")
            logger.error(f"Detalhes do erro: {str(e)}")
            logger.error("Stack trace:")
            logger.error(traceback.format_exc())
            raise
        
        logger.info("Solicitando leitura da planilha")
        try:
            dados_brutos = sheets_client.ler_planilha()
            logger.info(f"✓ Dados brutos obtidos: {len(dados_brutos)} linhas")
        except Exception as e:
            logger.error("✗ Erro ao ler planilha")
            logger.error(f"Detalhes do erro: {str(e)}")
            logger.error("Stack trace:")
            logger.error(traceback.format_exc())
            raise
        
        if len(dados_brutos) > 1:
            logger.debug("Amostra dos dados brutos:")
            for i, linha in enumerate(dados_brutos[1:3]):
                logger.debug(f"Linha {i+1}: {linha}")
        
        # Processa os dados
        logger.info("Processando dados...")
        try:
            dados_processados = processador.processar_dados(dados_brutos)
            logger.info("✓ Dados processados com sucesso")
        except Exception as e:
            logger.error("✗ Erro ao processar dados")
            logger.error(f"Detalhes do erro: {str(e)}")
            logger.error("Stack trace:")
            logger.error(traceback.format_exc())
            raise
        
        return jsonify(dados_processados)
        
    except Exception as e:
        logger.error("=== Erro na rota /api/data ===")
        logger.error(f"Tipo do erro: {type(e).__name__}")
        logger.error(f"Mensagem do erro: {str(e)}")
        logger.error("Stack trace completo:")
        logger.error(traceback.format_exc())
        return jsonify({
            "error": True, 
            "message": str(e) if app.debug else "Erro ao atualizar dados",
            "type": type(e).__name__ if app.debug else None
        }), 500

if __name__ == '__main__':
    # Configurações do servidor baseadas nas variáveis de ambiente
    port = int(os.getenv('FLASK_RUN_PORT', 5002))
    host = os.getenv('FLASK_RUN_HOST', '0.0.0.0')
    
    logger.info(f"Iniciando servidor Flask em {host}:{port}")
    logger.info(f"Debug mode: {app.debug}")
    
    app.run(debug=app.debug, host=host, port=port)