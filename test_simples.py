from datetime import datetime
import sys
import os

# Adiciona o diretório src ao path para importação
sys.path.append(os.path.abspath("src"))

from data_processor import ProcessadorDados

def executar_teste(nome_teste, funcao_teste):
    try:
        funcao_teste()
        print(f"✓ {nome_teste}")
        return True
    except AssertionError as e:
        print(f"✗ {nome_teste}")
        print(f"  Erro: {str(e)}")
        return False
    except Exception as e:
        print(f"✗ {nome_teste}")
        print(f"  Erro inesperado: {str(e)}")
        return False

def assert_equal(esperado, obtido, mensagem=""):
    if esperado != obtido:
        raise AssertionError(f"{mensagem} Esperado: {esperado}, Obtido: {obtido}")

def assert_instance(objeto, tipo, mensagem=""):
    if not isinstance(objeto, tipo):
        raise AssertionError(f"{mensagem} Objeto não é instância de {tipo}")

def assert_true(condicao, mensagem=""):
    if not condicao:
        raise AssertionError(mensagem or "Condição é falsa")

def testar_processador():
    processador = ProcessadorDados()
    testes_falhos = 0
    
    # Teste 1: Validação de cabeçalho
    def teste_cabecalho():
        cabecalho = list(processador.config.keys())
        processador.validar_cabecalho(cabecalho)
        assert_true(True, "Cabeçalho válido deveria ser aceito")
    
    # Teste 2: Conversão de data
    def teste_data():
        config = processador.config["Carimbo de data/hora"]
        resultado = processador.converter_valor("01/01/2024 10:00:00", config)
        assert_instance(resultado, datetime)
        assert_equal(2024, resultado.year)
        assert_equal(1, resultado.month)
        assert_equal(1, resultado.day)
    
    # Teste 3: Conversão de string
    def teste_string():
        config = processador.config["Prestador de Serviços:"]
        resultado = processador.converter_valor("joão silva", config)
        assert_equal("João Silva", resultado)
    
    # Teste 4: Validação de campo obrigatório
    def teste_obrigatorio():
        config = processador.config["Status do atendimento:"]
        assert_true(processador.validar_valor("Concluído", config))
        assert_true(not processador.validar_valor("", config))
    
    # Teste 5: Formatação completa
    def teste_formatacao():
        dados_teste = [
            list(processador.config.keys()),
            ["01/01/2024 10:00:00", "joão silva", "empresa teste", "maria oliveira",
             "Problema no sistema", "Cliente não consegue acessar", "Concluído",
             "Suporte Técnico", "Sistema A", "Email"]
        ]
        
        resultado = processador.formatar_dados(dados_teste)
        primeiro_registro = resultado[0]
        
        assert_equal("João Silva", primeiro_registro["funcionario"])
        assert_equal("Concluído", primeiro_registro["status_atendimento"])
        assert_equal("Empresa Teste", primeiro_registro["cliente"])
    
    # Execução dos testes
    testes = [
        ("Validação de cabeçalho", teste_cabecalho),
        ("Conversão de data", teste_data),
        ("Conversão de string", teste_string),
        ("Validação de campo obrigatório", teste_obrigatorio),
        ("Formatação completa", teste_formatacao)
    ]
    
    print("\nExecutando testes do ProcessadorDados:")
    print("-" * 40)
    
    for nome, teste in testes:
        if not executar_teste(nome, teste):
            testes_falhos += 1
    
    print("-" * 40)
    total_testes = len(testes)
    testes_ok = total_testes - testes_falhos
    print(f"\nResultado: {testes_ok}/{total_testes} testes passaram")
    
    return testes_falhos == 0

if __name__ == "__main__":
    sucesso = testar_processador()
    sys.exit(0 if sucesso else 1)