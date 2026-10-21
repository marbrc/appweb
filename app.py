import json
import os
import secrets
import threading
from datetime import datetime

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# ---------- PAGINAS ----------flask run

@app.route("/")
def Inicio():
    return render_template("index.html")

@app.route("/encuesta-basica")
def EncuestaBasica():
    return render_template("Encuesta.html")

# el marco, aqui esta el menú y la barra de arriba y adentro se cargan las pantallas
@app.route("/app")
def Marco():
    return render_template("marco.html")

# la entrada del alumno, el enlace con codigo llega aqui
@app.route("/alumno")
def Alumno():
    return render_template("alumno.html")


# ---------- CÓDIGOS DE ACCESO POR GRUPO ----------
# SOLO POR AHORA se guardan en un archivo (datos/codigos.json). Y ya cuando haya base de datos
# solo hay que cambiar las funciones leer_codigos y guardar_codigos

RUTA_CODIGOS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "datos", "codigos.json")

# letras y números sin las que se confunden no hay 0, O, 1, I ni L
ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

# el candado evita que dos personas escriban el archivo al mismo tiempo
candado = threading.Lock()

# leer_codigos, regresa un diccionario { "K7M2QP": {grupo, carrera, cuatri, creado} }
def leer_codigos():
    try:
        with open(RUTA_CODIGOS, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        return {}

def guardar_codigos(codigos):
    os.makedirs(os.path.dirname(RUTA_CODIGOS), exist_ok=True)
    with open(RUTA_CODIGOS, "w", encoding="utf-8") as f:
        json.dump(codigos, f, ensure_ascii=False, indent=2)

# nuevo_codigo, 6 caracteres al azar secrets es el azar "seguro" que no se repita con otro
def nuevo_codigo(existentes):
    while True:
        codigo = "".join(secrets.choice(ALFABETO) for _ in range(6))
        if codigo not in existentes:
            return codigo

# GET  /api/codigos  la lista de todos los códigos la usa el administrador
# POST /api/codigos   genera el código de un grupo si ya tenía, el anterior deja de servir
@app.route("/api/codigos", methods=["GET", "POST"])
def Codigos():
    with candado:
        codigos = leer_codigos()

        if request.method == "GET":
            return jsonify([{"codigo": c, **d} for c, d in codigos.items()])

        datos = request.get_json(silent=True) or {}
        grupo, carrera, cuatri = (str(datos.get(k, "")).strip()[:60] for k in ("grupo", "carrera", "cuatri"))
        if not (grupo and carrera and cuatri):
            return jsonify({"error": "Faltan los datos del grupo."}), 400

        # un grupo tiene un solo código activo, quito el que ya tenía
        codigos = {c: d for c, d in codigos.items() if not (d["grupo"] == grupo and d["carrera"] == carrera)}
        codigo = nuevo_codigo(codigos)
        codigos[codigo] = {"grupo": grupo, "carrera": carrera, "cuatri": cuatri,
                           "creado": datetime.now().strftime("%d/%m/%Y")}
        guardar_codigos(codigos)
        return jsonify({"codigo": codigo, **codigos[codigo]}), 201

# GET    /api/codigos/K7M2QP valida el código y regresa SOLO el grupo lo usa el alumno
# DELETE /api/codigos/K7M2QP  revoca el código lo usa el administrador
@app.route("/api/codigos/<codigo>", methods=["GET", "DELETE"])
def Codigo(codigo):
    codigo = codigo.strip().upper()
    with candado:
        codigos = leer_codigos()
        if codigo not in codigos:
            return jsonify({"error": "Código no válido."}), 404

        if request.method == "DELETE":
            del codigos[codigo]
            guardar_codigos(codigos)
            return jsonify({"ok": True})

        d = codigos[codigo]
        return jsonify({"grupo": d["grupo"], "carrera": d["carrera"], "cuatri": d["cuatri"]})