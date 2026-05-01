import os
import http.server
import socketserver

PORT = int(os.environ.get("PORT", 8766))

# Diretório onde este script está localizado
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

print(f"Iniciando servidor na porta {PORT}")
print(f"Servindo arquivos de: {BASE_DIR}")
print(f"Arquivos disponíveis: {os.listdir(BASE_DIR)}")

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        # Redireciona raiz para o dashboard
        if self.path == "/" or self.path == "":
            self.path = "/dashboard_executivo.html"
        return super().do_GET()

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")

with socketserver.TCPServer(("0.0.0.0", PORT), DashboardHandler) as httpd:
    httpd.allow_reuse_address = True
    print(f"Dashboard no ar! Porta {PORT}")
    httpd.serve_forever()
