import json
import os
import secrets
import threading
from datetime import datetime

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# ---------- PAGINAS ----------

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


# ---------- ARCHIVOS JSON ----------
# SOLO POR AHORA todo se guarda en archivos dentro de /datos. Cuando haya base de datos
# solo hay que cambiar leer_json y guardar_json

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "datos")
RUTA_CODIGOS = os.path.join(BASE, "codigos.json")
RUTA_STORE = os.path.join(BASE, "store.json")

# letras y números sin las que se confunden no hay 0, O, 1, I ni L
ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

# el candado evita que dos personas escriban el archivo al mismo tiempo
candado = threading.Lock()

def leer_json(ruta):
    try:
        with open(ruta, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        return {}

def guardar_json(ruta, datos):
    os.makedirs(BASE, exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(datos, f, ensure_ascii=False, indent=2)

leer_codigos = lambda: leer_json(RUTA_CODIGOS)
guardar_codigos = lambda c: guardar_json(RUTA_CODIGOS, c)

# nuevo_codigo, 6 caracteres al azar secrets es el azar "seguro" que no se repita con otro
def nuevo_codigo(existentes):
    while True:
        codigo = "".join(secrets.choice(ALFABETO) for _ in range(6))
        if codigo not in existentes:
            return codigo


# ---------- CATÁLOGO Y EVALUACIONES (lo que antes vivía en localStorage) ----------
# claves permitidas, las mismas que usa datos.js
CLAVES = {"admin_carreras", "admin_grupos", "admin_docentes", "admin_asignaturas",
          "admin_preguntas", "admin_clases", "evaluaciones"}

# GET /api/datos  todo el catálogo (lo cargan admin y alumno al abrir)
@app.route("/api/datos")
def Datos():
    with candado:
        return jsonify(leer_json(RUTA_STORE))

# PUT /api/datos/<clave>  el admin reemplaza una lista completa
@app.route("/api/datos/<clave>", methods=["PUT"])
def GuardarDatos(clave):
    if clave not in CLAVES:
        return jsonify({"error": "Clave no válida."}), 400
    valor = request.get_json(silent=True)
    if not isinstance(valor, list):
        return jsonify({"error": "Se esperaba una lista."}), 400
    with candado:
        store = leer_json(RUTA_STORE)
        store[clave] = valor
        guardar_json(RUTA_STORE, store)
    return jsonify({"ok": True})

# POST /api/evaluaciones  el alumno agrega UNA evaluación (no pisa las de los demás)
@app.route("/api/evaluaciones", methods=["POST"])
def NuevaEvaluacion():
    e = request.get_json(silent=True)
    if not isinstance(e, dict) or not e.get("grupo") or not e.get("profesor"):
        return jsonify({"error": "Evaluación incompleta."}), 400
    with candado:
        store = leer_json(RUTA_STORE)
        store.setdefault("evaluaciones", []).append(e)
        guardar_json(RUTA_STORE, store)
    return jsonify({"ok": True}), 201


# ---------- CÓDIGOS DE ACCESO ----------
# GET  /api/codigos  la lista de todos los códigos, la usa el administrador
# POST /api/codigos  genera el código de una asignación, si ya tenía, el anterior deja de servir
@app.route("/api/codigos", methods=["GET", "POST"])
def Codigos():
    with candado:
        codigos = leer_codigos()

        if request.method == "GET":
            return jsonify([{"codigo": c, **d} for c, d in codigos.items()])

        datos = request.get_json(silent=True) or {}
        campos = ("grupo", "carrera", "cuatri", "docente", "docenteNombre", "materia")
        v = {k: str(datos.get(k, "")).strip()[:80] for k in campos}
        if not all(v[k] for k in ("grupo", "carrera", "cuatri", "docente", "materia")):
            return jsonify({"error": "Faltan los datos de la asignación."}), 400

        codigos = {c: d for c, d in codigos.items() if not (
            d.get("grupo") == v["grupo"] and d.get("carrera") == v["carrera"] and
            d.get("docente") == v["docente"] and d.get("materia") == v["materia"])}
        codigo = nuevo_codigo(codigos)
        codigos[codigo] = {**v, "creado": datetime.now().strftime("%d/%m/%Y")}
        guardar_codigos(codigos)
        return jsonify({"codigo": codigo, **codigos[codigo]}), 201


# GET    /api/codigos/K7M2QP  valida el código y regresa la clase, lo usa el alumno
# DELETE /api/codigos/K7M2QP  revoca el código, lo usa el administrador
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
        return jsonify({k: d.get(k, "") for k in
                        ("grupo", "carrera", "cuatri", "docente", "docenteNombre", "materia")})


if __name__ == "__main__":
    app.run(debug=True)