# repositorio.py  ->  todas las consultas a SQL Server.
# Devuelve y recibe los MISMOS formatos JSON que ya usa el front (datos.js), por eso
# no hay que cambiar nada en las pantallas.
import itertools
import secrets
from datetime import datetime

ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"   # sin 0, O, 1, I, L


class ErrorDatos(Exception):
    def __init__(self, mensaje, estado=400):
        super().__init__(mensaje)
        self.estado = estado


# ---------------------------------------------------------------- utilidades
def asegurar_esquema(cur):
    """Agrega a Clave_Acceso las columnas Codigo y FechaCreacion si todavía no existen."""
    cur.execute("IF COL_LENGTH('dbo.Clave_Acceso','Codigo') IS NULL "
                "ALTER TABLE dbo.Clave_Acceso ADD Codigo varchar(6) NULL")
    cur.execute("IF COL_LENGTH('dbo.Clave_Acceso','FechaCreacion') IS NULL "
                "ALTER TABLE dbo.Clave_Acceso ADD FechaCreacion datetime NOT NULL "
                "CONSTRAINT DF_ClaveAcceso_Fecha DEFAULT (GETDATE())")
    cur.execute("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UQ_ClaveAcceso_Codigo' "
                "AND object_id=OBJECT_ID('dbo.Clave_Acceso')) "
                "EXEC('CREATE UNIQUE INDEX UQ_ClaveAcceso_Codigo ON dbo.Clave_Acceso (Codigo) "
                "WHERE Codigo IS NOT NULL')")


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
    cur.execute("""SELECT g.ClaveGrupo, c.NomCarrera, g.Cuatrimestre, g.CantidadAlumnos
                   FROM dbo.Grupo g JOIN dbo.Carrera c ON c.id_carrera = g.id_carrera
                   ORDER BY g.id_grupo""")
    return [{"clave": r[0], "carrera": r[1], "cuatrimestre": int(r[2]), "alumnos": r[3]}
            for r in cur.fetchall()]


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
        if alumnos < 0:
            raise ErrorDatos(f"Alumnos inválidos en el grupo {clave}.")
        nuevos[clave] = {"carrera": _carrera_id(cur, it.get("carrera")), "cuatri": cuatri, "alumnos": alumnos}

    cur.execute("SELECT ClaveGrupo, id_grupo FROM dbo.Grupo")
    act = {r[0]: r[1] for r in cur.fetchall()}
    comunes, renombres, crear, borrar = _diff(act, nuevos)

    def actualizar(id_g, clave, d):
        cur.execute("UPDATE dbo.Grupo SET ClaveGrupo=?, Cuatrimestre=?, CantidadAlumnos=?, id_carrera=? "
                    "WHERE id_grupo=?", clave, d["cuatri"], d["alumnos"], d["carrera"], id_g)
        cur.execute("UPDATE dbo.Asignatura SET id_carrera=? WHERE id_grupo=?", d["carrera"], id_g)

    for k in comunes:
        actualizar(act[k], k, nuevos[k])
    for viejo, nuevo in renombres:
        actualizar(act[viejo], nuevo, nuevos[nuevo])

    ids = _contador(cur, "Grupo", "id_grupo")
    ids_asig = _contador(cur, "Asignatura", "id_asignatura")
    for clave in crear:
        d, id_g = nuevos[clave], next(ids)
        cur.execute("INSERT INTO dbo.Grupo (id_grupo, ClaveGrupo, Cuatrimestre, CantidadAlumnos, id_carrera, participaciones) "
                    "VALUES (?, ?, ?, ?, ?, 0)", id_g, clave, d["cuatri"], d["alumnos"], d["carrera"])
        # el grupo nuevo hereda las asignaturas que ya tienen los demás grupos de su carrera y cuatrimestre
        cur.execute("""SELECT DISTINCT a.NomAsignatura FROM dbo.Asignatura a
                       JOIN dbo.Grupo g ON g.id_grupo = a.id_grupo
                       WHERE g.id_carrera = ? AND g.Cuatrimestre = ? AND g.id_grupo <> ?""",
                    d["carrera"], d["cuatri"], id_g)
        for (nom,) in cur.fetchall():
            cur.execute("INSERT INTO dbo.Asignatura (id_asignatura, NomAsignatura, id_grupo, id_carrera) "
                        "VALUES (?, ?, ?, ?)", next(ids_asig), nom, id_g, d["carrera"])

    for clave in borrar:
        id_g = act[clave]
        cur.execute("DELETE FROM dbo.Docente_Grupo WHERE id_asignatura IN "
                    "(SELECT id_asignatura FROM dbo.Asignatura WHERE id_grupo = ?)", id_g)
        cur.execute("DELETE FROM dbo.Asignatura WHERE id_grupo = ?", id_g)
        cur.execute("DELETE FROM dbo.Grupo WHERE id_grupo = ?", id_g)   # si tiene clases -> 409


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
    if correo and len(correo) > 100:
        raise ErrorDatos("El correo no puede pasar de 100 caracteres.")
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
# En la BD cada asignatura existe UNA VEZ POR GRUPO. En el front es una sola por carrera + cuatrimestre.
def leer_asignaturas(cur):
    cur.execute("""SELECT a.NomAsignatura, c.NomCarrera, g.Cuatrimestre
                   FROM dbo.Asignatura a
                   JOIN dbo.Grupo g ON g.id_grupo = a.id_grupo
                   JOIN dbo.Carrera c ON c.id_carrera = g.id_carrera
                   GROUP BY a.NomAsignatura, c.NomCarrera, g.Cuatrimestre
                   ORDER BY MIN(a.id_asignatura)""")
    return [{"nombre": r[0], "carrera": r[1], "cuatrimestre": int(r[2])} for r in cur.fetchall()]


