# db.py  ->  conexión a SQL Server (DB_EncuestaDocente)
import os
from contextlib import contextmanager

import pyodbc

# Por defecto: Windows + SQL Server Express con Autenticación de Windows.
# El punto significa "esta misma computadora", así le sirve a todo el equipo.
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