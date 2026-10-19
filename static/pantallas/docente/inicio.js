
// docente/inicio.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { leer, obtenerSesion } from "/static/js/nucleo/datos.js";

export function iniciar(cont) {
  const s = obtenerSesion();
  buscar("#saludo", cont).textContent = "¡Hola, " + s.nombre + "!";
  // las evaluaciones guardan el nombre del profesor y cuenta las que son de este docente
  buscar("#n-eval", cont).textContent = leer("evaluaciones").filter(e => e.profesor === s.nombre).length;
}