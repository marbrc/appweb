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
def _normalizar_asignaturas(cur):
    """Deja una sola fila ACTIVA por nombre de asignatura.
    Las filas repetidas venían del mapa curricular (la misma materia por cada grupo); se fusionan:
    las clases, los enlaces docente-materia y el plan se pasan a la fila que se queda, y las repetidas
    solo se desactivan (no se borra nada, se conserva el historial)."""
    cur.execute("""SELECT NomAsignatura, MIN(id_asignatura)
                   FROM dbo.Asignatura
                   WHERE ISNULL(activo, 1) = 1
                   GROUP BY NomAsignatura
                   HAVING COUNT(*) > 1""")
    for nombre, queda in cur.fetchall():
        cur.execute("""SELECT id_asignatura FROM dbo.Asignatura
                       WHERE NomAsignatura = ? AND id_asignatura <> ? AND ISNULL(activo, 1) = 1""",
                    nombre, queda)
        for (repe,) in cur.fetchall():
            # clases: se pasan a la fila que se queda; si el grupo ya tenía ACTIVA esa materia, la repetida se desactiva
            cur.execute("""UPDATE cl SET cl.id_asignatura = ?
                           FROM dbo.Clase cl
                           WHERE cl.id_asignatura = ?
                             AND NOT EXISTS (SELECT 1 FROM dbo.Clase x
                                             WHERE x.id_grupo = cl.id_grupo
                                               AND x.id_asignatura = ?
                                               AND ISNULL(x.activo, 1) = 1)""", queda, repe, queda)
            cur.execute("UPDATE dbo.Clase SET activo = 0 WHERE id_asignatura = ?", repe)
            # enlaces docente-materia: se reactiva o crea el de la fila que se queda
            cur.execute("""INSERT INTO dbo.Docente_Grupo (id_asignatura, id_docente, activo)
                           SELECT ?, dg.id_docente, 1 FROM dbo.Docente_Grupo dg
                           WHERE dg.id_asignatura = ?
                             AND NOT EXISTS (SELECT 1 FROM dbo.Docente_Grupo x
                                             WHERE x.id_asignatura = ? AND x.id_docente = dg.id_docente)""",
                        queda, repe, queda)
            cur.execute("""UPDATE dg SET dg.activo = 1
                           FROM dbo.Docente_Grupo dg
                           WHERE dg.id_asignatura = ?
                             AND EXISTS (SELECT 1 FROM dbo.Docente_Grupo o
                                         WHERE o.id_asignatura = ? AND o.id_docente = dg.id_docente
                                           AND ISNULL(o.activo, 1) = 1)""", queda, repe)
            cur.execute("UPDATE dbo.Docente_Grupo SET activo = 0 WHERE id_asignatura = ?", repe)
            # el plan de estudios apunta a la fila que se queda
            cur.execute("""UPDATE p SET p.id_asignatura = ?
                           FROM dbo.Plan_Estudio p
                           WHERE p.id_asignatura = ?
                             AND NOT EXISTS (SELECT 1 FROM dbo.Plan_Estudio x
                                             WHERE x.id_carrera = p.id_carrera
                                               AND x.Cuatrimestre = p.Cuatrimestre
                                               AND x.id_asignatura = ?)""", queda, repe, queda)
            cur.execute("UPDATE dbo.Asignatura SET activo = 0 WHERE id_asignatura = ?", repe)


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
<<<<<<< HEAD
    # columnas de baja lógica: lo que se "elimina" solo se desactiva (activo = 0) para no perder historial.
    # se agregan solitas si la base ya existía sin ellas.
    cur.execute("IF COL_LENGTH('dbo.Carrera','activo') IS NULL "
                "ALTER TABLE dbo.Carrera ADD activo BIT NOT NULL CONSTRAINT DF_Carrera_activo DEFAULT (1)")
    cur.execute("IF COL_LENGTH('dbo.Grupo','activo') IS NULL "
                "ALTER TABLE dbo.Grupo ADD activo BIT NOT NULL CONSTRAINT DF_Grupo_activo DEFAULT (1)")
    cur.execute("IF COL_LENGTH('dbo.Clase','activo') IS NULL "
                "ALTER TABLE dbo.Clase ADD activo BIT NOT NULL CONSTRAINT DF_Clase_activo DEFAULT (1)")
    cur.execute("IF COL_LENGTH('dbo.Docente_Grupo','activo') IS NULL "
                "ALTER TABLE dbo.Docente_Grupo ADD activo BIT NOT NULL "
                "CONSTRAINT DF_DocenteGrupo_activo DEFAULT (1)")
    # por si alguien creo la tabla Clave_Acceso a mano sin las columnas del codigo
    cur.execute("IF COL_LENGTH('dbo.Clave_Acceso','Codigo') IS NULL "
                "ALTER TABLE dbo.Clave_Acceso ADD Codigo varchar(6) NULL")
    cur.execute("IF COL_LENGTH('dbo.Clave_Acceso','FechaCreacion') IS NULL "
                "ALTER TABLE dbo.Clave_Acceso ADD FechaCreacion datetime NOT NULL "
                "CONSTRAINT DF_ClaveAcceso_Fecha DEFAULT (GETDATE())")
    # el código ya no se revoca borrándolo: se queda guardado y solo se desactiva
    cur.execute("IF COL_LENGTH('dbo.Clave_Acceso','activo') IS NULL "
                "ALTER TABLE dbo.Clave_Acceso ADD activo BIT NOT NULL "
                "CONSTRAINT DF_ClaveAcceso_activo DEFAULT (1)")
    cur.execute("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UQ_ClaveAcceso_Codigo' "
                "AND object_id=OBJECT_ID('dbo.Clave_Acceso')) "
                "EXEC('CREATE UNIQUE INDEX UQ_ClaveAcceso_Codigo ON dbo.Clave_Acceso (Codigo) "
                "WHERE Codigo IS NOT NULL')")
