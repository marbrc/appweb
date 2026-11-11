import os
import smtplib
import threading
import time
from datetime import timedelta
from functools import wraps

import pyodbc
from flask import Flask, jsonify, render_template, request, session

import correo
import repositorio as repo
from db import transaccion

app = Flask(__name__)
# la llave con la que flask firma la cookie de la sesion, si alguien la cambia la sesion ya no sirve
app.secret_key = os.environ.get("SECRET_KEY", "encuesta-docente-utng-gtid243-cambiar-en-produccion")
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax",
                  PERMANENT_SESSION_LIFETIME=timedelta(days=7))

# ---------- PAGINAS ----------

# el login, el registro y recuperar contraseña estan en la misma pagina
@app.route("/")
def Inicio():
    return render_template("index.html")

# el marco, aqui esta el menú y la barra de arriba y adentro se cargan las pantallas
@app.route("/app")
def Marco():
    return render_template("marco.html")

# la entrada del alumno, el enlace con codigo llega aqui y aqui mismo contesta la encuesta
@app.route("/alumno")
def Alumno():
    return render_template("alumno.html")


# ---------- BASE DE DATOS (SQL Server) ----------
# Todo vive en SQL Server, ya tambien las preguntas (tabla Pregunta).
# datos/store.json, datos/codigos.json y datos/preguntas.json ya no se usan.

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


def solo_admin(fn):
    """las rutas del administrador, si no inicio sesion regresa 401 y el front lo manda al login"""
    @wraps(fn)
    def envoltura(*a, **k):
        if not session.get("id_admin"):
            return jsonify({"error": "Tu sesión terminó, vuelve a iniciar sesión."}), 401
        return fn(*a, **k)
    return envoltura


def cuerpo():
    d = request.get_json(silent=True)
    return d if isinstance(d, dict) else {}


# ---------- INTENTOS (para que no adivinen contraseñas ni codigos) ----------
# se guardan en memoria, si se reinicia flask se borran y no pasa nada
intentos = {}
candado = threading.Lock()
MAX_INTENTOS, ESPERA = 5, 300   # 5 intentos y luego 5 minutos de espera

def bloqueado(clave):
    with candado:
        n, desde = intentos.get(clave, (0, 0))
        if n >= MAX_INTENTOS and time.time() - desde < ESPERA:
            return True
        if time.time() - desde >= ESPERA:
            intentos.pop(clave, None)
        return False

def fallo(clave):
    with candado:
        n, desde = intentos.get(clave, (0, time.time()))
        intentos[clave] = (n + 1, desde)

def acierto(clave):
    with candado:
        intentos.pop(clave, None)


# ---------- SESIÓN: LOGIN, REGISTRO Y SALIR ----------
@app.route("/api/login", methods=["POST"])
@con_bd
def Login():
    d = cuerpo()
    llave = "login:" + str(d.get("correo", "")).strip().lower()
    if bloqueado(llave):
        return jsonify({"error": "Demasiados intentos. Espera 5 minutos y vuelve a intentar."}), 429
    try:
        with transaccion() as cur:
            usuario = repo.login(cur, d.get("correo"), d.get("clave"))
    except repo.ErrorDatos:
        fallo(llave)
        raise
    acierto(llave)
    session.clear()
    session["id_admin"] = usuario["id"]
    session.permanent = bool(d.get("recordar"))
    return jsonify(usuario)

@app.route("/api/registro", methods=["POST"])
@con_bd
def Registro():
    with transaccion() as cur:
        id_admin = repo.registrar_admin(cur, cuerpo())
        usuario = repo.admin_por_id(cur, id_admin)
    # al registrarse ya queda con la sesion iniciada
    session.clear()
    session["id_admin"] = id_admin
    return jsonify(usuario), 201

@app.route("/api/logout", methods=["POST"])
def Logout():
    session.clear()
    return jsonify({"ok": True})

# GET /api/yo  quien tiene la sesion iniciada, el marco lo pregunta al abrir
@app.route("/api/yo")
@solo_admin
@con_bd
def Yo():
    with transaccion() as cur:
        usuario = repo.admin_por_id(cur, session["id_admin"])
    if not usuario:
        session.clear()
        return jsonify({"error": "Tu cuenta ya no existe."}), 401
    return jsonify(usuario)


# ---------- MI CUENTA ----------
@app.route("/api/cuenta", methods=["PUT"])
@solo_admin
@con_bd
def CuentaDatos():
    with transaccion() as cur:
        repo.cambiar_datos(cur, session["id_admin"], cuerpo())
        return jsonify(repo.admin_por_id(cur, session["id_admin"]))

@app.route("/api/cuenta/correo", methods=["PUT"])
@solo_admin
@con_bd
def CuentaCorreo():
    d = cuerpo()
    with transaccion() as cur:
        repo.cambiar_correo(cur, session["id_admin"], d.get("correo"), d.get("clave"))
        return jsonify(repo.admin_por_id(cur, session["id_admin"]))

