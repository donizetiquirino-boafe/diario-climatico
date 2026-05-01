import os
from datetime import datetime
from flask import Flask, jsonify, send_file, request
from supabase import create_client

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_FILE = os.path.join(BASE_DIR, "dashboard_executivo.html")

SUPABASE_URL = "https://nqidjguwofidfxxiidwe.supabase.co"
SUPABASE_KEY = "sb_publishable_co7vuzhbHU5rym-wBJFxyA_K6dA1J0b"

print(f"Dashboard Flask iniciando... porta={os.environ.get('PORT',8766)}")


def parse_date(s):
    """Converte DD/MM/YYYY ou YYYY-MM-DD para date object."""
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(s), fmt).date()
        except Exception:
            pass
    return None


def get_dados(start=None, end=None, limit=5000):
    """Busca todos os registros e filtra por data no Python."""
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    resp = sb.table("registros_clima").select(
        "data_registro,hora_leitura,temp_max,temp_min,temp_seca,umidade,chuva_mm"
    ).execute()
    todos = resp.data or []

    start_dt = datetime.strptime(start, "%Y-%m-%d").date() if start else None
    end_dt   = datetime.strptime(end,   "%Y-%m-%d").date() if end   else None

    resultado = []
    for r in todos:
        d = parse_date(r.get("data_registro"))
        if d is None:
            continue
        if start_dt and d < start_dt:
            continue
        if end_dt and d > end_dt:
            continue
        # Normaliza data para YYYY-MM-DD (o JS espera esse formato)
        r["data_registro"] = d.isoformat()
        resultado.append(r)

    resultado.sort(key=lambda x: x["data_registro"])
    return resultado[:limit]


@app.route("/")
def index():
    return send_file(HTML_FILE)


@app.route("/api/dados")
def api_dados():
    start = request.args.get("start")
    end   = request.args.get("end")
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
    print(f"Servidor na porta {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
