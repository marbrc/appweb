# db.py  ->  conexión a SQL Server (DB_EncuestaDocente)
import os
from contextlib import contextmanager

import pyodbc

# Por defecto: Windows + SQL Server Express con Autenticación de Windows.
# El punto significa "esta misma computadora", así le sirve a todo el equipo.
<<<<<<< HEAD
=======
SERVIDOR = os.environ.get("DB_SERVER", r".\SQLEXPRESS")
BASE     = os.environ.get("DB_NAME", "DB_EncuestaDocente")

# Si DB_USER está vacío se usa Autenticación de Windows.
# En Linux, definan DB_USER y DB_PASSWORD como variables de entorno.
USUARIO  = os.environ.get("DB_USER", "")
CLAVE    = os.environ.get("DB_PASSWORD", "")


def _elegir_driver():
    """Usa DB_DRIVER si existe; si no, busca el ODBC Driver más nuevo instalado."""
    forzado = os.environ.get("DB_DRIVER")
    if forzado:
        return forzado
    instalados = [d for d in pyodbc.drivers() if "SQL Server" in d]
    # Prefiere "ODBC Driver 18/17 for SQL Server" sobre el viejo "SQL Server"
    instalados.sort(reverse=True)
    if not instalados:
        raise RuntimeError("No hay ningún driver ODBC de SQL Server instalado.")
    return instalados[0]
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36

# En Linux no se usa ".\SQLEXPRESS". Pon "localhost" o la IP del servidor.
# Si la instancia usa un puerto específico: "localhost,1433"
SERVIDOR = os.environ.get("DB_SERVER", "localhost")
BASE     = os.environ.get("DB_NAME", "DB_EncuestaDocente")

# En Linux se debe usar usuario y contraseña de SQL Server (Autenticación SQL)
USUARIO  = os.environ.get("DB_USER", "sa")
CLAVE    = os.environ.get("DB_PASSWORD", "M$100m#100")

# Driver instalado en tu sistema Linux (FreeTDS u ODBC Driver para SQL Server)
DRIVER   = os.environ.get("DB_DRIVER", "ODBC Driver 18 for SQL Server")

def cadena_conexion():
    c = (
        f"DRIVER={{{_elegir_driver()}}};"
        f"SERVER={SERVIDOR};DATABASE={BASE};"
        "TrustServerCertificate=yes;"
    )
    if USUARIO:
        c += f"UID={USUARIO};PWD={CLAVE};"
    else:
        c += "Trusted_Connection=yes;"
    return c

def conectar():
    return pyodbc.connect(cadena_conexion(), autocommit=False)


@contextmanager
def transaccion():
    """with transaccion() as cur:  -> si todo sale bien hace commit, si algo falla hace rollback"""
    con = conectar()
    try:
        cur = con.cursor()
        yield cur
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


if __name__ == "__main__":
    # prueba rápida:  python db.py
    with transaccion() as cur:
        cur.execute("SELECT DB_NAME(), (SELECT COUNT(*) FROM dbo.Docente)")
        print("Conectado a:", *cur.fetchone())