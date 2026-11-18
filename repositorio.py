# repositorio.py  ->  todas las consultas a SQL Server.
# Devuelve y recibe los MISMOS formatos JSON que ya usa el front (datos.js), por eso
# no hay que cambiar nada en las pantallas.
import hashlib
import itertools
import re
import secrets
from datetime import datetime

ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"   # sin 0, O, 1, I, L
# los mismos correos que deja el formulario de Docentes (docentes.js)
CORREO_DOCENTE = re.compile(r"[a-z0-9._%+-]+@(gmail\.com|utng\.edu\.mx|outlook\.com)")


class ErrorDatos(Exception):
    def __init__(self, mensaje, estado=400):
        super().__init__(mensaje)
        self.estado = estado


# ---------------------------------------------------------------- utilidades
def asegurar_esquema(cur):
    """Revisa que la BD sea la version nueva: Asignatura solo con nombre, tabla Plan_Estudio,
    Clave_Acceso con la columna Activo y Grupo sin el contador viejo de participaciones.
    Si es la vieja avisa que hay que volver a correr DB_EncuestaDocente.sql y la insercion."""
    cur.execute("SELECT OBJECT_ID('dbo.Plan_Estudio'), COL_LENGTH('dbo.Clave_Acceso','Activo'), "
                "COL_LENGTH('dbo.Respuesta','id_encuesta'), COL_LENGTH('dbo.Administrador','Foto'), "
                "OBJECT_ID('dbo.Recuperacion'), OBJECT_ID('dbo.Opinion')")
    if any(v is None for v in cur.fetchone()):
        raise ErrorDatos("La base de datos es la versión vieja. Vuelve a ejecutar DB_EncuestaDocente.sql "
                         "y después INSERCION_DE_DATOS_REALES.sql", 500)
    cur.execute("SELECT COL_LENGTH('dbo.Asignatura','id_carrera'), COL_LENGTH('dbo.Grupo','participaciones')")
    if any(v is not None for v in cur.fetchone()):
        raise ErrorDatos("La tabla Asignatura o Grupo todavía tiene columnas viejas. Vuelve a ejecutar "
                         "DB_EncuestaDocente.sql y después INSERCION_DE_DATOS_REALES.sql", 500)


def _contador(cur, tabla, col):
    """Las tablas no tienen IDENTITY, así que los ids se calculan: MAX + 1 (con candado)."""
    cur.execute(f"SELECT ISNULL(MAX({col}), 0) FROM dbo.{tabla} WITH (UPDLOCK, HOLDLOCK)")
    return itertools.count(cur.fetchone()[0] + 1)


def _nombre(nombres, paterno, materno):
    return " ".join(p for p in (nombres, paterno, materno) if p)


def _clave_docente(nombres, paterno, materno, correo):
    # igual que el front: el "id" de un docente es su correo o, si no tiene, su nombre completo
    return correo or _nombre(nombres, paterno, materno)


def _diff(actuales, nuevos):
    """Compara lo que hay en la BD contra la lista que manda el front.
    Regresa (comunes, renombres, por_crear, por_borrar). Si sobra exactamente UNO de cada
    lado se toma como EDICIÓN (cambió el correo/clave/nombre) y no como borrar + crear."""
    comunes = [k for k in nuevos if k in actuales]
    sob_v = [k for k in actuales if k not in nuevos]
    sob_n = [k for k in nuevos if k not in actuales]
    renombres = []
    if len(sob_v) == 1 and len(sob_n) == 1:
        renombres, sob_v, sob_n = [(sob_v[0], sob_n[0])], [], []
    return comunes, renombres, sob_n, sob_v


def _texto(v, maximo, campo, obligatorio=True):
    v = " ".join(str(v or "").split())
    if obligatorio and not v:
        raise ErrorDatos(f"Falta {campo}.")
    if len(v) > maximo:
        raise ErrorDatos(f"{campo} no puede pasar de {maximo} caracteres.")
    return v


def _carrera_id(cur, nombre):
    cur.execute("SELECT id_carrera FROM dbo.Carrera WHERE NomCarrera = ?", nombre)
    r = cur.fetchone()
    if not r:
        raise ErrorDatos(f"La carrera «{nombre}» no existe en la base de datos.")
    return r[0]


# ---------------------------------------------------------------- CARRERAS
def leer_carreras(cur):
    cur.execute("SELECT NomCarrera FROM dbo.Carrera ORDER BY id_carrera")
    return [r[0] for r in cur.fetchall()]


def sync_carreras(cur, lista):
    nuevos = {}
    for n in lista:
        n = _texto(n, 60, "el nombre de la carrera")
        nuevos[n] = n
    cur.execute("SELECT NomCarrera, id_carrera FROM dbo.Carrera")
    act = {r[0]: r[1] for r in cur.fetchall()}
    comunes, renombres, crear, borrar = _diff(act, nuevos)
    for viejo, nuevo in renombres:
        cur.execute("UPDATE dbo.Carrera SET NomCarrera = ? WHERE id_carrera = ?", nuevo, act[viejo])
    ids = _contador(cur, "Carrera", "id_carrera")
    for n in crear:
        cur.execute("INSERT INTO dbo.Carrera (id_carrera, NomCarrera) VALUES (?, ?)", next(ids), n)
    for n in borrar:
        cur.execute("DELETE FROM dbo.Carrera WHERE id_carrera = ?", act[n])   # si tiene grupos -> 409


