import ast
import os

def get_imports(path):
    imports = set()
    
    # Percorre todos os arquivos .py recursivamente
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith('.py'):
                try:
                    with open(os.path.join(root, file), 'r') as f:
                        tree = ast.parse(f.read())
                        
                    for node in ast.walk(tree):
                        if isinstance(node, ast.Import):
                            for name in node.names:
                                imports.add(name.name.split('.')[0])
                        elif isinstance(node, ast.ImportFrom):
                            if node.module:
                                imports.add(node.module.split('.')[0])
                except:
                    continue
    
    return sorted(list(imports))

# Salva no arquivo
current_dir = '.'  # ou o caminho do seu projeto
imports = get_imports(current_dir)

# Remove imports internos do Python e do próprio projeto
external_imports = [imp for imp in imports if not imp.startswith(('_', 'src')) and imp not in ('os', 'sys', 'logging', 'json', 'datetime', 'time')]

# Cria o arquivo requirements.in
with open('requirements_from_code.txt', 'w') as f:
    for imp in external_imports:
        f.write(f"{imp}\n")