

// es como el controlador de la pantalla, el marco llama a iniciar() cuando ya metió el HTML
import { buscar } from "/static/js/nucleo/utiles.js";
import { leer, obtenerSesion } from "/static/js/nucleo/datos.js";

export function iniciar(cont) {
  const usuarios = leer("usuarios");
  buscar("#saludo", cont).textContent = "¡Hola, " + obtenerSesion().nombre + "!";
  buscar("#n-eval", cont).textContent = leer("evaluaciones").length;
  buscar("#n-usuarios", cont).textContent = usuarios.length;
  buscar("#n-docentes", cont).textContent = usuarios.filter(u => u.rol === "docente").length;
}