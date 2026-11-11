// cuenta.js, foto de perfil, datos, cambiar correo, cambiar contraseña y recuperar contraseña
// ANTES esto buscaba "usuarios" en localStorage y nunca encontraba tu cuenta, ahora todo va al servidor (tabla Administrador)
import { buscar, api, avisar, confirmar, cargando, ponerAvatar, ojitos, fuerza, REGLA_CLAVE, MSG_CLAVE } from "/static/js/nucleo/utiles.js";
import { obtenerSesion, actualizarSesion } from "/static/js/nucleo/datos.js";

export async function iniciar(cont) {
  let yo = obtenerSesion() || {};
  ojitos(cont);

  // pintar, pone todo lo de la izquierda y llena los formularios con lo que hay
  const fDatos = buscar("#form-datos", cont), fCorreo = buscar("#form-correo", cont);
  const fClave = buscar("#form-clave", cont), fRec = buscar("#form-recuperar", cont);
  function pintar() {
    ponerAvatar(buscar("#foto-grande", cont), yo);
    buscar("#nombre-cuenta", cont).textContent = yo.nombre || "";
    buscar("#correo-cuenta", cont).textContent = yo.correo || "";
    buscar("#d-registro", cont).textContent = yo.registro || "—";
    buscar("#d-acceso", cont).textContent = yo.ultimoAcceso || "Es tu primer acceso";
    buscar("#foto-quitar", cont).hidden = !yo.foto;
    fDatos.nombres.value = yo.nombres || "";
    fDatos.paterno.value = yo.paterno || "";
    fDatos.materno.value = yo.materno || "";
    fCorreo.correo.placeholder = yo.correo || "";
  }
  // guardar, lo que regresa el servidor se queda en la sesion y la barra de arriba se actualiza sola
  const guardar = u => { yo = { ...yo, ...u }; actualizarSesion(yo); pintar(); };

  pintar();
  try { guardar(await api("/api/yo")); } catch { /* se queda con lo que habia */ }

  // enviar, para no repetir lo mismo en cada formulario (ruedita en el boton y aviso)
  async function enviar(form, fn) {
    const btn = form.querySelector(".btn");
    cargando(btn, true);
    try { await fn(); } catch (e) { avisar(e.message, "err"); }
    cargando(btn, false);
  }

  // ---------- FOTO ----------
  // la foto se achica a 256x256 antes de mandarla para que no pese casi nada
  const archivo = buscar("#foto-archivo", cont);
  buscar("#foto-cambiar", cont).onclick = () => archivo.click();
  archivo.onchange = async () => {
    const f = archivo.files[0];
    archivo.value = "";
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return avisar("Elige una imagen PNG, JPG o WEBP.", "err");
    if (f.size > 8 * 1024 * 1024) return avisar("La imagen pesa más de 8 MB, elige otra.", "err");
    try {
      const foto = await achicar(f, 256);
      guardar(await api("/api/cuenta/foto", { metodo: "PUT", datos: { foto } }));
      avisar("Tu foto se actualizó.");
    } catch (e) { avisar(e.message, "err"); }
  };
  buscar("#foto-quitar", cont).onclick = async () => {
    if (!await confirmar("Se va a mostrar la inicial de tu nombre en su lugar.", { titulo: "¿Quitar tu foto?", si: "Quitar", peligro: true })) return;
    try { guardar(await api("/api/cuenta/foto", { metodo: "DELETE" })); avisar("Foto eliminada."); }
    catch (e) { avisar(e.message, "err"); }
  };

  // ---------- DATOS ----------
  const letras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ. ]+$/;
  fDatos.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(fDatos));
    Object.keys(d).forEach(k => d[k] = d[k].trim().replace(/\s+/g, " "));
    if (!letras.test(d.nombres) || !letras.test(d.paterno) || (d.materno && !letras.test(d.materno)))
      return avisar("El nombre y los apellidos solo pueden tener letras.", "err");
    enviar(fDatos, async () => {
      guardar(await api("/api/cuenta", { metodo: "PUT", datos: d }));
      avisar("Tus datos se guardaron.");
    });
  };

  // ---------- CORREO ----------
  fCorreo.onsubmit = async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(fCorreo));
    d.correo = d.correo.trim().toLowerCase();
    if (d.correo === yo.correo) return avisar("Ese ya es tu correo.", "err");
    if (!await confirmar(`A partir de ahora vas a entrar con ${d.correo}.`, { titulo: "¿Cambiar tu correo?", si: "Cambiar" })) return;
    enviar(fCorreo, async () => {
      guardar(await api("/api/cuenta/correo", { metodo: "PUT", datos: d }));
      fCorreo.reset();
      avisar("Tu correo se cambió.");
    });
  };

  // ---------- CONTRASEÑA ----------
  fClave.nueva.addEventListener("input", () => buscar("#fuerza", cont).dataset.n = fuerza(fClave.nueva.value));
  fClave.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(fClave));
    if (!REGLA_CLAVE.test(d.nueva)) return avisar(MSG_CLAVE, "err");
    if (d.nueva !== d.nueva2) return avisar("Las contraseñas no son iguales.", "err");
    enviar(fClave, async () => {
      await api("/api/cuenta/clave", { metodo: "PUT", datos: { actual: d.actual, nueva: d.nueva } });
      fClave.reset();
      buscar("#fuerza", cont).dataset.n = 0;
      avisar("Tu contraseña se cambió.");
    });
  };

  // ---------- RECUPERAR (te manda un codigo al correo) ----------
  buscar("#olvide", cont).onclick = async () => {
    if (!await confirmar(`Te vamos a mandar un código de 6 números a ${yo.correo}.`, { titulo: "¿Recuperar tu contraseña?", si: "Mandar código" })) return;
    try {
      const r = await api("/api/recuperar", { metodo: "POST", datos: { correo: yo.correo } });
      buscar("#rec-aviso", cont).textContent = r.prueba
        ? "Modo prueba: el correo todavía no está configurado, el código salió en la terminal donde corre flask."
        : `Te mandamos el código a ${yo.correo}. Sirve 15 minutos. Revisa también tu carpeta de spam.`;
      fClave.hidden = true;
      fRec.hidden = false;
      fRec.codigo.focus();
    } catch (e) { avisar(e.message, "err"); }
  };
  buscar("#rec-cancelar", cont).onclick = () => { fRec.reset(); fRec.hidden = true; fClave.hidden = false; };
  fRec.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(fRec));
    if (!/^\d{6}$/.test(d.codigo)) return avisar("El código son 6 números.", "err");
    if (!REGLA_CLAVE.test(d.clave)) return avisar(MSG_CLAVE, "err");
    if (d.clave !== d.clave2) return avisar("Las contraseñas no son iguales.", "err");
    enviar(fRec, async () => {
      await api("/api/recuperar/cambiar", { metodo: "POST", datos: { correo: yo.correo, codigo: d.codigo, clave: d.clave } });
      fRec.reset(); fRec.hidden = true; fClave.hidden = false;
      avisar("Listo, tu contraseña nueva ya quedó.");
    });
  };
}

// achicar, recorta la imagen en cuadrado desde el centro y la deja de tam x tam en jpg
function achicar(archivo, tam) {
  return new Promise((resolver, fallar) => {
    const img = new Image(), url = URL.createObjectURL(archivo);
    img.onload = () => {
      const lado = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = c.height = tam;
      c.getContext("2d").drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, tam, tam);
      URL.revokeObjectURL(url);
      resolver(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); fallar(new Error("No se pudo leer la imagen.")); };
    img.src = url;
  });
}