def sync_asignaturas(cur, lista):
    omitidas = []
    nuevos = {}
    for it in lista:
        nom = _texto(it.get("nombre"), 60, "el nombre de la asignatura")
        carrera, cuatri = it.get("carrera"), it.get("cuatrimestre")
        if not carrera or not cuatri:
            omitidas.append(nom)          # sin carrera y cuatrimestre no hay a qué grupo ligarla
            continue
        nuevos[(nom, carrera, int(cuatri))] = None

    cur.execute("""SELECT a.id_asignatura, a.NomAsignatura, c.NomCarrera, g.Cuatrimestre
                   FROM dbo.Asignatura a JOIN dbo.Grupo g ON g.id_grupo = a.id_grupo
                   JOIN dbo.Carrera c ON c.id_carrera = g.id_carrera""")
    act = {}
    for id_a, nom, carr, cuat in cur.fetchall():
        act.setdefault((nom, carr, int(cuat)), []).append(id_a)

    comunes, renombres, crear, borrar = _diff(act, nuevos)
    for viejo, nuevo in renombres:
        if viejo[1:] == nuevo[1:]:        # solo cambió el nombre
            for id_a in act[viejo]:
                cur.execute("UPDATE dbo.Asignatura SET NomAsignatura = ? WHERE id_asignatura = ?", nuevo[0], id_a)
        else:
            crear.append(nuevo)
            borrar.append(viejo)

    ids = _contador(cur, "Asignatura", "id_asignatura")
    for nom, carr, cuat in crear:
        cur.execute("""SELECT g.id_grupo, g.id_carrera FROM dbo.Grupo g
                       JOIN dbo.Carrera c ON c.id_carrera = g.id_carrera
                       WHERE c.NomCarrera = ? AND g.Cuatrimestre = ?""", carr, cuat)
        grupos = cur.fetchall()
        if not grupos:
            omitidas.append(nom)          # todavía no hay grupos en esa carrera y cuatrimestre
            continue
        for id_g, id_c in grupos:
            cur.execute("INSERT INTO dbo.Asignatura (id_asignatura, NomAsignatura, id_grupo, id_carrera) "
                        "VALUES (?, ?, ?, ?)", next(ids), nom, id_g, id_c)

    for k in borrar:
        for id_a in act[k]:
            cur.execute("DELETE FROM dbo.Docente_Grupo WHERE id_asignatura = ?", id_a)
            cur.execute("DELETE FROM dbo.Asignatura WHERE id_asignatura = ?", id_a)   # si tiene clases -> 409
    return omitidas


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
        cur.execute("""SELECT g.id_grupo, a.id_asignatura FROM dbo.Grupo g
                       JOIN dbo.Asignatura a ON a.id_grupo = g.id_grupo
                       WHERE g.ClaveGrupo = ? AND a.NomAsignatura = ?""", grupo, asig)
        r = cur.fetchone()
        if not r:
            raise ErrorDatos(f"El grupo {grupo} no tiene la asignatura «{asig}».")
        cur.execute("INSERT INTO dbo.Clase (id_clase, id_grupo, id_asignatura, id_docente) VALUES (?, ?, ?, ?)",
                    next(ids), r[0], r[1], id_doc)

    for k, (id_clase, _) in act.items():
        if k not in nuevos:
            # los códigos de esa clase que nunca se usaron se van con ella; si ya hay encuestas -> 409
            cur.execute("DELETE FROM dbo.Clave_Acceso WHERE id_clase = ? AND id_acceso NOT IN "
                        "(SELECT id_acceso FROM dbo.Encuesta)", id_clase)
            cur.execute("DELETE FROM dbo.Clase WHERE id_clase = ?", id_clase)