=======
    cur.execute("SELECT COL_LENGTH('dbo.Asignatura','id_carrera'), COL_LENGTH('dbo.Grupo','participaciones')")
    if any(v is not None for v in cur.fetchone()):
        raise ErrorDatos("La tabla Asignatura o Grupo todavía tiene columnas viejas. Vuelve a ejecutar "
                         "DB_EncuestaDocente.sql y después INSERCION_DE_DATOS_REALES.sql", 500)
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36

    # Plan_Estudio: qué materias tocan en cada carrera y cuatrimestre (Asignatura ya solo guarda el nombre)
    cur.execute("IF OBJECT_ID('dbo.Plan_Estudio') IS NULL "
                "CREATE TABLE dbo.Plan_Estudio("
                "id_plan int NOT NULL CONSTRAINT PK_Plan_Estudio PRIMARY KEY, "
                "id_carrera int NOT NULL, "
                "Cuatrimestre tinyint NOT NULL "
                "CONSTRAINT CK_Plan_Cuatrimestre CHECK (Cuatrimestre BETWEEN 1 AND 11), "
                "id_asignatura int NOT NULL, "
                "CONSTRAINT FK_Plan_Carrera FOREIGN KEY (id_carrera) REFERENCES dbo.Carrera(id_carrera), "
                "CONSTRAINT FK_Plan_Asignatura FOREIGN KEY (id_asignatura) REFERENCES dbo.Asignatura(id_asignatura), "
                "CONSTRAINT UQ_Plan_Estudio UNIQUE (id_carrera, Cuatrimestre, id_asignatura))")

    # longitudes: el comentario del alumno es de 300 y el texto de la pregunta de 250, igual que en la pantalla
    cur.execute("UPDATE dbo.Encuesta SET Comentario = LEFT(Comentario, 300) WHERE LEN(Comentario) > 300")
    cur.execute("IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Encuesta') "
                "AND name = 'Comentario' AND max_length <> 300) "
                "ALTER TABLE dbo.Encuesta ALTER COLUMN Comentario varchar(300) NULL")
    cur.execute("UPDATE dbo.Pregunta SET Texto = LEFT(Texto, 250) WHERE LEN(Texto) > 250")
    cur.execute("IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Pregunta') "
                "AND name = 'Texto' AND max_length <> 250) "
                "ALTER TABLE dbo.Pregunta ALTER COLUMN Texto varchar(250) NOT NULL")

    # Grupo: el contador de participaciones ya no se guarda, se calcula contando las encuestas de sus clases
    cur.execute("""IF COL_LENGTH('dbo.Grupo', 'participaciones') IS NOT NULL
                   BEGIN
                       DECLARE @df sysname;
                       SELECT @df = dc.name
                       FROM sys.default_constraints dc
                       JOIN sys.columns c ON c.object_id = dc.parent_object_id
                                          AND c.column_id = dc.parent_column_id
                       WHERE dc.parent_object_id = OBJECT_ID('dbo.Grupo')
                         AND c.name = 'participaciones';
                       IF @df IS NOT NULL EXEC('ALTER TABLE dbo.Grupo DROP CONSTRAINT ' + @df);
                       ALTER TABLE dbo.Grupo DROP COLUMN participaciones;
                   END""")
    # la cantidad de alumnos ahora acepta 0 (falta capturar) hasta 100; la pantalla sigue pidiendo mínimo 1
    cur.execute("SELECT definition FROM sys.check_constraints WHERE name = 'CK_Grupo_CantidadAlumnos'")
    r = cur.fetchone()
    if not r or "100" not in str(r[0]):
        if r:
            cur.execute("ALTER TABLE dbo.Grupo DROP CONSTRAINT CK_Grupo_CantidadAlumnos")
        cur.execute("UPDATE dbo.Grupo SET CantidadAlumnos = 100 WHERE CantidadAlumnos > 100")
        cur.execute("ALTER TABLE dbo.Grupo ADD CONSTRAINT CK_Grupo_CantidadAlumnos "
                    "CHECK (CantidadAlumnos BETWEEN 0 AND 100)")

    # Clase: una materia solo puede tener un docente por grupo (los duplicados viejos se desactivan)
    cur.execute("""UPDATE cl SET cl.activo = 0
                   FROM dbo.Clase cl
                   WHERE ISNULL(cl.activo, 1) = 1
                     AND EXISTS (SELECT 1 FROM dbo.Clase x
                                 WHERE x.id_grupo = cl.id_grupo
                                   AND x.id_asignatura = cl.id_asignatura
                                   AND ISNULL(x.activo, 1) = 1
                                   AND x.id_clase < cl.id_clase)""")
    cur.execute("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UQ_Clase_Grupo_Asignatura' "
                "AND object_id=OBJECT_ID('dbo.Clase')) "
                "EXEC('CREATE UNIQUE INDEX UQ_Clase_Grupo_Asignatura ON dbo.Clase (id_grupo, id_asignatura) "
                "WHERE activo = 1')")

    # Asignatura: un solo registro activo por nombre (antes se repetía por cada grupo del mapa curricular)
    _normalizar_asignaturas(cur)
    cur.execute("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='UQ_Asignatura_NombreActivo' "
                "AND object_id=OBJECT_ID('dbo.Asignatura')) "
                "EXEC('CREATE UNIQUE INDEX UQ_Asignatura_NombreActivo ON dbo.Asignatura (NomAsignatura) "
                "WHERE activo = 1')")

    # si el plan está vacío (base vieja), se arma con las materias activas de cada carrera/cuatrimestre que tiene grupos
    cur.execute("""IF NOT EXISTS (SELECT 1 FROM dbo.Plan_Estudio)
                   INSERT INTO dbo.Plan_Estudio (id_plan, id_carrera, Cuatrimestre, id_asignatura)
                   SELECT ROW_NUMBER() OVER (ORDER BY g.id_carrera, g.Cuatrimestre, a.id_asignatura),
                          g.id_carrera, g.Cuatrimestre, a.id_asignatura
                   FROM (SELECT DISTINCT id_carrera, Cuatrimestre FROM dbo.Grupo
                         WHERE ISNULL(activo, 1) = 1) g
                   CROSS JOIN dbo.Asignatura a
                   WHERE ISNULL(a.activo, 1) = 1""")


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
    cur.execute("SELECT NomCarrera FROM dbo.Carrera WHERE ISNULL(activo, 1) = 1 ORDER BY id_carrera")
    return [r[0] for r in cur.fetchall()]


