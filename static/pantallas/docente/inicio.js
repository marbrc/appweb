// /static/pantallas/docente/inicio.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { obtenerSesion } from "/static/js/nucleo/datos.js";
import { evaluacionesDelDocente } from "./datos-docente.js";

export function iniciar(cont) {
  pintarIconos(cont);

  const s = obtenerSesion();
  const nombre = s ? s.nombre : "Docente";
  
  buscar("#saludo", cont).textContent = "¡Hola, " + nombre + "!";
  
  // Usamos la función oficial que filtra correctamente
  const evals = evaluacionesDelDocente();
  
  buscar("#n-eval", cont).textContent = evals.length;
}