# ---------------------------------------------------------------- CÓDIGOS DE ACCESO
_SQL_CODIGOS = """SELECT k.id_acceso, k.Codigo, k.FechaCreacion, g.ClaveGrupo, c.NomCarrera, g.Cuatrimestre,
                         a.NomAsignatura, d.NomDocente, d.ApellidoPaterno, d.ApellidoMaterno, d.Correo
                  FROM dbo.Clave_Acceso k
                  JOIN dbo.Clase cl ON cl.id_clase = k.id_clase
                  JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                  JOIN dbo.Carrera c ON c.id_carrera = g.id_carrera
                  JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura
                  JOIN dbo.Docente d ON d.id_docente = cl.id_docente"""


def _fila_codigo(r):
    return {"codigo": r.Codigo, "grupo": r.ClaveGrupo, "carrera": r.NomCarrera, "cuatri": str(int(r.Cuatrimestre)),
            "docente": _clave_docente(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno, r.Correo),
            "docenteNombre": _nombre(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno),
            "materia": r.NomAsignatura, "creado": r.FechaCreacion.strftime("%d/%m/%Y")}


def listar_codigos(cur):
    cur.execute(_SQL_CODIGOS + " WHERE k.Codigo IS NOT NULL ORDER BY k.id_acceso")
    return [_fila_codigo(r) for r in cur.fetchall()]


def buscar_codigo(cur, codigo):
    cur.execute(_SQL_CODIGOS + " WHERE k.Codigo = ?", codigo)
    r = cur.fetchone()
    if not r:
        return None
    d = _fila_codigo(r)
    d.pop("creado")
    return d