def sync_carreras(cur, lista):
    nuevos = {}
    for n in lista:
        n = _texto(n, 60, "el nombre de la carrera")
        nuevos[n] = n
    # se traen TODAS (activas e inactivas) para poder reactivar una que se había eliminado
    cur.execute("SELECT NomCarrera, id_carrera FROM dbo.Carrera")
    act = {r[0]: r[1] for r in cur.fetchall()}
    comunes, renombres, crear, borrar = _diff(act, nuevos)
    for viejo, nuevo in renombres:
        cur.execute("UPDATE dbo.Carrera SET NomCarrera = ?, activo = 1 WHERE id_carrera = ?", nuevo, act[viejo])
    for n in comunes:
        cur.execute("UPDATE dbo.Carrera SET activo = 1 WHERE id_carrera = ?", act[n])
    ids = _contador(cur, "Carrera", "id_carrera")
    for n in crear:
        cur.execute("INSERT INTO dbo.Carrera (id_carrera, NomCarrera, activo) VALUES (?, ?, 1)", next(ids), n)
    for n in borrar:
        # baja lógica: la carrera no se borra, se desactiva; sus grupos también se desactivan
        cur.execute("UPDATE dbo.Carrera SET activo = 0 WHERE id_carrera = ?", act[n])
        cur.execute("UPDATE dbo.Grupo SET activo = 0 WHERE id_carrera = ?", act[n])


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
                   WHERE ISNULL(g.activo, 1) = 1 AND ISNULL(c.activo, 1) = 1
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
<<<<<<< HEAD
            raise ErrorDatos(f"Los alumnos del grupo {clave} deben ser de 0 a 100.")
=======
            raise ErrorDatos(f"Los alumnos del grupo {clave} deben estar entre 0 y 100.")
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
        nuevos[clave] = {"carrera": _carrera_id(cur, it.get("carrera")), "cuatri": cuatri, "alumnos": alumnos}

    cur.execute("SELECT ClaveGrupo, id_grupo FROM dbo.Grupo")
    act = {r[0]: r[1] for r in cur.fetchall()}
    comunes, renombres, crear, borrar = _diff(act, nuevos)

    def actualizar(id_g, clave, d):
        cur.execute("UPDATE dbo.Grupo SET ClaveGrupo=?, Cuatrimestre=?, CantidadAlumnos=?, id_carrera=?, activo=1 "
                    "WHERE id_grupo=?", clave, d["cuatri"], d["alumnos"], d["carrera"], id_g)

    for k in comunes:
        actualizar(act[k], k, nuevos[k])
    for viejo, nuevo in renombres:
        actualizar(act[viejo], nuevo, nuevos[nuevo])

    ids = _contador(cur, "Grupo", "id_grupo")
    for clave in crear:
        d, id_g = nuevos[clave], next(ids)
<<<<<<< HEAD
        cur.execute("INSERT INTO dbo.Grupo (id_grupo, ClaveGrupo, Cuatrimestre, CantidadAlumnos, id_carrera, activo) "
                    "VALUES (?, ?, ?, ?, ?, 1)", id_g, clave, d["cuatri"], d["alumnos"], d["carrera"])

    for clave in borrar:
        # baja lógica: el grupo y sus asignaciones de Carga Académica quedan desactivados
        id_g = act[clave]
        cur.execute("UPDATE dbo.Grupo SET activo = 0 WHERE id_grupo = ?", id_g)
        cur.execute("UPDATE dbo.Clase SET activo = 0 WHERE id_grupo = ?", id_g)
        # sus códigos de acceso dejan de servir
        cur.execute("UPDATE dbo.Clave_Acceso SET Codigo = NULL WHERE id_clase IN "
                    "(SELECT id_clase FROM dbo.Clase WHERE id_grupo = ?)", id_g)
=======
        cur.execute("INSERT INTO dbo.Grupo (id_grupo, ClaveGrupo, Cuatrimestre, CantidadAlumnos, id_carrera) "
                    "VALUES (?, ?, ?, ?, ?)", id_g, clave, d["cuatri"], d["alumnos"], d["carrera"])

    for clave in borrar:
        cur.execute("DELETE FROM dbo.Grupo WHERE id_grupo = ?", act[clave])   # si tiene clases -> 409
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36


# ---------------------------------------------------------------- DOCENTES
def leer_docentes(cur):
    cur.execute("""SELECT dg.id_docente, a.NomAsignatura
                   FROM dbo.Docente_Grupo dg JOIN dbo.Asignatura a ON a.id_asignatura = dg.id_asignatura
                   WHERE ISNULL(a.activo, 1) = 1 AND ISNULL(dg.activo, 1) = 1
                   ORDER BY a.NomAsignatura""")
    mats = {}
    for id_d, nom in cur.fetchall():
        mats.setdefault(id_d, [])
        if nom not in mats[id_d]:
            mats[id_d].append(nom)
    cur.execute("SELECT id_docente, NomDocente, ApellidoPaterno, ApellidoMaterno, Correo "
                "FROM dbo.Docente WHERE Estatus = 1 ORDER BY id_docente")
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
<<<<<<< HEAD
    if correo:
        if len(correo) > 100:
            raise ErrorDatos("El correo no puede pasar de 100 caracteres.")
        # las mismas reglas que la pantalla: Gmail, UTNG u Outlook
        if not re.fullmatch(r"[a-z0-9._%+\-]+@(gmail\.com|utng\.edu\.mx|outlook\.com)", correo):
            raise ErrorDatos("El correo del docente debe ser de Gmail, UTNG o Outlook.")
