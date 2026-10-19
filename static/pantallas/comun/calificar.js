
// calificar el sistema con estrellitas y un comentario
// PEROOO POR AHORITA la opinión se guarda en el navegador  de "opiniones", para que de verdad les llegue
// NOOOOS FALTAAAAAAAAAA PENDIENTEEEEEEEEEEEEEEEEEEEEfalta mandarla al servidor (Flask) o a la base de datos
import { buscar, buscarTodos } from "/static/js/nucleo/utiles.js";
import { icono } from "/static/js/nucleo/iconos.js";
import { leer, guardar, obtenerSesion } from "/static/js/nucleo/datos.js";

// lo que dice debajo de las estrellas según cuantas elijas
const TEXTOS = ["Muy mal", "Mal", "Regular", "Bien", "Excelente"];

export function iniciar(cont) {
  const f = buscar("#form-opinion", cont), caja = buscar("#estrellas", cont), msg = buscar("#msg", cont);
  let valor = 0; // cuantas estrellas se eligieron 0 = ninguna

  // avisar, muestra un mensaje verde de ok o rojo de error
  const avisar = (texto, ok) => { msg.textContent = texto; msg.className = ok ? "ok" : "err"; msg.hidden = false; };

  // las 5 estrellas que son botones, data-v es el número de la estrella
  caja.innerHTML = TEXTOS.map((t, i) =>
    `<button type="button" class="estrella" data-v="${i + 1}" aria-label="${i + 1} de 5: ${t}">${icono("estrella")}</button>`).join("");

  // pintar, enciende las primeras n estrellas y cambia el texto de abajo
  const pintar = n => {
    buscarTodos(".estrella", caja).forEach((b, i) => b.classList.toggle("on", i < n));
    buscar("#texto-estrellas", cont).textContent = n ? `${n} de 5 · ${TEXTOS[n - 1]}` : "Toca una estrella";
  };
  caja.onclick = e => { const b = e.target.closest(".estrella"); if (b) { valor = +b.dataset.v; pintar(valor); msg.hidden = true; } };

  f.addEventListener("submit", e => {
    e.preventDefault();
    if (!valor) return avisar("Elige cuántas estrellas le das al sistema.", false); // validación de JavaScript
    guardar("opiniones", [...leer("opiniones"), {
      fecha: new Date().toLocaleDateString("es-MX"),
      rol: obtenerSesion().rol,
      estrellas: valor,
      comentario: f.comentario.value.trim()
    }]);
    f.reset(); valor = 0; pintar(0);
    avisar("¡Gracias! Tu opinión se envió.", true);
  });
}