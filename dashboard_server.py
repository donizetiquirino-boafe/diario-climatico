import os
from flask import Flask, jsonify, send_file, request
from supabase import create_client

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_FILE = os.path.join(BASE_DIR, "dashboard_executivo.html")

SUPABASE_URL = "https://nqidjguwofidfxxiidwe.supabase.co"
SUPABASE_KEY = "sb_publishable_co7vuzhbHU5rym-wBJFxyA_K6dA1J0b"

print(f"Dashboard iniciando... HTML: {HTML_FILE}")
print(f"HTML existe: {os.path.exists(HTML_FILE)}")


def get_dados(start=None, end=None, limit=5000):
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    q = sb.table("registros_clima").select(
        "data_registro,hora_leitura,temp_max,temp_min,temp_seca,umidade,chuva_mm"
    ).order("data_registro", desc=False).limit(limit)
    if start:
        q = q.gte("data_registro", start)
    if end:
        q = q.lte("data_registro", end)
    resp = q.execute()
    return resp.data or []


@app.route("/")
def index():
    return send_file(HTML_FILE)


@app.route("/api/dados")
def api_dados():
    start = request.args.get("start")
    end = request.args.get("end")
    limit = int(request.args.get("limit", 5000))
    print(f"API /api/dados start={start} end={end} limit={limit}")
    try:
        dados = get_dados(start, end, limit)
        print(f"  → {len(dados)} registros retornados")
        return jsonify(dados)
    except Exception as e:
        print(f"  → ERRO: {e}")
        return jsonify({"erro": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8766))
    print(f"Servidor Flask na porta {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
