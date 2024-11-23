@echo on
REM Define o diretório do script como working directory
cd /d "C:\NetBusiness\bolt_git"

REM Configura Python
set PYTHONPATH=C:\NetBusiness\bolt_git
set FLASK_APP=app.py
set FLASK_ENV=development

REM Executa a aplicação
"C:\Users\Administrator\AppData\Local\Programs\Python\Python313\python.exe" app.py

pause