# ---------------------------------------------------------------- GRUPOS
def leer_grupos(cur):
    """Cada grupo trae sus participaciones, calculadas (no guardadas):
       encuestas   = cuantas encuestas se han contestado en todas las clases del grupo
       clases      = cuantas clases (materia + docente) tiene el grupo en Carga Academica
       respondieron= los alumnos que ya contestaron = la clase con mas encuestas (cada alumno
                     contesta una encuesta por clase y es anonimo, asi que no se puede contar mas fino)"""
    cur.execute("""SELECT cl.id_grupo, cl.id_clase, COUNT(e.id_encuesta) AS n
                   FROM dbo.Clase cl
                   LEFT JOIN dbo.Clave_Acceso k ON k.id_clase = cl.id_clase
                   LEFT JOIN dbo.Encuesta e ON e.id_acceso = k.id_acceso
                   GROUP BY cl.id_grupo, cl.id_clase""")
    part = {}
    for id_g, _id_clase, n in cur.fetchall():
        d = part.setdefault(id_g, {"encuestas": 0, "clases": 0, "respondieron": 0})
        d["encuestas"] += n
        d["clases"] += 1
        d["respondieron"] = max(d["respondieron"], n)
    cur.execute("""SELECT g.id_grupo, g.ClaveGrupo, c.NomCarrera, g.Cuatrimestre, g.CantidadAlumnos
                   FROM dbo.Grupo g JOIN dbo.Carrera c ON c.id_carrera = g.id_carrera
                   ORDER BY g.id_grupo""")
    out = []
    for r in cur.fetchall():
        d = part.get(r[0], {"encuestas": 0, "clases": 0, "respondieron": 0})
        out.append({"clave": r[1], "carrera": r[2], "cuatrimestre": int(r[3]), "alumnos": r[4], **d})
    return out


def sync_grupos(cur, lista):
    nuevos = {}
    for it in lista:
        clave = _texto(it.get("clave"), 7, "la clave del grupo")
        try:
            cuatri = int(it.get("cuatrimestre"))
            alumnos = int(it.get("alumnos") or 0)
        except (TypeError, ValueError):
            raise ErrorDatos(f"Cuatrimestre o alumnos inválidos en el grupo {clave}.")
        if not 1 <= cuatri <= 11:
            raise ErrorDatos(f"El cuatrimestre del grupo {clave} debe estar entre 1 y 11.")
        if not 0 <= alumnos <= 100:
            raise ErrorDatos(f"Los alumnos del grupo {clave} deben estar entre 0 y 100.")
        nuevos[clave] = {"carrera": _carrera_id(cur, it.get("carrera")), "cuatri": cuatri, "alumnos": alumnos}

    cur.execute("SELECT ClaveGrupo, id_grupo FROM dbo.Grupo")
    act = {r[0]: r[1] for r in cur.fetchall()}
    comunes, renombres, crear, borrar = _diff(act, nuevos)

    def actualizar(id_g, clave, d):
        cur.execute("UPDATE dbo.Grupo SET ClaveGrupo=?, Cuatrimestre=?, CantidadAlumnos=?, id_carrera=? "
                    "WHERE id_grupo=?", clave, d["cuatri"], d["alumnos"], d["carrera"], id_g)

    for k in comunes:
        actualizar(act[k], k, nuevos[k])
    for viejo, nuevo in renombres:
        actualizar(act[viejo], nuevo, nuevos[nuevo])

    ids = _contador(cur, "Grupo", "id_grupo")
    for clave in crear:
        d, id_g = nuevos[clave], next(ids)
        cur.execute("INSERT INTO dbo.Grupo (id_grupo, ClaveGrupo, Cuatrimestre, CantidadAlumnos, id_carrera) "
                    "VALUES (?, ?, ?, ?, ?)", id_g, clave, d["cuatri"], d["alumnos"], d["carrera"])

    for clave in borrar:
        cur.execute("DELETE FROM dbo.Grupo WHERE id_grupo = ?", act[clave])   # si tiene clases -> 409


# ---------------------------------------------------------------- DOCENTES
def leer_docentes(cur):
    cur.execute("""SELECT dg.id_docente, a.NomAsignatura
                   FROM dbo.Docente_Grupo dg JOIN dbo.Asignatura a ON a.id_asignatura = dg.id_asignatura
                   ORDER BY a.NomAsignatura""")
    mats = {}
    for id_d, nom in cur.fetchall():
        mats.setdefault(id_d, [])
        if nom not in mats[id_d]:
            mats[id_d].append(nom)
    cur.execute("SELECT id_docente, NomDocente, ApellidoPaterno, ApellidoMaterno, Correo "
                "FROM dbo.Docente ORDER BY id_docente")
    out = []
    for r in cur.fetchall():
        d = {"nombre": _nombre(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno),
             "nombres": r.NomDocente, "paterno": r.ApellidoPaterno,
             "materno": r.ApellidoMaterno or "", "correo": r.Correo or ""}
        if r.id_docente in mats:          # si no tiene, el front las saca de sus clases
            d["materias"] = mats[r.id_docente]
        out.append(d)
    return out


def _docente_de_item(it):
    nombres = " ".join(str(it.get("nombres") or "").split())
    paterno = " ".join(str(it.get("paterno") or "").split())
    materno = " ".join(str(it.get("materno") or "").split())
    if not nombres or not paterno:       # datos viejos que solo traen "nombre"
        partes = str(it.get("nombre") or "").split()
        if not partes:
            raise ErrorDatos("Docente sin nombre.")
        paterno = partes[-1] if len(partes) > 1 else "-"
        nombres = " ".join(partes[:-1]) or partes[0]
    correo = str(it.get("correo") or "").strip().lower() or None
    _texto(nombres, 60, "el nombre del docente")
    _texto(paterno, 50, "el apellido paterno")
    _texto(materno, 50, "el apellido materno", obligatorio=False)
    if correo and (len(correo) > 100 or not CORREO_DOCENTE.fullmatch(correo)):
        raise ErrorDatos("Solo se permiten correos Gmail, UTNG u Outlook.")
    mats = it.get("materias")
    mats = list(dict.fromkeys(str(m) for m in mats)) if isinstance(mats, list) else None
    return {"nombres": nombres, "paterno": paterno, "materno": materno or None,
            "correo": correo, "materias": mats}