def revocar_codigo(cur, codigo):
    # no se borra la fila porque las encuestas ya contestadas dependen de ella; solo se le quita el código
    cur.execute("UPDATE dbo.Clave_Acceso SET Codigo = NULL WHERE Codigo = ?", codigo)
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
    # si la clase ya tenía código, el anterior deja de servir (se reemplaza en la misma fila)
    cur.execute("SELECT TOP 1 id_acceso FROM dbo.Clave_Acceso WHERE id_clase = ? ORDER BY id_acceso", id_clase)
    r = cur.fetchone()
    if r:
        cur.execute("UPDATE dbo.Clave_Acceso SET Codigo = ?, FechaCreacion = GETDATE() WHERE id_acceso = ?", codigo, r[0])
    else:
        id_a = next(_contador(cur, "Clave_Acceso", "id_acceso"))
        cur.execute("INSERT INTO dbo.Clave_Acceso (id_acceso, id_clase, Codigo) VALUES (?, ?, ?)", id_a, id_clase, codigo)
    return buscar_codigo(cur, codigo) | {"creado": datetime.now().strftime("%d/%m/%Y")}


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
            "fecha": f"{f.day}/{f.month}/{f.year}", "carrera": r.NomCarrera, "cuatrimestre": str(int(r.Cuatrimestre)),
            "grupo": r.ClaveGrupo, "profesor": _nombre(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno),
            "materia": r.NomAsignatura, "calificaciones": [], "comentario": r.Comentario or ""}
    cur.execute("""SELECT p.id_encuesta, r.Calificacion FROM dbo.Pregunta p
                   JOIN dbo.Respuesta r ON r.id_pregunta = p.id_pregunta
                   ORDER BY p.id_encuesta, p.NumPregunta""")
    for id_e, cal in cur.fetchall():
        if id_e in evals:
            evals[id_e]["calificaciones"].append(int(cal))
    for e in evals.values():
        c = e["calificaciones"]
        e["promedio"] = round(sum(c) / len(c), 1) if c else 0
    return list(evals.values())


def guardar_evaluacion(cur, e, textos_preguntas):
    grupo, materia, profesor = e.get("grupo"), e.get("materia"), e.get("profesor")
    califs = e.get("calificaciones")
    if not (grupo and materia and profesor) or not isinstance(califs, list) or not califs:
        raise ErrorDatos("Evaluación incompleta.")
    try:
        califs = [int(c) for c in califs]
    except (TypeError, ValueError):
        raise ErrorDatos("Calificaciones inválidas.")
    if any(not 5 <= c <= 10 for c in califs):
        raise ErrorDatos("Las calificaciones deben ir del 5 al 10.")

    id_clase = _clase_de(cur, grupo, materia, profesor)
    if not id_clase:
        raise ErrorDatos("No se encontró la clase que se está evaluando.", 404)

    # la encuesta cuelga de una Clave_Acceso; si la clase no tiene ninguna se crea una sin código
    cur.execute("SELECT TOP 1 id_acceso FROM dbo.Clave_Acceso WHERE id_clase = ? ORDER BY id_acceso", id_clase)
    r = cur.fetchone()
    if r:
        id_acceso = r[0]
    else:
        id_acceso = next(_contador(cur, "Clave_Acceso", "id_acceso"))
        cur.execute("INSERT INTO dbo.Clave_Acceso (id_acceso, id_clase) VALUES (?, ?)", id_acceso, id_clase)

    id_enc = next(_contador(cur, "Encuesta", "id_encuesta"))
    comentario = str(e.get("comentario") or "").strip()[:500] or None
    cur.execute("INSERT INTO dbo.Encuesta (id_encuesta, Comentario, id_acceso) VALUES (?, ?, ?)",
                id_enc, comentario, id_acceso)

    ids_p = _contador(cur, "Pregunta", "id_pregunta")
    ids_r = _contador(cur, "Respuesta", "id_respuesta")
    for i, cal in enumerate(califs, 1):
        texto = textos_preguntas[i - 1] if i - 1 < len(textos_preguntas) else f"Pregunta {i}"
        id_p = next(ids_p)
        cur.execute("INSERT INTO dbo.Pregunta (id_pregunta, NumPregunta, Texto, Activa, id_encuesta) "
                    "VALUES (?, ?, ?, 1, ?)", id_p, i, str(texto)[:500], id_enc)
        cur.execute("INSERT INTO dbo.Respuesta (id_respuesta, Calificacion, id_pregunta) VALUES (?, ?, ?)",
                    next(ids_r), cal, id_p)
    cur.execute("UPDATE dbo.Grupo SET participaciones = participaciones + 1 WHERE ClaveGrupo = ?", grupo)