=======
    if correo and (len(correo) > 100 or not CORREO_DOCENTE.fullmatch(correo)):
        raise ErrorDatos("Solo se permiten correos Gmail, UTNG u Outlook.")
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
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
                   JOIN dbo.Asignatura a ON a.id_asignatura = dg.id_asignatura
                   WHERE ISNULL(dg.activo, 1) = 1""")
    actuales_m = {}
    for id_d, nom in cur.fetchall():
        actuales_m.setdefault(id_d, set()).add(nom)

    def poner_materias(id_d, d):
        if d["materias"] is None or set(d["materias"]) == actuales_m.get(id_d, set()):
            return
        # nada se borra: las materias que el docente deja de dar solo se desactivan
        cur.execute("UPDATE dbo.Docente_Grupo SET activo = 0 WHERE id_docente = ?", id_d)
        for m in d["materias"]:
            # si el enlace ya existía, se vuelve a activar (una sola fila por materia)
            cur.execute("UPDATE dg SET dg.activo = 1 FROM dbo.Docente_Grupo dg "
                        "JOIN dbo.Asignatura a ON a.id_asignatura = dg.id_asignatura "
                        "WHERE dg.id_docente = ? AND a.NomAsignatura = ? AND a.activo = 1", id_d, m)
            # si la materia es nueva para él, se crea el enlace (la asignatura activa con menor id)
            cur.execute("INSERT INTO dbo.Docente_Grupo (id_asignatura, id_docente, activo) "
                        "SELECT MIN(a.id_asignatura), ?, 1 FROM dbo.Asignatura a "
                        "WHERE a.NomAsignatura = ? AND a.activo = 1 "
                        "AND NOT EXISTS (SELECT 1 FROM dbo.Docente_Grupo dg "
                        "                WHERE dg.id_docente = ? AND dg.id_asignatura = a.id_asignatura) "
                        "HAVING COUNT(*) > 0", id_d, m, id_d)

    for viejo, nuevo in pares:
        id_d, d = act[viejo], nuevos[nuevo]
        # si estaba desactivado y vuelve a la lista, se reactiva
        cur.execute("UPDATE dbo.Docente SET NomDocente=?, ApellidoPaterno=?, ApellidoMaterno=?, Correo=?, Estatus=1 "
                    "WHERE id_docente=?", d["nombres"], d["paterno"], d["materno"], d["correo"], id_d)
        poner_materias(id_d, d)

    ids = _contador(cur, "Docente", "id_docente")
    for k in crear:
        d, id_d = nuevos[k], next(ids)
        cur.execute("INSERT INTO dbo.Docente (id_docente, NomDocente, ApellidoPaterno, ApellidoMaterno, Estatus, Correo) "
                    "VALUES (?, ?, ?, ?, 1, ?)", id_d, d["nombres"], d["paterno"], d["materno"], d["correo"])
        poner_materias(id_d, d)

    for k in borrar:
        # baja lógica: el docente no se borra, se desactiva; sus asignaciones también
        id_d = act[k]
        cur.execute("UPDATE dbo.Docente SET Estatus = 0 WHERE id_docente = ?", id_d)
        cur.execute("UPDATE dbo.Clase SET activo = 0 WHERE id_docente = ?", id_d)
        cur.execute("UPDATE dbo.Clave_Acceso SET Codigo = NULL WHERE id_clase IN "
                    "(SELECT id_clase FROM dbo.Clase WHERE id_docente = ?)", id_d)


# ---------------------------------------------------------------- ASIGNATURAS
<<<<<<< HEAD
# Catálogo de asignaturas: SOLO el nombre (uno por materia). Qué carrera y cuatrimestre la llevan
# vive en Plan_Estudio. El borrado sigue siendo lógico (activo = 0).
def leer_asignaturas(cur):
    cur.execute("""SELECT MIN(a.id_asignatura) AS id_asignatura, a.NomAsignatura,
                          c.NomCarrera, p.Cuatrimestre
                   FROM dbo.Asignatura a
                   LEFT JOIN dbo.Plan_Estudio p ON p.id_asignatura = a.id_asignatura
                   LEFT JOIN dbo.Carrera c ON c.id_carrera = p.id_carrera
                   WHERE ISNULL(a.activo, 1) = 1
                   GROUP BY a.NomAsignatura, c.NomCarrera, p.Cuatrimestre
                   ORDER BY a.NomAsignatura, c.NomCarrera, p.Cuatrimestre""")
    out = {}
    for r in cur.fetchall():
        d = out.setdefault(r.NomAsignatura, {"id": r.id_asignatura, "nombre": r.NomAsignatura, "planes": []})
        d["id"] = min(d["id"], r.id_asignatura)
        if r.NomCarrera:
            nuevo = {"carrera": r.NomCarrera, "cuatrimestre": int(r.Cuatrimestre)}
            if nuevo not in d["planes"]:
                d["planes"].append(nuevo)
    return list(out.values())


def sync_asignaturas(cur, lista):
    nuevos = {" ".join(str(it.get("nombre") or "").split()) for it in lista}
    nuevos.discard("")
    for nom in nuevos:
        _texto(nom, 60, "el nombre de la asignatura")

    cur.execute("SELECT DISTINCT NomAsignatura FROM dbo.Asignatura WHERE ISNULL(activo, 1) = 1")
    actuales = {r[0] for r in cur.fetchall()}
    quitar = actuales - nuevos
    poner = nuevos - actuales

    # si cambió exactamente un nombre se toma como EDICIÓN: se conserva la misma fila
    # para no perder sus clases, sus docentes ni las materias del plan de estudios
    if len(quitar) == 1 and len(poner) == 1:
        viejo, nuevo = next(iter(quitar)), next(iter(poner))
        cur.execute("UPDATE dbo.Asignatura SET NomAsignatura = ? "
                    "WHERE id_asignatura = (SELECT MIN(id_asignatura) FROM dbo.Asignatura "
                    "WHERE NomAsignatura = ? AND ISNULL(activo, 1) = 1)", nuevo, viejo)
        return []

    # borrado lógico: desactiva TODAS las filas con ese nombre y las asignaciones que usan esa materia
    for nom in quitar:
        cur.execute("UPDATE dbo.Asignatura SET activo = 0 WHERE NomAsignatura = ?", nom)
        cur.execute("UPDATE dbo.Clase SET activo = 0 WHERE id_asignatura IN "
                    "(SELECT id_asignatura FROM dbo.Asignatura WHERE NomAsignatura = ?)", nom)
        cur.execute("UPDATE dbo.Clave_Acceso SET Codigo = NULL WHERE id_clase IN "
                    "(SELECT cl.id_clase FROM dbo.Clase cl "
                    " JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura "
                    " WHERE a.NomAsignatura = ?)", nom)

    # crear o reactivar (solo una fila activa por nombre)
    ids = _contador(cur, "Asignatura", "id_asignatura")
    for nom in poner:
        cur.execute("SELECT MIN(id_asignatura) FROM dbo.Asignatura WHERE NomAsignatura = ?", nom)
        r = cur.fetchone()
        if r and r[0] is not None:
            cur.execute("UPDATE dbo.Asignatura SET activo = 1 WHERE id_asignatura = ?", r[0])
        else:
            cur.execute("INSERT INTO dbo.Asignatura (id_asignatura, NomAsignatura, activo) VALUES (?, ?, 1)",
                        next(ids), nom)
    return []


# ---------------------------------------------------------------- PLAN DE ESTUDIOS
# qué materias tocan en cada carrera + cuatrimestre. Así Carga Académica arma la lista sola
# y una materia no se duplica por cada grupo.
def leer_plan(cur):
    cur.execute("""SELECT p.id_plan, c.NomCarrera, p.Cuatrimestre, a.NomAsignatura
                   FROM dbo.Plan_Estudio p
                   JOIN dbo.Carrera c ON c.id_carrera = p.id_carrera
                   JOIN dbo.Asignatura a ON a.id_asignatura = p.id_asignatura
                   WHERE ISNULL(c.activo, 1) = 1 AND ISNULL(a.activo, 1) = 1
                   ORDER BY c.NomCarrera, p.Cuatrimestre, a.NomAsignatura""")
    return [{"id": r.id_plan, "carrera": r.NomCarrera,
             "cuatrimestre": int(r.Cuatrimestre), "materia": r.NomAsignatura}
            for r in cur.fetchall()]


def _asegurar_plan(cur, id_carrera, cuatri, id_asignatura):
    """si la materia no estaba en el plan de esa carrera/cuatrimestre, se agrega solita"""
    cur.execute("SELECT 1 FROM dbo.Plan_Estudio "
                "WHERE id_carrera = ? AND Cuatrimestre = ? AND id_asignatura = ?",
                id_carrera, cuatri, id_asignatura)
    if not cur.fetchone():
        id_p = next(_contador(cur, "Plan_Estudio", "id_plan"))
        cur.execute("INSERT INTO dbo.Plan_Estudio (id_plan, id_carrera, Cuatrimestre, id_asignatura) "
                    "VALUES (?, ?, ?, ?)", id_p, id_carrera, cuatri, id_asignatura)


def _id_asignatura(cur, nombre):
    cur.execute("SELECT MIN(id_asignatura) FROM dbo.Asignatura "
                "WHERE NomAsignatura = ? AND ISNULL(activo, 1) = 1", nombre)
    r = cur.fetchone()
    return r[0] if r else None
=======
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
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36


# ---------------------------------------------------------------- CLASES (Carga Académica)
def leer_clases(cur):
    cur.execute("""SELECT cl.id_clase, g.ClaveGrupo, a.NomAsignatura,
                          d.NomDocente, d.ApellidoPaterno, d.ApellidoMaterno, d.Correo
                   FROM dbo.Clase cl
                   JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                   JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura
                   JOIN dbo.Docente d ON d.id_docente = cl.id_docente
                   WHERE ISNULL(cl.activo, 1) = 1 AND ISNULL(g.activo, 1) = 1 AND d.Estatus = 1
                     AND ISNULL(a.activo, 1) = 1
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
    cur.execute("SELECT id_grupo, ClaveGrupo, id_carrera, Cuatrimestre FROM dbo.Grupo "
                "WHERE ISNULL(activo, 1) = 1")
    grupos = {r.ClaveGrupo: (r.id_grupo, r.id_carrera, int(r.Cuatrimestre)) for r in cur.fetchall()}

    cur.execute("""SELECT cl.id_clase, g.ClaveGrupo, a.NomAsignatura, cl.id_docente
                   FROM dbo.Clase cl JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                   JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura""")
    act = {(r.ClaveGrupo, r.NomAsignatura): (r.id_clase, r.id_docente) for r in cur.fetchall()}
    nuevos = {}
    for it in lista:
        nuevos[(str(it.get("grupoId") or ""), str(it.get("asignaturaId") or ""))] = str(it.get("docenteId") or "")

    ids = _contador(cur, "Clase", "id_clase")
    for (grupo, asig), doc in nuevos.items():
        if grupo not in grupos:
            raise ErrorDatos(f"El grupo «{grupo}» no existe o está desactivado.")
        id_grupo, id_carrera, cuatri = grupos[grupo]
        id_doc = docentes.get(doc)
        if not id_doc:
            raise ErrorDatos(f"El docente «{doc}» no existe en la base de datos.")
