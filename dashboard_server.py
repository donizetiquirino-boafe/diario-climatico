import os
import http.server
import socketserver

PORT = int(os.environ.get("PORT", 8766))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_FILE = os.path.join(BASE_DIR, "dashboard_executivo.html")

print(f"Porta: {PORT}")
print(f"Diretorio: {BASE_DIR}")
print(f"Arquivo HTML: {HTML_FILE}")
print(f"Arquivo existe: {os.path.exists(HTML_FILE)}")

class DashboardHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if not os.path.exists(HTML_FILE):
            msg = f"Arquivo nao encontrado: {HTML_FILE}".encode("utf-8")
            self.send_response(404)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)
            return

        with open(HTML_FILE, "rb") as f:
            content = f.read()

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format, *args):
        print(f"[REQ] {self.address_string()} - {format % args}")

print(f"Servidor iniciado! Aguardando conexoes...")
with socketserver.TCPServer(("0.0.0.0", PORT), DashboardHandler) as httpd:
    httpd.allow_reuse_address = True
    httpd.serve_forever()
