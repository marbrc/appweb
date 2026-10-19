// hace que las tarjetas se abran y se cierren,solo una abierta a la vez
import { buscar, buscarTodos } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";

export function iniciar(cont) {
  pintarIconos(cont); // pone los iconos de esta pantalla, el candado y las flechitas
  const cartas = buscarTodos(".guia-card", cont);

  // un solo escuchador para las 4 tarjetas, cuando tocas el título de una se abre
  buscar(".guia", cont).addEventListener("click", e => {
    const cab = e.target.closest(".guia-cab");
    if (!cab) return;
    const carta = cab.parentElement, abrir = !carta.classList.contains("abierta"); // si ya estaba abierta, solo se cierra
    cartas.forEach(c => { c.classList.remove("abierta"); buscar(".guia-cab", c).setAttribute("aria-expanded", "false"); });
    if (abrir) { carta.classList.add("abierta"); cab.setAttribute("aria-expanded", "true"); }
  });
}