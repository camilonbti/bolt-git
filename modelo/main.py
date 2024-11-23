import os
import ctypes

from flask import Flask, request
from flask_cors import CORS

from routes import makeRoutes

port = os.environ.get('nbti.nbAdminServer-port') or 6001
ctypes.windll.kernel32.SetConsoleTitleW(f"Servidor nbAdminServer {port}")

app = Flask("nbAdminServer")
CORS(app)

makeRoutes(app)

app.run(host='0.0.0.0', port=port)