def sync_docentes(cur, lista):
    cur.execute("SELECT id_docente, NomDocente, ApellidoPaterno, ApellidoMaterno, Correo FROM dbo.Docente")
    act = {_clave_docente(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno, r.Correo): r.id_docente
           for r in cur.fetchall()}
    nuevos = {}
    for it in lista:
        d = _docente_de_item(it)
        nuevos[_clave_docente(d["nombres"], d["paterno"], d["materno"], d["correo"])] = d

    comunes, renombres, crear, borrar = _diff(act, nuevos)
    pares = [(k, k) for k in comunes] + renombres          # (clave vieja, clave nueva)

    cur.execute("""SELECT dg.id_docente, a.NomAsignatura FROM dbo.Docente_Grupo dg
                   JOIN dbo.Asignatura a ON a.id_asignatura = dg.id_asignatura""")
    actuales_m = {}
    for id_d, nom in cur.fetchall():
        actuales_m.setdefault(id_d, set()).add(nom)

    def poner_materias(id_d, d):
        if d["materias"] is None or set(d["materias"]) == actuales_m.get(id_d, set()):
            return
        cur.execute("DELETE FROM dbo.Docente_Grupo WHERE id_docente = ?", id_d)
        for m in d["materias"]:
            cur.execute("INSERT INTO dbo.Docente_Grupo (id_asignatura, id_docente) "
                        "SELECT id_asignatura, ? FROM dbo.Asignatura WHERE NomAsignatura = ?", id_d, m)

    for viejo, nuevo in pares:
        id_d, d = act[viejo], nuevos[nuevo]
        cur.execute("UPDATE dbo.Docente SET NomDocente=?, ApellidoPaterno=?, ApellidoMaterno=?, Correo=? "
                    "WHERE id_docente=?", d["nombres"], d["paterno"], d["materno"], d["correo"], id_d)
        poner_materias(id_d, d)

    ids = _contador(cur, "Docente", "id_docente")
    for k in crear:
        d, id_d = nuevos[k], next(ids)
        cur.execute("INSERT INTO dbo.Docente (id_docente, NomDocente, ApellidoPaterno, ApellidoMaterno, Estatus, Correo) "
                    "VALUES (?, ?, ?, ?, 1, ?)", id_d, d["nombres"], d["paterno"], d["materno"], d["correo"])
        poner_materias(id_d, d)

    for k in borrar:
        cur.execute("DELETE FROM dbo.Docente_Grupo WHERE id_docente = ?", act[k])
        cur.execute("DELETE FROM dbo.Docente WHERE id_docente = ?", act[k])   # si tiene clases -> 409


# ---------------------------------------------------------------- ASIGNATURAS
# Ahora Asignatura es solo un catalogo de nombres. La carrera y el cuatrimestre los tiene el GRUPO;
# para ofrecer las materias que le tocan a un grupo se usa Plan_Estudio (carrera + cuatrimestre -> asignaturas).
def leer_asignaturas(cur):
    cur.execute("""SELECT p.id_asignatura, c.NomCarrera, p.Cuatrimestre
                   FROM dbo.Plan_Estudio p JOIN dbo.Carrera c ON c.id_carrera = p.id_carrera
                   ORDER BY p.id_carrera, p.Cuatrimestre""")
    planes = {}
    for id_a, carrera, cuatri in cur.fetchall():
        planes.setdefault(id_a, []).append({"carrera": carrera, "cuatrimestre": int(cuatri)})
    cur.execute("""SELECT a.id_asignatura, a.NomAsignatura,
                          (SELECT COUNT(*) FROM dbo.Clase cl WHERE cl.id_asignatura = a.id_asignatura)
                   FROM dbo.Asignatura a ORDER BY a.NomAsignatura""")
    return [{"id": r[0], "nombre": r[1], "planes": planes.get(r[0], []), "clases": r[2]}
            for r in cur.fetchall()]


def sync_asignaturas(cur, lista):
    """el front manda la lista completa; lo que trae id se edita (renombrar), lo que no trae se crea
    y lo que ya no viene se borra (si esta en Carga Academica la BD no deja -> 409)"""
    cur.execute("SELECT id_asignatura, NomAsignatura FROM dbo.Asignatura")
    act = {r[0]: r[1] for r in cur.fetchall()}
    vistos = set()
    por_editar, por_crear = [], []
    for it in lista:
        nom = _texto(it.get("nombre"), 60, "el nombre de la asignatura")
        nom = nom[0].upper() + nom[1:]
        if nom.lower() in vistos:
            raise ErrorDatos(f"«{nom}» está repetida en la lista.", 409)
        vistos.add(nom.lower())
        id_a = it.get("id")
        if id_a in act:
            por_editar.append((id_a, nom))
        else:
            por_crear.append(nom)
    conservar = {i for i, _ in por_editar}

    # primero lo que se borra (para liberar nombres), luego renombres y al final lo nuevo
    for id_a in set(act) - conservar:
        cur.execute("DELETE FROM dbo.Plan_Estudio WHERE id_asignatura = ?", id_a)
        cur.execute("DELETE FROM dbo.Docente_Grupo WHERE id_asignatura = ?", id_a)
        cur.execute("DELETE FROM dbo.Asignatura WHERE id_asignatura = ?", id_a)   # si esta en una clase -> 409
    for id_a, nom in por_editar:
        if act[id_a] != nom:
            cur.execute("UPDATE dbo.Asignatura SET NomAsignatura = ? WHERE id_asignatura = ?", nom, id_a)
    ids = _contador(cur, "Asignatura", "id_asignatura")
    for nom in por_crear:
        cur.execute("INSERT INTO dbo.Asignatura (id_asignatura, NomAsignatura) VALUES (?, ?)", next(ids), nom)
    return []


