@echo off
echo Iniciando a remoção de pastas __pycache__...
for /d /r . %%d in (__pycache__) do (
    echo Removendo a pasta %%d...
    rmdir /s /q "%%d"
)
echo Concluído!
pause