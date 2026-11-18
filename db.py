# db.py  ->  conexión a SQL Server (DB_EncuestaDocente)
import os
from contextlib import contextmanager

import pyodbc

# El punto significa "esta misma computadora", así le sirve a todo el equipo.
import os
import pyodbc

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
    c = f"DRIVER={{{DRIVER}}};SERVER={SERVIDOR};DATABASE={BASE};TrustServerCertificate=yes;"
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