@app.route("/api/cuenta/clave", methods=["PUT"])
@solo_admin
@con_bd
def CuentaClave():
    d = cuerpo()
    with transaccion() as cur:
        repo.cambiar_clave(cur, session["id_admin"], d.get("actual"), d.get("nueva"))
    return jsonify({"ok": True})

@app.route("/api/cuenta/foto", methods=["PUT", "DELETE"])
@solo_admin
@con_bd
def CuentaFoto():
    foto = "" if request.method == "DELETE" else cuerpo().get("foto")
    with transaccion() as cur:
        repo.cambiar_foto(cur, session["id_admin"], foto)
        return jsonify(repo.admin_por_id(cur, session["id_admin"]))


# ---------- RECUPERAR CONTRASEÑA (3 pasos) ----------
# 1 POST /api/recuperar            {correo}                 manda el codigo de 6 numeros
# 2 POST /api/recuperar/verificar  {correo, codigo}         revisa el codigo antes de pedir la contraseña
# 3 POST /api/recuperar/cambiar    {correo, codigo, clave}  pone la contraseña nueva
@app.route("/api/recuperar", methods=["POST"])
@con_bd
def Recuperar():
    dir_correo = str(cuerpo().get("correo", "")).strip().lower()
    if "@" not in dir_correo:
        return jsonify({"error": "Escribe un correo válido."}), 400
    with transaccion() as cur:
        datos = repo.crear_recuperacion(cur, dir_correo)
    enviado = False
    if datos:
        try:
            enviado = correo.mandar_codigo(datos[0], datos[1], datos[2], repo.MINUTOS_CODIGO)
        except (smtplib.SMTPException, OSError):
            app.logger.exception("No se pudo mandar el correo")
            return jsonify({"error": "No se pudo mandar el correo. Revisa la configuración de correo.py."}), 502
    # por seguridad no se dice si el correo existe o no, el mensaje es el mismo
    return jsonify({"ok": True, "prueba": not correo.configurado(), "enviado": enviado})

@app.route("/api/recuperar/verificar", methods=["POST"])
@con_bd
def RecuperarVerificar():
    d = cuerpo()
    llave = "rec:" + str(d.get("correo", "")).strip().lower()
    if bloqueado(llave):
        return jsonify({"error": "Demasiados intentos. Pide un código nuevo en 5 minutos."}), 429
    try:
        with transaccion() as cur:
            repo.revisar_recuperacion(cur, d.get("correo"), d.get("codigo"))
    except repo.ErrorDatos:
        fallo(llave)
        raise
    return jsonify({"ok": True})

@app.route("/api/recuperar/cambiar", methods=["POST"])
@con_bd
def RecuperarCambiar():
    d = cuerpo()
    llave = "rec:" + str(d.get("correo", "")).strip().lower()
    if bloqueado(llave):
        return jsonify({"error": "Demasiados intentos. Pide un código nuevo en 5 minutos."}), 429
    try:
        with transaccion() as cur:
            repo.usar_recuperacion(cur, d.get("correo"), d.get("codigo"), d.get("clave"))
    except repo.ErrorDatos:
        fallo(llave)
        raise
    acierto(llave)
    return jsonify({"ok": True})


# ---------- CATÁLOGO Y EVALUACIONES ----------
# GET /api/datos  todo el catálogo (lo carga el admin al abrir)
@app.route("/api/datos")
@solo_admin
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
            "admin_preguntas": repo.leer_preguntas(cur),
        })

# PUT /api/datos/<clave>  el admin reemplaza una lista completa
SINCRONIZAR = {
    "admin_carreras": repo.sync_carreras,
    "admin_grupos": repo.sync_grupos,
    "admin_docentes": repo.sync_docentes,
    "admin_asignaturas": repo.sync_asignaturas,
    "admin_clases": repo.sync_clases,
}
LEER = {
    "admin_carreras": repo.leer_carreras,
    "admin_grupos": repo.leer_grupos,
    "admin_docentes": repo.leer_docentes,
    "admin_asignaturas": repo.leer_asignaturas,
    "admin_clases": repo.leer_clases,
}

@app.route("/api/datos/<clave>", methods=["PUT"])
@solo_admin
@con_bd
def GuardarDatos(clave):
    if clave not in SINCRONIZAR:
        return jsonify({"error": "Clave no válida."}), 400
    valor = request.get_json(silent=True)
    if not isinstance(valor, list):
        return jsonify({"error": "Se esperaba una lista."}), 400
    with transaccion() as cur:
        omitidas = SINCRONIZAR[clave](cur, valor)
        # regresa como quedo en la BD para que el front se quede igualito
        return jsonify({"ok": True, "omitidas": omitidas or [], "lista": LEER[clave](cur)})

