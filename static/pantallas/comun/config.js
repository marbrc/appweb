// cambiar el tema, este se ve al instante y se queda guardado
import { buscarTodos } from "/static/js/nucleo/utiles.js";
import { cambiarTema } from "/static/js/nucleo/datos.js";

export function iniciar(cont) {
  buscarTodos("[data-t]", cont).forEach(b => b.onclick = () => cambiarTema(b.dataset.t));
}