<<<<<<< HEAD
        id_asig = _id_asignatura(cur, asig)
        if not id_asig:
            raise ErrorDatos(f"La asignatura «{asig}» no existe o está desactivada.")
        # si la materia no estaba en el plan, se agrega sola (así no se arma a mano ni se duplica)
        _asegurar_plan(cur, id_carrera, cuatri, id_asig)
        if (grupo, asig) in act:
            id_clase, id_actual = act[(grupo, asig)]
            # si estaba desactivada y vuelve a la lista, se reactiva
            cur.execute("UPDATE dbo.Clase SET activo = 1 WHERE id_clase = ?", id_clase)
            if id_doc != id_actual:
                cur.execute("UPDATE dbo.Clase SET id_docente = ? WHERE id_clase = ?", id_doc, id_clase)
            continue
        cur.execute("INSERT INTO dbo.Clase (id_clase, id_grupo, id_asignatura, id_docente, activo) "
                    "VALUES (?, ?, ?, ?, 1)", next(ids), id_grupo, id_asig, id_doc)
=======
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
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36

    for k, (id_clase, _) in act.items():
        if k not in nuevos:
            # baja lógica: la asignación no se borra (puede tener encuestas), solo se desactiva
            cur.execute("UPDATE dbo.Clase SET activo = 0 WHERE id_clase = ?", id_clase)
            # su código de acceso deja de servir
            cur.execute("UPDATE dbo.Clave_Acceso SET Codigo = NULL WHERE id_clase = ?", id_clase)


