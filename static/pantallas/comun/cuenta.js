
// cambiar correo y contraseña, los tres roles usan esta misma pantalla

import { buscar } from "/static/js/nucleo/utiles.js";
import { leer, guardar, obtenerSesion, actualizarSesion } from "/static/js/nucleo/datos.js";

export function iniciar(cont) {
  const sesion = obtenerSesion(), f = buscar("#form-cuenta", cont), msg = buscar("#msg", cont);
  buscar("#info", cont).textContent = sesion.nombre;
  f.correo.value = sesion.correo;

  // avisar, muestra un mensaje verde de ok o rojo de error
  const avisar = (texto, ok) => { msg.textContent = texto; msg.className = ok ? "ok" : "err"; msg.hidden = false; };

  f.addEventListener("submit", e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));

    // validación de JavaScript (la de HTML esta en cuenta.html)
    if (d.clave && d.clave !== d.clave2) return avisar("Las contraseñas no coinciden.", false);
    const us = leer("usuarios"), u = us.find(x => x.correo === sesion.correo);
    if (!u) return avisar("No encontré tu cuenta.", false);
    if (us.some(x => x !== u && x.correo === d.correo)) return avisar("Ese correo ya está registrado.", false);
    u.correo = d.correo;
    if (d.clave) u.clave = d.clave;
    guardar("usuarios", us);
    actualizarSesion({ ...sesion, correo: d.correo });
    f.clave.value = f.clave2.value = "";
    avisar("Tus cambios se guardaron.", true);
  });
}