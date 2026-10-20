// /static/pantallas/docente/comentarios.js
// Comentarios que dejaron los alumnos al docente, con filtros por materia y grupo.
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { evaluacionesDelDocente } from "./datos-docente.js";

let cont = null;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  const evals = evaluacionesDelDocente().filter(e => e.comentario);

  // selects
  const materias = [...new Set(evals.map(e => e.materia))];
  const grupos = [...new Set(evals.map(e => e.grupo))];

  buscar("#c-materia", cont).innerHTML =
    `<option value="">Todas las materias</option>` +
    materias.map(m => `<option>${m}</option>`).join("");

  buscar("#c-grupo", cont).innerHTML =
    `<option value="">Todos los grupos</option>` +
    grupos.map(g => `<option>${g}</option>`).join("");

  buscar("#c-materia", cont).addEventListener("change", pintar);
  buscar("#c-grupo", cont).addEventListener("change", pintar);
  pintar();

  function pintar() {
    const materia = buscar("#c-materia", cont).value;
    const grupo = buscar("#c-grupo", cont).value;

    const filtrados = evals
      .filter(e => !materia || e.materia === materia)
      .filter(e => !grupo || e.grupo === grupo)
      .reverse();

    buscar("#c-info", cont).textContent =
      `${filtrados.length} comentario(s)`;

    buscar("#c-lista", cont).innerHTML = filtrados.length
      ? filtrados.map(e => `
          <li>
            <p>“${e.comentario}”</p>
            <span class="meta">${e.materia} · ${e.grupo} · ${e.fecha}</span>
          </li>`).join("")
      : `<li class="vacio">No hay comentarios con esos filtros.</li>`;
  }
}