# POST /api/evaluaciones  el alumno manda {codigo, respuestas: {id_pregunta: calificacion}, comentario}
@app.route("/api/evaluaciones", methods=["POST"])
@con_bd
def NuevaEvaluacion():
    d = cuerpo()
    codigo = str(d.get("codigo", "")).strip().upper()
    if not codigo:
        return jsonify({"error": "Falta el código de acceso."}), 400
    with transaccion() as cur:
        repo.guardar_evaluacion(cur, codigo, d.get("respuestas"), d.get("comentario"))
    return jsonify({"ok": True}), 201


# ---------- PREGUNTAS ----------
# GET /api/preguntas  las activas en orden (las usa el alumno), el admin con ?todas=1 tambien ve las desactivadas
@app.route("/api/preguntas")
@con_bd
def Preguntas():
    todas = request.args.get("todas") == "1" and session.get("id_admin")
    with transaccion() as cur:
        return jsonify(repo.leer_preguntas(cur, solo_activas=not todas))

@app.route("/api/preguntas", methods=["POST"])
@solo_admin
@con_bd
def NuevaPregunta():
    with transaccion() as cur:
        repo.crear_pregunta(cur, cuerpo().get("texto"))
        return jsonify(repo.leer_preguntas(cur)), 201

@app.route("/api/preguntas/<int:id_p>", methods=["PUT", "DELETE"])
@solo_admin
@con_bd
def Pregunta(id_p):
    with transaccion() as cur:
        if request.method == "DELETE":
            accion = repo.borrar_pregunta(cur, id_p)
            return jsonify({"accion": accion, "lista": repo.leer_preguntas(cur)})
        d = cuerpo()
        repo.editar_pregunta(cur, id_p, d.get("texto"), d.get("activa"))
        return jsonify(repo.leer_preguntas(cur))

@app.route("/api/preguntas/orden", methods=["PUT"])
@solo_admin
@con_bd
def OrdenPreguntas():
    ids = request.get_json(silent=True)
    if not isinstance(ids, list):
        return jsonify({"error": "Se esperaba una lista."}), 400
    with transaccion() as cur:
        repo.ordenar_preguntas(cur, ids)
        return jsonify(repo.leer_preguntas(cur))


# ---------- CÓDIGOS DE ACCESO ----------
# GET  /api/codigos  la lista de todos los códigos, la usa el administrador
# POST /api/codigos  genera el código de una asignación, si ya tenía, el anterior deja de servir
@app.route("/api/codigos", methods=["GET", "POST"])
@solo_admin
@con_bd
def Codigos():
    with transaccion() as cur:
        if request.method == "GET":
            return jsonify(repo.listar_codigos(cur))

        datos = cuerpo()
        v = {k: str(datos.get(k, "")).strip()[:80] for k in ("grupo", "docente", "materia")}
        if not all(v.values()):
            return jsonify({"error": "Faltan los datos de la asignación."}), 400
        return jsonify(repo.generar_codigo(cur, v["grupo"], v["materia"], v["docente"])), 201

# GET    /api/codigos/K7M2QP  valida el código y regresa la clase, lo usa el alumno (no necesita sesion)
# DELETE /api/codigos/K7M2QP  revoca el código, lo usa el administrador
@app.route("/api/codigos/<codigo>", methods=["GET", "DELETE"])
@con_bd
def Codigo(codigo):
    codigo = codigo.strip().upper()
    if request.method == "DELETE" and not session.get("id_admin"):
        return jsonify({"error": "Tu sesión terminó, vuelve a iniciar sesión."}), 401
    with transaccion() as cur:
        if request.method == "DELETE":
            if not repo.revocar_codigo(cur, codigo):
                return jsonify({"error": "Código no válido."}), 404
            return jsonify({"ok": True})
        d = repo.buscar_codigo(cur, codigo)
        if not d:
            return jsonify({"error": "Código no válido."}), 404
        return jsonify(d)


# ---------- CALIFICAR EL SISTEMA ----------
@app.route("/api/opiniones", methods=["POST"])
@con_bd
def Opinion():
    d = cuerpo()
    with transaccion() as cur:
        repo.guardar_opinion(cur, d.get("estrellas"), d.get("comentario"), session.get("id_admin"))
    return jsonify({"ok": True}), 201


if __name__ == "__main__":
    # al arrancar: prueba la conexión y revisa que la BD sea la versión nueva
    try:
        with transaccion() as cur:
            repo.asegurar_esquema(cur)
        print("✔ Conectado a SQL Server")
    except repo.ErrorDatos as err:
        print("✘", err)
    except pyodbc.Error as err:
        print("✘ No se pudo conectar a SQL Server:", err)
    if not correo.configurado():
        print("ℹ correo.py sin configurar: los códigos para recuperar contraseña salen aquí en la terminal")
    app.run(debug=True)