# ---------------------------------------------------------------- CÓDIGOS DE ACCESO
<<<<<<< HEAD
_SQL_CODIGOS = """SELECT k.id_acceso, k.Codigo, k.FechaCreacion, k.activo, g.ClaveGrupo, c.NomCarrera, g.Cuatrimestre,
                         a.NomAsignatura, d.NomDocente, d.ApellidoPaterno, d.ApellidoMaterno, d.Correo
=======
# Un codigo por clase. Se puede DESACTIVAR (el alumno ya no entra) y volver a ACTIVAR; Regenerar da uno nuevo.
_SQL_CODIGOS = """SELECT k.id_acceso, k.Codigo, k.Activo, k.FechaCreacion, g.ClaveGrupo, g.CantidadAlumnos,
                         c.NomCarrera, g.Cuatrimestre, a.NomAsignatura,
                         d.NomDocente, d.ApellidoPaterno, d.ApellidoMaterno, d.Correo,
                         (SELECT COUNT(*) FROM dbo.Encuesta e WHERE e.id_acceso = k.id_acceso) AS Contestaron
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
                  FROM dbo.Clave_Acceso k
                  JOIN dbo.Clase cl ON cl.id_clase = k.id_clase
                  JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                  JOIN dbo.Carrera c ON c.id_carrera = g.id_carrera
                  JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura
                  JOIN dbo.Docente d ON d.id_docente = cl.id_docente"""


def _fila_codigo(r):
<<<<<<< HEAD
    return {"codigo": r.Codigo, "activo": bool(r.activo), "grupo": r.ClaveGrupo, "carrera": r.NomCarrera,
=======
    return {"codigo": r.Codigo, "activo": bool(r.Activo), "grupo": r.ClaveGrupo, "carrera": r.NomCarrera,
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
            "cuatri": str(int(r.Cuatrimestre)),
            "docente": _clave_docente(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno, r.Correo),
            "docenteNombre": _nombre(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno),
            "materia": r.NomAsignatura, "creado": r.FechaCreacion.strftime("%d/%m/%Y"),
            # participacion de ESTA clase: cuantos ya contestaron con este codigo y de cuantos alumnos
            "contestaron": r.Contestaron, "alumnos": r.CantidadAlumnos}


def listar_codigos(cur):
<<<<<<< HEAD
    # solo los de clases/grupos/carreras/materias/docentes activos: son los que se ven en Códigos de acceso.
    # los desactivados SÍ se listan (con activo = 0) para poder volver a activarlos.
    cur.execute(_SQL_CODIGOS + " WHERE k.Codigo IS NOT NULL "
                               "AND ISNULL(cl.activo, 1) = 1 AND ISNULL(g.activo, 1) = 1 "
                               "AND ISNULL(c.activo, 1) = 1 AND ISNULL(a.activo, 1) = 1 AND d.Estatus = 1 "
                               "ORDER BY k.id_acceso")
=======
    cur.execute(_SQL_CODIGOS + " ORDER BY k.id_acceso")
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
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


<<<<<<< HEAD
def buscar_codigo_activo(cur, codigo):
    """igual que buscar_codigo, pero solo si el código y la clase, el grupo, la carrera, la asignatura
    y el docente siguen activos. Un código desactivado o de algo eliminado ya no sirve."""
    cur.execute(_SQL_CODIGOS + " WHERE k.Codigo = ? AND ISNULL(k.activo, 1) = 1 "
                               "AND ISNULL(cl.activo, 1) = 1 AND ISNULL(g.activo, 1) = 1 "
                               "AND ISNULL(c.activo, 1) = 1 AND ISNULL(a.activo, 1) = 1 AND d.Estatus = 1", codigo)
    r = cur.fetchone()
    if not r:
        return None
    d = _fila_codigo(r)
    d.pop("creado")
    return d


def revocar_codigo(cur, codigo):
    """desactiva el código. NO se borra: se queda guardado y se puede volver a activar."""
    cur.execute("UPDATE dbo.Clave_Acceso SET activo = 0 WHERE Codigo = ?", codigo)
=======
def cambiar_estado_codigo(cur, codigo, activo):
    """desactivar o volver a activar un codigo; la fila y el codigo se quedan igual"""
    cur.execute("UPDATE dbo.Clave_Acceso SET Activo = ? WHERE Codigo = ?", 1 if activo else 0, codigo)
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
    return cur.rowcount > 0


def cambiar_activo_codigo(cur, codigo, activo):
    """activo=True lo vuelve a prender, activo=False lo desactiva (el código se conserva)"""
    cur.execute("UPDATE dbo.Clave_Acceso SET activo = ? WHERE Codigo = ?", 1 if activo else 0, codigo)
    if cur.rowcount == 0:
        raise ErrorDatos("Código no válido.", 404)
    return buscar_codigo(cur, codigo)


def _clase_de(cur, grupo, materia, docente):
    cur.execute("""SELECT cl.id_clase, d.NomDocente, d.ApellidoPaterno, d.ApellidoMaterno, d.Correo
                   FROM dbo.Clase cl JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                   JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura
                   JOIN dbo.Docente d ON d.id_docente = cl.id_docente
                   WHERE g.ClaveGrupo = ? AND a.NomAsignatura = ?
                     AND ISNULL(cl.activo, 1) = 1 AND ISNULL(g.activo, 1) = 1
                     AND a.activo = 1 AND d.Estatus = 1""", grupo, materia)
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
<<<<<<< HEAD
        cur.execute("UPDATE dbo.Clave_Acceso SET Codigo = ?, FechaCreacion = GETDATE(), activo = 1 "
                    "WHERE id_acceso = ?", codigo, r[0])
    else:
        id_a = next(_contador(cur, "Clave_Acceso", "id_acceso"))
        cur.execute("INSERT INTO dbo.Clave_Acceso (id_acceso, id_clase, Codigo, activo) VALUES (?, ?, ?, 1)",
                    id_a, id_clase, codigo)
    return buscar_codigo(cur, codigo) | {"creado": datetime.now().strftime("%d/%m/%Y")}
=======
        cur.execute("UPDATE dbo.Clave_Acceso SET Codigo = ?, Activo = 1, FechaCreacion = GETDATE() WHERE id_acceso = ?",
                    codigo, r[0])
    else:
        id_a = next(_contador(cur, "Clave_Acceso", "id_acceso"))
        cur.execute("INSERT INTO dbo.Clave_Acceso (id_acceso, id_clase, Codigo, Activo) VALUES (?, ?, ?, 1)",
                    id_a, id_clase, codigo)
    cur.execute(_SQL_CODIGOS + " WHERE k.Codigo = ?", codigo)
    return _fila_codigo(cur.fetchone())
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36


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
    """una pregunta NUNCA se borra: se desactiva para no perder los reportes que ya la usan.
    regresa 'desactivada' para que el front avise qué pasó"""
    cur.execute("SELECT 1 FROM dbo.Pregunta WHERE id_pregunta = ?", id_p)
    if not cur.fetchone():
        raise ErrorDatos("Esa pregunta no existe.", 404)
    cur.execute("UPDATE dbo.Pregunta SET Activa = 0 WHERE id_pregunta = ?", id_p)
    _renumerar(cur)
    return "desactivada"


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
<<<<<<< HEAD
    cur.execute("""SELECT k.id_acceso, cl.id_clase, g.CantidadAlumnos
