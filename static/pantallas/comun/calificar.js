
// calificar el sistema con estrellitas y un comentario
// YA QUEDOOO: la opinión se manda al servidor (POST /api/opiniones) y se guarda en la tabla Opinion
import { buscar, buscarTodos, api, avisar, cargando } from "/static/js/nucleo/utiles.js";
import { icono } from "/static/js/nucleo/iconos.js";

// lo que dice debajo de las estrellas según cuantas elijas
const TEXTOS = ["Muy mal", "Mal", "Regular", "Bien", "Excelente"];

export function iniciar(cont) {
  const f = buscar("#form-opinion", cont), caja = buscar("#estrellas", cont);
  let valor = 0; // cuantas estrellas se eligieron 0 = ninguna

  // las 5 estrellas que son botones, data-v es el número de la estrella
  caja.innerHTML = TEXTOS.map((t, i) =>
    `<button type="button" class="estrella" data-v="${i + 1}" aria-label="${i + 1} de 5: ${t}">${icono("estrella")}</button>`).join("");

  // pintar, enciende las primeras n estrellas y cambia el texto de abajo
  const pintar = n => {
    buscarTodos(".estrella", caja).forEach((b, i) => b.classList.toggle("on", i < n));
    buscar("#texto-estrellas", cont).textContent = n ? `${n} de 5 · ${TEXTOS[n - 1]}` : "Toca una estrella";
  };
  caja.onclick = e => { const b = e.target.closest(".estrella"); if (b) { valor = +b.dataset.v; pintar(valor); } };

  f.addEventListener("submit", async e => {
    e.preventDefault();
    if (!valor) return avisar("Elige cuántas estrellas le das al sistema.", "err"); // validación de JavaScript
    const btn = buscar(".btn", f);
    cargando(btn, true);
    try {
      await api("/api/opiniones", { metodo: "POST", datos: { estrellas: valor, comentario: f.comentario.value.trim() } });
      f.reset(); valor = 0; pintar(0);
      avisar("¡Gracias! Tu opinión se envió.");
    } catch (err) { avisar(err.message, "err"); }
    cargando(btn, false);
  });
}