# ---------------------------------------------------------------- CLASES (Carga Académica)
def leer_clases(cur):
    cur.execute("""SELECT cl.id_clase, g.ClaveGrupo, a.NomAsignatura,
                          d.NomDocente, d.ApellidoPaterno, d.ApellidoMaterno, d.Correo
                   FROM dbo.Clase cl
                   JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                   JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura
                   JOIN dbo.Docente d ON d.id_docente = cl.id_docente
                   ORDER BY cl.id_clase""")
    return [{"id": r.id_clase, "grupoId": r.ClaveGrupo, "asignaturaId": r.NomAsignatura,
             "docenteId": _clave_docente(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno, r.Correo)}
            for r in cur.fetchall()]


def _mapa_docentes(cur):
    """acepta el correo O el nombre completo, igual que hace el front"""
    cur.execute("SELECT id_docente, NomDocente, ApellidoPaterno, ApellidoMaterno, Correo FROM dbo.Docente")
    m = {}
    for r in cur.fetchall():
        m[_nombre(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno)] = r.id_docente
        if r.Correo:
            m[r.Correo] = r.id_docente
    return m


def sync_clases(cur, lista):
    docentes = _mapa_docentes(cur)
    cur.execute("""SELECT cl.id_clase, g.ClaveGrupo, a.NomAsignatura, cl.id_docente
                   FROM dbo.Clase cl JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                   JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura""")
    act = {(r[1], r[2]): (r[0], r[3]) for r in cur.fetchall()}
    nuevos = {}
    for it in lista:
        nuevos[(str(it.get("grupoId") or ""), str(it.get("asignaturaId") or ""))] = str(it.get("docenteId") or "")

    ids = _contador(cur, "Clase", "id_clase")
    for (grupo, asig), doc in nuevos.items():
        id_doc = docentes.get(doc)
        if (grupo, asig) in act:
            id_clase, id_actual = act[(grupo, asig)]
            if id_doc and id_doc != id_actual:
                cur.execute("UPDATE dbo.Clase SET id_docente = ? WHERE id_clase = ?", id_doc, id_clase)
            continue
        if not id_doc:
            raise ErrorDatos(f"El docente «{doc}» no existe en la base de datos.")
        # el grupo ya trae su carrera y su cuatrimestre; la asignatura se busca por nombre
        cur.execute("SELECT id_grupo, id_carrera, Cuatrimestre FROM dbo.Grupo WHERE ClaveGrupo = ?", grupo)
        g = cur.fetchone()
        if not g:
            raise ErrorDatos(f"El grupo «{grupo}» no existe en la base de datos.")
        cur.execute("SELECT id_asignatura FROM dbo.Asignatura WHERE NomAsignatura = ?", asig)
        a = cur.fetchone()
        if not a:
            raise ErrorDatos(f"La asignatura «{asig}» no existe en el catálogo.")
        cur.execute("INSERT INTO dbo.Clase (id_clase, id_grupo, id_asignatura, id_docente) VALUES (?, ?, ?, ?)",
                    next(ids), g[0], a[0], id_doc)
        # si la materia no estaba en el plan de esa carrera y cuatrimestre se agrega, asi la proxima vez
        # ya sale sola en la lista de ese grupo
        cur.execute("""IF NOT EXISTS (SELECT 1 FROM dbo.Plan_Estudio WHERE id_carrera = ? AND Cuatrimestre = ? AND id_asignatura = ?)
                       INSERT INTO dbo.Plan_Estudio (id_carrera, Cuatrimestre, id_asignatura) VALUES (?, ?, ?)""",
                    g[1], g[2], a[0], g[1], g[2], a[0])

    for k, (id_clase, _) in act.items():
        if k not in nuevos:
            # los códigos de esa clase que nunca se usaron se van con ella; si ya hay encuestas -> 409
            cur.execute("DELETE FROM dbo.Clave_Acceso WHERE id_clase = ? AND id_acceso NOT IN "
                        "(SELECT id_acceso FROM dbo.Encuesta)", id_clase)
            cur.execute("DELETE FROM dbo.Clase WHERE id_clase = ?", id_clase)


# ---------------------------------------------------------------- CÓDIGOS DE ACCESO
# Un codigo por clase. Se puede DESACTIVAR (el alumno ya no entra) y volver a ACTIVAR; Regenerar da uno nuevo.
_SQL_CODIGOS = """SELECT k.id_acceso, k.Codigo, k.Activo, k.FechaCreacion, g.ClaveGrupo, g.CantidadAlumnos,
                         c.NomCarrera, g.Cuatrimestre, a.NomAsignatura,
                         d.NomDocente, d.ApellidoPaterno, d.ApellidoMaterno, d.Correo,
                         (SELECT COUNT(*) FROM dbo.Encuesta e WHERE e.id_acceso = k.id_acceso) AS Contestaron
                  FROM dbo.Clave_Acceso k
                  JOIN dbo.Clase cl ON cl.id_clase = k.id_clase
                  JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                  JOIN dbo.Carrera c ON c.id_carrera = g.id_carrera
                  JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura
                  JOIN dbo.Docente d ON d.id_docente = cl.id_docente"""


