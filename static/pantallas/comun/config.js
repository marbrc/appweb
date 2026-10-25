// cambiar el tema, este se ve al instante y se queda guardado
import { buscarTodos } from "/static/js/nucleo/utiles.js";
import { cambiarTema } from "/static/js/nucleo/datos.js";

export function iniciar(cont) {
  // marcar, le pone la clase on (borde azul y palomita) al tema q esta puesto ahorita
  const marcar = () => buscarTodos("[data-t]", cont).forEach(b => b.classList.toggle("on", b.dataset.t === document.documentElement.dataset.tema));
  buscarTodos("[data-t]", cont).forEach(b => b.onclick = () => { cambiarTema(b.dataset.t); marcar(); });
  marcar(); // y una vez al abrir la pantalla para q ya salga marcado el tema actual
}