=======
    cur.execute("""SELECT k.id_acceso, cl.id_clase, g.id_grupo, g.CantidadAlumnos, k.Activo
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
                   FROM dbo.Clave_Acceso k JOIN dbo.Clase cl ON cl.id_clase = k.id_clase
                   JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                   JOIN dbo.Carrera c ON c.id_carrera = g.id_carrera
                   JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura
                   JOIN dbo.Docente d ON d.id_docente = cl.id_docente
                   WHERE k.Codigo = ? AND ISNULL(k.activo, 1) = 1
                     AND ISNULL(cl.activo, 1) = 1 AND ISNULL(g.activo, 1) = 1
                     AND ISNULL(c.activo, 1) = 1 AND a.activo = 1 AND d.Estatus = 1""", codigo)
    r = cur.fetchone()
    if not r:
        raise ErrorDatos("El código ya no es válido. Pídele uno nuevo a tu profesor.", 404)
<<<<<<< HEAD
    id_acceso, id_clase, alumnos = r
=======
    id_acceso, id_clase, id_grupo, alumnos, activo = r
    if not activo:
        raise ErrorDatos("Este código está desactivado. Pídele a tu profesor que lo active.", 403)
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36

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
<<<<<<< HEAD
=======
    # ya no se suma ningun contador: la participacion del grupo se calcula contando Encuesta (leer_grupos)
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
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


# ---------------------------------------------------------------- ADMINISTRADORES (lista y baja lógica)
# los administradores NUNCA se borran de la tabla: se desactivan (Estatus = 0),
# así las encuestas, opiniones y recuperaciones que hicieron siguen existiendo
def listar_admins(cur):
    cur.execute(_SQL_ADMIN + " ORDER BY id_admin")
    lista = []
    for r in cur.fetchall():
        d = _fila_admin(r)
        d["activo"] = bool(r.Estatus)
        lista.append(d)
    return lista


def cambiar_estatus_admin(cur, id_admin, activo, actor=None):
    """activo=True reactiva la cuenta, activo=False la desactiva (no la borra)"""
    cur.execute("SELECT Estatus, NomAdmin, ApellidoPaterno FROM dbo.Administrador WHERE id_admin = ?", id_admin)
    r = cur.fetchone()
    if not r:
        raise ErrorDatos("Ese administrador no existe.", 404)
    if not activo:
        if actor is not None and int(id_admin) == int(actor):
            raise ErrorDatos("No puedes desactivar tu propia cuenta.")
        # siempre tiene que quedar al menos un administrador activo para poder entrar
        cur.execute("SELECT COUNT(*) FROM dbo.Administrador WHERE Estatus = 1 AND id_admin <> ?", id_admin)
        if cur.fetchone()[0] == 0:
            raise ErrorDatos("Tiene que quedar al menos un administrador activo.")
    cur.execute("UPDATE dbo.Administrador SET Estatus = ? WHERE id_admin = ?", 1 if activo else 0, id_admin)


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