def _fila_codigo(r):
    return {"codigo": r.Codigo, "activo": bool(r.Activo), "grupo": r.ClaveGrupo, "carrera": r.NomCarrera,
            "cuatri": str(int(r.Cuatrimestre)),
            "docente": _clave_docente(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno, r.Correo),
            "docenteNombre": _nombre(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno),
            "materia": r.NomAsignatura, "creado": r.FechaCreacion.strftime("%d/%m/%Y"),
            # participacion de ESTA clase: cuantos ya contestaron con este codigo y de cuantos alumnos
            "contestaron": r.Contestaron, "alumnos": r.CantidadAlumnos}


def listar_codigos(cur):
    cur.execute(_SQL_CODIGOS + " ORDER BY k.id_acceso")
    return [_fila_codigo(r) for r in cur.fetchall()]


def buscar_codigo(cur, codigo):
    """lo usa el alumno. Si el codigo esta desactivado avisa con 403 (distinto a que no exista)"""
    cur.execute(_SQL_CODIGOS + " WHERE k.Codigo = ?", codigo)
    r = cur.fetchone()
    if not r:
        return None
    if not r.Activo:
        raise ErrorDatos("Este código está desactivado. Pídele a tu profesor que lo active.", 403)
    d = _fila_codigo(r)
    for k in ("creado", "contestaron", "alumnos", "activo"):
        d.pop(k)
    return d


def cambiar_estado_codigo(cur, codigo, activo):
    """desactivar o volver a activar un codigo; la fila y el codigo se quedan igual"""
    cur.execute("UPDATE dbo.Clave_Acceso SET Activo = ? WHERE Codigo = ?", 1 if activo else 0, codigo)
    return cur.rowcount > 0


def _clase_de(cur, grupo, materia, docente):
    cur.execute("""SELECT cl.id_clase, d.NomDocente, d.ApellidoPaterno, d.ApellidoMaterno, d.Correo
                   FROM dbo.Clase cl JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                   JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura
                   JOIN dbo.Docente d ON d.id_docente = cl.id_docente
                   WHERE g.ClaveGrupo = ? AND a.NomAsignatura = ?""", grupo, materia)
    for r in cur.fetchall():
        if docente in (r.Correo, _nombre(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno)):
            return r.id_clase
    return None


def generar_codigo(cur, grupo, materia, docente):
    id_clase = _clase_de(cur, grupo, materia, docente)
    if not id_clase:
        raise ErrorDatos("Esa asignación (grupo + docente + materia) no existe en Carga Académica.", 404)
    while True:
        codigo = "".join(secrets.choice(ALFABETO) for _ in range(6))
        cur.execute("SELECT 1 FROM dbo.Clave_Acceso WHERE Codigo = ?", codigo)
        if not cur.fetchone():
            break
    # si la clase ya tenía código, el anterior deja de servir (se reemplaza en la misma fila) y queda activo
    cur.execute("SELECT TOP 1 id_acceso FROM dbo.Clave_Acceso WHERE id_clase = ? ORDER BY id_acceso", id_clase)
    r = cur.fetchone()
    if r:
        cur.execute("UPDATE dbo.Clave_Acceso SET Codigo = ?, Activo = 1, FechaCreacion = GETDATE() WHERE id_acceso = ?",
                    codigo, r[0])
    else:
        id_a = next(_contador(cur, "Clave_Acceso", "id_acceso"))
        cur.execute("INSERT INTO dbo.Clave_Acceso (id_acceso, id_clase, Codigo, Activo) VALUES (?, ?, ?, 1)",
                    id_a, id_clase, codigo)
    cur.execute(_SQL_CODIGOS + " WHERE k.Codigo = ?", codigo)
    return _fila_codigo(cur.fetchone())


# ---------------------------------------------------------------- PREGUNTAS
# las preguntas viven en la tabla Pregunta
def leer_preguntas(cur, solo_activas=False):
    sql = "SELECT id_pregunta, NumPregunta, Texto, Activa FROM dbo.Pregunta"
    if solo_activas:
        sql += " WHERE Activa = 1"
    cur.execute(sql + " ORDER BY NumPregunta, id_pregunta")
    return [{"id": r.id_pregunta, "num": int(r.NumPregunta), "texto": r.Texto, "activa": bool(r.Activa)}
            for r in cur.fetchall()]


def _renumerar(cur):
    """deja los numeros parejitos 1, 2, 3... primero las activas y al final las desactivadas"""
    cur.execute("SELECT id_pregunta FROM dbo.Pregunta ORDER BY Activa DESC, NumPregunta, id_pregunta")
    for i, (id_p,) in enumerate(cur.fetchall(), 1):
        cur.execute("UPDATE dbo.Pregunta SET NumPregunta = ? WHERE id_pregunta = ?", i, id_p)


def _texto_pregunta(cur, texto, id_actual=None):
    t = _texto(texto, 250, "el texto de la pregunta")
    if len(t) < 10:
        raise ErrorDatos("La pregunta debe tener al menos 10 caracteres.")
    t = t[0].upper() + t[1:]
    cur.execute("SELECT id_pregunta FROM dbo.Pregunta WHERE LOWER(Texto) = LOWER(?)", t)
    r = cur.fetchone()
    if r and r[0] != id_actual:
        raise ErrorDatos("Esa pregunta ya existe.", 409)
    return t


def crear_pregunta(cur, texto):
    t = _texto_pregunta(cur, texto)
    cur.execute("SELECT ISNULL(MAX(NumPregunta), 0) FROM dbo.Pregunta WHERE Activa = 1")
    num = cur.fetchone()[0] + 1
    id_p = next(_contador(cur, "Pregunta", "id_pregunta"))
    cur.execute("INSERT INTO dbo.Pregunta (id_pregunta, NumPregunta, Texto, Activa) VALUES (?, ?, ?, 1)", id_p, num, t)
    _renumerar(cur)


