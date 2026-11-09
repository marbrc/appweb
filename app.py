import json
import os
import threading
from functools import wraps

import pyodbc
from flask import Flask, jsonify, render_template, request

import repositorio as repo
from db import transaccion

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


# ---------- BASE DE DATOS (SQL Server) ----------
# Todo lo que antes se guardaba en datos/store.json y datos/codigos.json ahora vive en SQL Server.
# SOLO el banco de preguntas (admin_preguntas) sigue en un archivo: en la BD la tabla Pregunta
# cuelga de una Encuesta (id_encuesta NOT NULL), así que no hay dónde guardar "las preguntas del sistema".
# Cada evaluación sí guarda sus 12 preguntas + respuestas en Pregunta/Respuesta.

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "datos")
RUTA_PREGUNTAS = os.path.join(BASE, "preguntas.json")
candado = threading.Lock()

def leer_preguntas():
    try:
        with open(RUTA_PREGUNTAS, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        # si todavía no hay preguntas.json, usa las que ya tenían en store.json
        try:
            with open(os.path.join(BASE, "store.json"), encoding="utf-8") as f:
                return json.load(f).get("admin_preguntas", [])
        except (FileNotFoundError, ValueError):
            return []

def guardar_preguntas(lista):
    os.makedirs(BASE, exist_ok=True)
    with open(RUTA_PREGUNTAS, "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=2)

def con_bd(fn):
    """Convierte los errores de la BD en respuestas JSON en vez de un 500 feo."""
    @wraps(fn)
    def envoltura(*a, **k):
        try:
            return fn(*a, **k)
        except repo.ErrorDatos as e:
            return jsonify({"error": str(e)}), e.estado
        except pyodbc.IntegrityError:
            return jsonify({"error": "No se puede: el dato ya existe o tiene información relacionada "
                                     "(clases, encuestas, etc.)."}), 409
        except pyodbc.Error:
            app.logger.exception("Error con SQL Server")
            return jsonify({"error": "No se pudo usar la base de datos. Revisa db.py y que SQL Server esté encendido."}), 500
    return envoltura


# ---------- CATÁLOGO Y EVALUACIONES ----------
# GET /api/datos  todo el catálogo (lo cargan admin y alumno al abrir)
@app.route("/api/datos")
@con_bd
def Datos():
    with transaccion() as cur:
        return jsonify({
            "admin_carreras": repo.leer_carreras(cur),
            "admin_grupos": repo.leer_grupos(cur),
            "admin_docentes": repo.leer_docentes(cur),
            "admin_asignaturas": repo.leer_asignaturas(cur),
            "admin_clases": repo.leer_clases(cur),
            "evaluaciones": repo.leer_evaluaciones(cur),
            "admin_preguntas": leer_preguntas(),
        })

# PUT /api/datos/<clave>  el admin reemplaza una lista completa
SINCRONIZAR = {
    "admin_carreras": repo.sync_carreras,
    "admin_grupos": repo.sync_grupos,
    "admin_docentes": repo.sync_docentes,
    "admin_asignaturas": repo.sync_asignaturas,
    "admin_clases": repo.sync_clases,
}

@app.route("/api/datos/<clave>", methods=["PUT"])
@con_bd
def GuardarDatos(clave):
    if clave != "admin_preguntas" and clave not in SINCRONIZAR:
        return jsonify({"error": "Clave no válida."}), 400
    valor = request.get_json(silent=True)
    if not isinstance(valor, list):
        return jsonify({"error": "Se esperaba una lista."}), 400

    if clave == "admin_preguntas":
        with candado:
            guardar_preguntas(valor)
        return jsonify({"ok": True})

    with transaccion() as cur:
        omitidas = SINCRONIZAR[clave](cur, valor)
    return jsonify({"ok": True, "omitidas": omitidas or []})

# POST /api/evaluaciones  el alumno agrega UNA evaluación (no pisa las de los demás)
@app.route("/api/evaluaciones", methods=["POST"])
@con_bd
def NuevaEvaluacion():
    e = request.get_json(silent=True)
    if not isinstance(e, dict) or not e.get("grupo") or not e.get("profesor"):
        return jsonify({"error": "Evaluación incompleta."}), 400
    textos = [p.get("texto", "") for p in sorted(leer_preguntas(), key=lambda p: p.get("num", 0))]
    with transaccion() as cur:
        repo.guardar_evaluacion(cur, e, textos)
    return jsonify({"ok": True}), 201


# ---------- CÓDIGOS DE ACCESO ----------
# GET  /api/codigos  la lista de todos los códigos, la usa el administrador
# POST /api/codigos  genera el código de una asignación, si ya tenía, el anterior deja de servir
@app.route("/api/codigos", methods=["GET", "POST"])
@con_bd
def Codigos():
    with transaccion() as cur:
        if request.method == "GET":
            return jsonify(repo.listar_codigos(cur))

        datos = request.get_json(silent=True) or {}
        v = {k: str(datos.get(k, "")).strip()[:80] for k in ("grupo", "docente", "materia")}
        if not all(v.values()):
            return jsonify({"error": "Faltan los datos de la asignación."}), 400
        return jsonify(repo.generar_codigo(cur, v["grupo"], v["materia"], v["docente"])), 201

# GET    /api/codigos/K7M2QP  valida el código y regresa la clase, lo usa el alumno
# DELETE /api/codigos/K7M2QP  revoca el código, lo usa el administrador
@app.route("/api/codigos/<codigo>", methods=["GET", "DELETE"])
@con_bd
def Codigo(codigo):
    codigo = codigo.strip().upper()
    with transaccion() as cur:
        if request.method == "DELETE":
            if not repo.revocar_codigo(cur, codigo):
                return jsonify({"error": "Código no válido."}), 404
            return jsonify({"ok": True})
        d = repo.buscar_codigo(cur, codigo)
        if not d:
            return jsonify({"error": "Código no válido."}), 404
        return jsonify(d)


if __name__ == "__main__":
    # al arrancar: prueba la conexión y agrega las columnas del código si faltan
    try:
        with transaccion() as cur:
            repo.asegurar_esquema(cur)
        print("✔ Conectado a SQL Server")
    except pyodbc.Error as err:
        print("✘ No se pudo conectar a SQL Server:", err)
    app.run(debug=True)