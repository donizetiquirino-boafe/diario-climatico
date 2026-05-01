import os
import http.server
import socketserver

PORT = int(os.environ.get("PORT", 8766))

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Redireciona raiz para o dashboard
        if self.path == "/" or self.path == "":
            self.path = "/dashboard_executivo.html"
        return super().do_GET()

    def log_message(self, format, *args):
        pass  # Silencia logs desnecessários

print(f"Dashboard Executivo rodando na porta {PORT}")
with socketserver.TCPServer(("0.0.0.0", PORT), DashboardHandler) as httpd:
    httpd.serve_forever()