def editar_pregunta(cur, id_p, texto=None, activa=None):
    cur.execute("SELECT 1 FROM dbo.Pregunta WHERE id_pregunta = ?", id_p)
    if not cur.fetchone():
        raise ErrorDatos("Esa pregunta no existe.", 404)
    if texto is not None:
        cur.execute("UPDATE dbo.Pregunta SET Texto = ? WHERE id_pregunta = ?", _texto_pregunta(cur, texto, id_p), id_p)
    if activa is not None:
        # si la vuelven a activar se va al final de la lista
        if activa:
            cur.execute("SELECT ISNULL(MAX(NumPregunta), 0) + 1 FROM dbo.Pregunta WHERE Activa = 1")
            num = cur.fetchone()[0]
            cur.execute("UPDATE dbo.Pregunta SET Activa = 1, NumPregunta = ? WHERE id_pregunta = ?", num, id_p)
        else:
            cur.execute("UPDATE dbo.Pregunta SET Activa = 0 WHERE id_pregunta = ?", id_p)
    _renumerar(cur)


def borrar_pregunta(cur, id_p):
    """si ya tiene respuestas NO se borra (se perderian los reportes), solo se desactiva.
    regresa 'borrada' o 'desactivada' para que el front avise que paso"""
    cur.execute("SELECT COUNT(*) FROM dbo.Respuesta WHERE id_pregunta = ?", id_p)
    if cur.fetchone()[0]:
        cur.execute("UPDATE dbo.Pregunta SET Activa = 0 WHERE id_pregunta = ?", id_p)
        accion = "desactivada"
    else:
        cur.execute("DELETE FROM dbo.Pregunta WHERE id_pregunta = ?", id_p)
        accion = "borrada"
    _renumerar(cur)
    return accion


def ordenar_preguntas(cur, ids):
    """recibe los id de las preguntas activas en el orden nuevo"""
    for i, id_p in enumerate(ids, 1):
        cur.execute("UPDATE dbo.Pregunta SET NumPregunta = ? WHERE id_pregunta = ? AND Activa = 1", i, int(id_p))
    _renumerar(cur)


# ---------------------------------------------------------------- EVALUACIONES
def leer_evaluaciones(cur):
    cur.execute("""SELECT e.id_encuesta, e.FechaEncuesta, e.Comentario, c.NomCarrera, g.Cuatrimestre, g.ClaveGrupo,
                          a.NomAsignatura, d.NomDocente, d.ApellidoPaterno, d.ApellidoMaterno
                   FROM dbo.Encuesta e
                   JOIN dbo.Clave_Acceso k ON k.id_acceso = e.id_acceso
                   JOIN dbo.Clase cl ON cl.id_clase = k.id_clase
                   JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                   JOIN dbo.Carrera c ON c.id_carrera = g.id_carrera
                   JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura
                   JOIN dbo.Docente d ON d.id_docente = cl.id_docente
                   ORDER BY e.id_encuesta""")
    evals = {}
    for r in cur.fetchall():
        f = r.FechaEncuesta
        evals[r.id_encuesta] = {
            "id": r.id_encuesta,
            "fecha": f"{f.day}/{f.month}/{f.year}", "carrera": r.NomCarrera, "cuatrimestre": str(int(r.Cuatrimestre)),
            "grupo": r.ClaveGrupo, "profesor": _nombre(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno),
            "materia": r.NomAsignatura, "calificaciones": [], "respuestas": {}, "comentario": r.Comentario or ""}
    cur.execute("""SELECT r.id_encuesta, r.id_pregunta, r.Calificacion FROM dbo.Respuesta r
                   JOIN dbo.Pregunta p ON p.id_pregunta = r.id_pregunta
                   ORDER BY r.id_encuesta, p.NumPregunta""")
    for id_e, id_p, cal in cur.fetchall():
        if id_e in evals:
            evals[id_e]["calificaciones"].append(int(cal))
            evals[id_e]["respuestas"][str(id_p)] = int(cal)
    for e in evals.values():
        c = e["calificaciones"]
        e["promedio"] = round(sum(c) / len(c), 1) if c else 0
    return list(evals.values())


def guardar_evaluacion(cur, codigo, respuestas, comentario=""):
    """el alumno manda el codigo de su enlace y sus respuestas {id_pregunta: calificacion}"""
    cur.execute("""SELECT k.id_acceso, cl.id_clase, g.id_grupo, g.CantidadAlumnos, k.Activo
                   FROM dbo.Clave_Acceso k JOIN dbo.Clase cl ON cl.id_clase = k.id_clase
                   JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                   WHERE k.Codigo = ?""", codigo)
    r = cur.fetchone()
    if not r:
        raise ErrorDatos("El código ya no es válido. Pídele uno nuevo a tu profesor.", 404)
    id_acceso, id_clase, id_grupo, alumnos, activo = r
    if not activo:
        raise ErrorDatos("Este código está desactivado. Pídele a tu profesor que lo active.", 403)

    # si el grupo tiene su numero de alumnos no se dejan mas encuestas que alumnos
    if alumnos:
        cur.execute("""SELECT COUNT(*) FROM dbo.Encuesta e JOIN dbo.Clave_Acceso k ON k.id_acceso = e.id_acceso
                       WHERE k.id_clase = ?""", id_clase)
        if cur.fetchone()[0] >= alumnos:
            raise ErrorDatos("Ya respondieron todos los alumnos de este grupo.", 409)

    activas = leer_preguntas(cur, solo_activas=True)
    if not activas:
        raise ErrorDatos("Todavía no hay preguntas activas en el sistema.", 409)
    if not isinstance(respuestas, dict):
        raise ErrorDatos("Evaluación incompleta.")
    califs = {}
    for p in activas:
        v = respuestas.get(str(p["id"]))
        try:
            v = int(v)
        except (TypeError, ValueError):
            raise ErrorDatos(f"Falta contestar la pregunta {p['num']}.")
        if not 5 <= v <= 10:
            raise ErrorDatos("Las calificaciones deben ir del 5 al 10.")
        califs[p["id"]] = v

    id_enc = next(_contador(cur, "Encuesta", "id_encuesta"))
    comentario = " ".join(str(comentario or "").split())[:300] or None
    cur.execute("INSERT INTO dbo.Encuesta (id_encuesta, Comentario, id_acceso) VALUES (?, ?, ?)",
                id_enc, comentario, id_acceso)
    ids_r = _contador(cur, "Respuesta", "id_respuesta")
    for id_p, cal in califs.items():
        cur.execute("INSERT INTO dbo.Respuesta (id_respuesta, Calificacion, id_pregunta, id_encuesta) VALUES (?, ?, ?, ?)",
                    next(ids_r), cal, id_p, id_enc)
    # ya no se suma ningun contador: la participacion del grupo se calcula contando Encuesta (leer_grupos)
    return id_enc


