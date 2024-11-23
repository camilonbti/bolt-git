@echo on
REM Verifica se o Python está configurado
echo Verificando instalacao do Python...
C:\Users\Administrator\AppData\Local\Programs\Python\Python313\python.exe --version
IF %ERRORLEVEL% NEQ 0 (
    echo Python nao esta configurado corretamente.
    pause
    exit /b
)

REM Caminho do script Python
echo Iniciando o servidor Flask na porta 5002...
C:\Users\Administrator\AppData\Local\Programs\Python\Python313\python.exe C:\NetBusiness\bolt_git\app.py

REM Se chegar aqui é porque houve erro
echo Servidor encerrado ou houve erro
pause