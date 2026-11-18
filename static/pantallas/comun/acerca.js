// /static/pantallas/comun/acerca.js
// el número de preguntas ya no se escribe fijo: sale de las preguntas activas
import { buscar } from "/static/js/nucleo/utiles.js";
import { getPreguntasActivas } from "/static/js/nucleo/datos.js";

export function iniciar(cont) {
  const n = getPreguntasActivas().length;
  const num = buscar("#ac-num", cont);
  if (num) num.textContent = n || "varias";
}