# ---------------------------------------------------------------- ADMINISTRADORES (login, registro y cuenta)
def hash_clave(clave):
    # es lo mismo que HASHBYTES('SHA2_256', '...') de SQL Server
    return hashlib.sha256(str(clave).encode("utf-8")).digest()


def _fila_admin(r):
    return {"id": r.id_admin, "nombres": r.NomAdmin, "paterno": r.ApellidoPaterno,
            "materno": r.ApellidoMaterno or "", "nombre": _nombre(r.NomAdmin, r.ApellidoPaterno, r.ApellidoMaterno),
            "correo": r.Correo, "foto": r.Foto or "", "rol": "administrador",
            "registro": r.FechaRegistro.strftime("%d/%m/%Y") if r.FechaRegistro else "",
            "ultimoAcceso": r.UltimoAcceso.strftime("%d/%m/%Y %H:%M") if r.UltimoAcceso else ""}


_SQL_ADMIN = ("SELECT id_admin, NomAdmin, ApellidoPaterno, ApellidoMaterno, Correo, Foto, Estatus, "
              "FechaRegistro, UltimoAcceso FROM dbo.Administrador")


def admin_por_id(cur, id_admin):
    cur.execute(_SQL_ADMIN + " WHERE id_admin = ? AND Estatus = 1", id_admin)
    r = cur.fetchone()
    return _fila_admin(r) if r else None


def login(cur, correo, clave):
    correo = str(correo or "").strip().lower()
    cur.execute(_SQL_ADMIN + " WHERE LOWER(Correo) = ? AND Contrasena = ?", correo, hash_clave(clave))
    r = cur.fetchone()
    if not r:
        raise ErrorDatos("Correo o contraseña incorrectos.", 401)
    if not r.Estatus:
        raise ErrorDatos("Tu cuenta está desactivada.", 403)
    usuario = _fila_admin(r)   # el ultimo acceso que se muestra es el de ANTES de entrar ahorita
    cur.execute("UPDATE dbo.Administrador SET UltimoAcceso = GETDATE() WHERE id_admin = ?", r.id_admin)
    return usuario


def _validar_clave(clave):
    clave = str(clave or "")
    if not re.fullmatch(r"(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}", clave):
        raise ErrorDatos("La contraseña debe tener de 8 a 20 caracteres, una mayúscula, una minúscula y un número.")
    return clave


def _validar_correo(cur, correo, id_actual=None):
    correo = str(correo or "").strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", correo) or len(correo) > 100:
        raise ErrorDatos("Escribe un correo válido.")
    cur.execute("SELECT id_admin FROM dbo.Administrador WHERE LOWER(Correo) = ?", correo)
    r = cur.fetchone()
    if r and r[0] != id_actual:
        raise ErrorDatos("Ese correo ya está registrado.", 409)
    return correo


def _validar_nombre(v, campo, maximo, obligatorio=True):
    v = _texto(v, maximo, campo, obligatorio)
    if v and not re.fullmatch(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ. ]+", v):
        raise ErrorDatos(f"{campo[0].upper() + campo[1:]} solo puede tener letras.")
    return v or None


def registrar_admin(cur, d):
    nombres = _validar_nombre(d.get("nombres"), "el nombre", 60)
    paterno = _validar_nombre(d.get("paterno"), "el apellido paterno", 50)
    materno = _validar_nombre(d.get("materno"), "el apellido materno", 50, obligatorio=False)
    correo = _validar_correo(cur, d.get("correo"))
    clave = _validar_clave(d.get("clave"))
    id_a = next(_contador(cur, "Administrador", "id_admin"))
    cur.execute("INSERT INTO dbo.Administrador (id_admin, NomAdmin, ApellidoPaterno, ApellidoMaterno, Correo, "
                "Contrasena, Estatus) VALUES (?, ?, ?, ?, ?, ?, 1)",
                id_a, nombres, paterno, materno, correo, hash_clave(clave))
    return id_a


def listar_admins(cur):
    cur.execute(_SQL_ADMIN + " ORDER BY id_admin")
    return [{**_fila_admin(r), "activo": bool(r.Estatus), "foto": ""} for r in cur.fetchall()]


def cambiar_estatus_admin(cur, id_actual, id_admin, activo):
    """activar o desactivar a otro administrador (nadie puede desactivarse a si mismo ni dejar el sistema sin admins)"""
    if id_actual == id_admin:
        raise ErrorDatos("No puedes desactivar tu propia cuenta.", 409)
    cur.execute("UPDATE dbo.Administrador SET Estatus = ? WHERE id_admin = ?", 1 if activo else 0, id_admin)
    if cur.rowcount == 0:
        raise ErrorDatos("Ese administrador no existe.", 404)