# ---------------------------------------------------------------- ELIMINADOS (papelera)
# todo lo que se "elimina" en el panel queda aquí: en la base no se borra, solo se desactiva
def leer_eliminados(cur):
    cur.execute("SELECT id_carrera, NomCarrera FROM dbo.Carrera "
                "WHERE ISNULL(activo, 1) = 0 ORDER BY NomCarrera")
    carreras = [{"id": r.id_carrera, "nombre": r.NomCarrera} for r in cur.fetchall()]

    cur.execute("""SELECT g.id_grupo, g.ClaveGrupo, c.NomCarrera, g.Cuatrimestre, g.CantidadAlumnos
                   FROM dbo.Grupo g JOIN dbo.Carrera c ON c.id_carrera = g.id_carrera
                   WHERE ISNULL(g.activo, 1) = 0 ORDER BY g.ClaveGrupo""")
    grupos = [{"id": r.id_grupo, "clave": r.ClaveGrupo, "carrera": r.NomCarrera,
               "cuatrimestre": int(r.Cuatrimestre), "alumnos": r.CantidadAlumnos}
              for r in cur.fetchall()]

    cur.execute("""SELECT id_docente, NomDocente, ApellidoPaterno, ApellidoMaterno, Correo
                   FROM dbo.Docente WHERE Estatus = 0 ORDER BY ApellidoPaterno, ApellidoMaterno""")
    docentes = [{"id": r.id_docente,
                 "nombre": _nombre(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno),
                 "correo": r.Correo or ""} for r in cur.fetchall()]

    cur.execute("""SELECT MIN(a.id_asignatura) AS id_asignatura, a.NomAsignatura
                   FROM dbo.Asignatura a
                   WHERE ISNULL(a.activo, 1) = 0
                     AND NOT EXISTS (SELECT 1 FROM dbo.Asignatura x
                                     WHERE x.NomAsignatura = a.NomAsignatura
                                       AND ISNULL(x.activo, 1) = 1)
                   GROUP BY a.NomAsignatura ORDER BY a.NomAsignatura""")
    asignaturas = [{"id": r.id_asignatura, "nombre": r.NomAsignatura} for r in cur.fetchall()]

    cur.execute("""SELECT cl.id_clase, g.ClaveGrupo, a.NomAsignatura,
                          d.NomDocente, d.ApellidoPaterno, d.ApellidoMaterno
                   FROM dbo.Clase cl
                   JOIN dbo.Grupo g ON g.id_grupo = cl.id_grupo
                   JOIN dbo.Asignatura a ON a.id_asignatura = cl.id_asignatura
                   JOIN dbo.Docente d ON d.id_docente = cl.id_docente
                   WHERE ISNULL(cl.activo, 1) = 0 ORDER BY cl.id_clase""")
    clases = [{"id": r.id_clase, "grupo": r.ClaveGrupo, "materia": r.NomAsignatura,
               "docente": _nombre(r.NomDocente, r.ApellidoPaterno, r.ApellidoMaterno)}
              for r in cur.fetchall()]

    cur.execute("SELECT id_pregunta, NumPregunta, Texto FROM dbo.Pregunta "
                "WHERE Activa = 0 ORDER BY NumPregunta, id_pregunta")
    preguntas = [{"id": r.id_pregunta, "num": int(r.NumPregunta), "texto": r.Texto}
                 for r in cur.fetchall()]

    return {"carreras": carreras, "grupos": grupos, "docentes": docentes,
            "asignaturas": asignaturas, "clases": clases, "preguntas": preguntas}


def restaurar_eliminado(cur, tipo, id_):
    """vuelve a activar algo de la papelera (y lo necesario para que se pueda ver otra vez).
    como al desactivar también se desactivó lo que colgaba de eso, al restaurar se devuelve igual."""
    tipo = str(tipo or "").lower()
    if tipo == "carreras":
        cur.execute("SELECT 1 FROM dbo.Carrera WHERE id_carrera = ?", id_)
        if not cur.fetchone():
            raise ErrorDatos("Esa carrera no existe.", 404)
        cur.execute("UPDATE dbo.Carrera SET activo = 1 WHERE id_carrera = ?", id_)
        # sus grupos y las asignaciones de esos grupos vuelven con ella
        cur.execute("UPDATE dbo.Grupo SET activo = 1 WHERE id_carrera = ?", id_)
        cur.execute("UPDATE dbo.Clase SET activo = 1 WHERE id_grupo IN "
                    "(SELECT id_grupo FROM dbo.Grupo WHERE id_carrera = ?)", id_)
    elif tipo == "grupos":
        cur.execute("SELECT id_carrera FROM dbo.Grupo WHERE id_grupo = ?", id_)
        r = cur.fetchone()
        if not r:
            raise ErrorDatos("Ese grupo no existe.", 404)
        cur.execute("UPDATE dbo.Grupo SET activo = 1 WHERE id_grupo = ?", id_)
        cur.execute("UPDATE dbo.Carrera SET activo = 1 WHERE id_carrera = ?", r.id_carrera)
        cur.execute("UPDATE dbo.Clase SET activo = 1 WHERE id_grupo = ?", id_)
    elif tipo == "docentes":
        cur.execute("SELECT 1 FROM dbo.Docente WHERE id_docente = ?", id_)
        if not cur.fetchone():
            raise ErrorDatos("Ese docente no existe.", 404)
        cur.execute("UPDATE dbo.Docente SET Estatus = 1 WHERE id_docente = ?", id_)
        cur.execute("UPDATE dbo.Clase SET activo = 1 WHERE id_docente = ?", id_)
    elif tipo == "asignaturas":
        cur.execute("SELECT NomAsignatura FROM dbo.Asignatura WHERE id_asignatura = ?", id_)
        r = cur.fetchone()
        if not r:
            raise ErrorDatos("Esa asignatura no existe.", 404)
        # solo se reactiva una fila (la de menor id); las copias viejas siguen desactivadas
        cur.execute("UPDATE dbo.Asignatura SET activo = 1 WHERE id_asignatura = "
                    "(SELECT MIN(id_asignatura) FROM dbo.Asignatura WHERE NomAsignatura = ?)", r.NomAsignatura)
        cur.execute("UPDATE dbo.Clase SET activo = 1 WHERE id_asignatura IN "
                    "(SELECT id_asignatura FROM dbo.Asignatura WHERE NomAsignatura = ?)", r.NomAsignatura)
    elif tipo == "clases":
        cur.execute("SELECT id_grupo FROM dbo.Clase WHERE id_clase = ?", id_)
        r = cur.fetchone()
        if not r:
            raise ErrorDatos("Esa asignación no existe.", 404)
        cur.execute("UPDATE dbo.Clase SET activo = 1 WHERE id_clase = ?", id_)
        # para que se vea, también se reactiva su grupo y su carrera
        cur.execute("UPDATE dbo.Grupo SET activo = 1 WHERE id_grupo = ?", r.id_grupo)
        cur.execute("UPDATE dbo.Carrera SET activo = 1 WHERE id_carrera = "
                    "(SELECT id_carrera FROM dbo.Grupo WHERE id_grupo = ?)", r.id_grupo)
    elif tipo == "preguntas":
        cur.execute("SELECT 1 FROM dbo.Pregunta WHERE id_pregunta = ?", id_)
        if not cur.fetchone():
            raise ErrorDatos("Esa pregunta no existe.", 404)
        cur.execute("UPDATE dbo.Pregunta SET Activa = 1 WHERE id_pregunta = ?", id_)
        _renumerar(cur)
    else:
        raise ErrorDatos("Tipo no válido.", 404)


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