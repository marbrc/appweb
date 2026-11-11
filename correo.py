# correo.py  ->  manda el codigo para recuperar la contraseña
# Se usa Gmail. Para que funcione hay que poner aqui el correo que va a mandar los mensajes
# y una "contraseña de aplicación" de Google (NO es la contraseña normal de Gmail):
#   1. entra a myaccount.google.com > Seguridad > activa la verificación en dos pasos
#   2. busca "Contraseñas de aplicaciones", crea una que se llame Encuesta Docente
#   3. Google te da 16 letras, esas van en CLAVE (sin espacios)
# Si se dejan vacios NO truena: el codigo se imprime en la terminal donde corre flask (modo prueba).
import os
import smtplib
import ssl
from email.message import EmailMessage

SERVIDOR = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
PUERTO   = int(os.environ.get("MAIL_PORT", "587"))
USUARIO  = os.environ.get("MAIL_USER", "")        # ej. encuestadocente.utng@gmail.com
CLAVE    = os.environ.get("MAIL_PASSWORD", "")    # las 16 letras de la contraseña de aplicación


def configurado():
    return bool(USUARIO and CLAVE)


def mandar_codigo(destino, nombre, codigo, minutos):
    """regresa True si se mando por correo y False si se quedo en modo prueba (terminal)"""
    if not configurado():
        print("\n" + "=" * 52)
        print(f"  MODO PRUEBA (correo.py sin configurar)")
        print(f"  Código para {destino}:  {codigo}")
        print(f"  Sirve {minutos} minutos")
        print("=" * 52 + "\n", flush=True)
        return False

    msg = EmailMessage()
    msg["Subject"] = f"{codigo} es tu código para recuperar tu contraseña"
    msg["From"] = f"Encuesta Docente UTNG <{USUARIO}>"
    msg["To"] = destino
    msg.set_content(
        f"Hola {nombre}:\n\n"
        f"Tu código para cambiar la contraseña es: {codigo}\n"
        f"Sirve durante {minutos} minutos y solo se puede usar una vez.\n\n"
        "Si tú no lo pediste, ignora este correo, tu contraseña sigue igual.\n\n"
        "Encuesta Docente UTNG"
    )
    # la version bonita del correo, la mayoria de los correos muestran esta
    msg.add_alternative(f"""\
<div style="font-family:Segoe UI,Arial,sans-serif;max-width:460px;margin:auto;padding:24px;color:#1b2333">
  <p style="margin:0 0 18px;font-weight:700;color:#0b2a5b">Encuesta Docente UTNG</p>
  <p>Hola {nombre}:</p>
  <p>Usa este código para cambiar tu contraseña:</p>
  <p style="font-size:30px;font-weight:700;letter-spacing:8px;margin:18px 0;color:#1f5fd1">{codigo}</p>
  <p style="color:#5b6478;font-size:14px">Sirve durante {minutos} minutos y solo se puede usar una vez.
  Si tú no lo pediste, ignora este correo.</p>
</div>""", subtype="html")

    with smtplib.SMTP(SERVIDOR, PUERTO, timeout=15) as s:
        s.starttls(context=ssl.create_default_context())
        s.login(USUARIO, CLAVE)
        s.send_message(msg)
    return True