def _revisar_clave_actual(cur, id_admin, clave):
    cur.execute("SELECT 1 FROM dbo.Administrador WHERE id_admin = ? AND Contrasena = ?", id_admin, hash_clave(clave))
    if not cur.fetchone():
        raise ErrorDatos("Tu contraseña actual no es correcta.", 403)


def cambiar_datos(cur, id_admin, d):
    nombres = _validar_nombre(d.get("nombres"), "el nombre", 60)
    paterno = _validar_nombre(d.get("paterno"), "el apellido paterno", 50)
    materno = _validar_nombre(d.get("materno"), "el apellido materno", 50, obligatorio=False)
    cur.execute("UPDATE dbo.Administrador SET NomAdmin = ?, ApellidoPaterno = ?, ApellidoMaterno = ? WHERE id_admin = ?",
                nombres, paterno, materno, id_admin)


def cambiar_correo(cur, id_admin, correo, clave_actual):
    _revisar_clave_actual(cur, id_admin, clave_actual)
    correo = _validar_correo(cur, correo, id_admin)
    cur.execute("UPDATE dbo.Administrador SET Correo = ? WHERE id_admin = ?", correo, id_admin)


def cambiar_clave(cur, id_admin, actual, nueva):
    _revisar_clave_actual(cur, id_admin, actual)
    if actual == nueva:
        raise ErrorDatos("La contraseña nueva tiene que ser diferente a la actual.")
    cur.execute("UPDATE dbo.Administrador SET Contrasena = ? WHERE id_admin = ?", hash_clave(_validar_clave(nueva)), id_admin)


def cambiar_foto(cur, id_admin, foto):
    foto = str(foto or "")
    if foto and not re.match(r"data:image/(png|jpe?g|webp|gif);base64,", foto):
        raise ErrorDatos("La foto tiene que ser una imagen PNG, JPG o WEBP.")
    if len(foto) > 1_500_000:   # mas o menos 1 MB, el front ya la achica antes de mandarla
        raise ErrorDatos("La foto es muy pesada, elige una más chica.")
    cur.execute("UPDATE dbo.Administrador SET Foto = ? WHERE id_admin = ?", foto or None, id_admin)


# ---------------------------------------------------------------- RECUPERAR CONTRASEÑA
MINUTOS_CODIGO = 15


def crear_recuperacion(cur, correo):
    """regresa (correo, nombre, codigo) o None si el correo no existe.
    el codigo es de 6 numeros y en la BD se guarda encriptado"""
    correo = str(correo or "").strip().lower()
    cur.execute("SELECT id_admin, NomAdmin FROM dbo.Administrador WHERE LOWER(Correo) = ? AND Estatus = 1", correo)
    r = cur.fetchone()
    if not r:
        return None
    # los codigos que tenia antes ya no sirven
    cur.execute("UPDATE dbo.Recuperacion SET Usado = 1 WHERE id_admin = ? AND Usado = 0", r.id_admin)
    codigo = f"{secrets.randbelow(1_000_000):06d}"
    id_r = next(_contador(cur, "Recuperacion", "id_recuperacion"))
    cur.execute("INSERT INTO dbo.Recuperacion (id_recuperacion, id_admin, Codigo, FechaExpira) "
                "VALUES (?, ?, ?, DATEADD(MINUTE, ?, GETDATE()))", id_r, r.id_admin, hash_clave(codigo), MINUTOS_CODIGO)
    return correo, r.NomAdmin, codigo


def _recuperacion_valida(cur, correo, codigo):
    cur.execute("""SELECT TOP 1 r.id_recuperacion, r.id_admin FROM dbo.Recuperacion r
                   JOIN dbo.Administrador a ON a.id_admin = r.id_admin
                   WHERE LOWER(a.Correo) = ? AND r.Codigo = ? AND r.Usado = 0 AND r.FechaExpira > GETDATE()
                   ORDER BY r.id_recuperacion DESC""",
                str(correo or "").strip().lower(), hash_clave(str(codigo or "").strip()))
    r = cur.fetchone()
    if not r:
        raise ErrorDatos("El código no es correcto o ya expiró. Pide uno nuevo.", 400)
    return r


def revisar_recuperacion(cur, correo, codigo):
    _recuperacion_valida(cur, correo, codigo)


def usar_recuperacion(cur, correo, codigo, nueva):
    r = _recuperacion_valida(cur, correo, codigo)
    cur.execute("UPDATE dbo.Administrador SET Contrasena = ? WHERE id_admin = ?", hash_clave(_validar_clave(nueva)), r.id_admin)
    cur.execute("UPDATE dbo.Recuperacion SET Usado = 1 WHERE id_recuperacion = ?", r.id_recuperacion)


# ---------------------------------------------------------------- OPINIONES (calificar el sistema)
def guardar_opinion(cur, estrellas, comentario, id_admin=None):
    try:
        estrellas = int(estrellas)
    except (TypeError, ValueError):
        raise ErrorDatos("Elige cuántas estrellas le das al sistema.")
    if not 1 <= estrellas <= 5:
        raise ErrorDatos("Elige de 1 a 5 estrellas.")
    comentario = " ".join(str(comentario or "").split())[:300] or None
    id_o = next(_contador(cur, "Opinion", "id_opinion"))
    cur.execute("INSERT INTO dbo.Opinion (id_opinion, Estrellas, Comentario, id_admin) VALUES (?, ?, ?, ?)",
                id_o, estrellas, comentario, id_admin)