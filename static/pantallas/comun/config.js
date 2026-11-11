// cambiar el tema, este se ve al instante y se queda guardado
import { buscar, buscarTodos } from "/static/js/nucleo/utiles.js";
import { cambiarTema, preferencia } from "/static/js/nucleo/datos.js";

export function iniciar(cont) {
  // marcar, le pone la clase on (borde azul y palomita) al tema q esta puesto ahorita
  const marcar = () => buscarTodos("[data-t]", cont).forEach(b => b.classList.toggle("on", b.dataset.t === document.documentElement.dataset.tema));
  buscarTodos("[data-t]", cont).forEach(b => b.onclick = () => { cambiarTema(b.dataset.t); marcar(); });
  marcar(); // y una vez al abrir la pantalla para q ya salga marcado el tema actual

  // el switch del menu compacto hace lo mismo que los tres puntitos de la barra de arriba
  const sw = buscar("#cfg-menu", cont), marco = buscar("#marco");
  sw.checked = marco.classList.contains("cerrado");
  sw.onchange = () => {
    marco.classList.toggle("cerrado", sw.checked);
    preferencia("menuCerrado", sw.checked ? "1" : "0");
  };
}