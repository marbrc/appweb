// /static/pantallas/docente/comentarios.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { evaluacionesDelDocenteConEjemplo } from "./datos-docente.js";

let cont = null;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  const evals = evaluacionesDelDocenteConEjemplo().filter(e => e.comentario);

  // Solo dejamos el select de materias
  const materias = [...new Set(evals.map(e => e.materia))];

  buscar("#c-materia", cont).innerHTML =
    `<option value="">Todas las materias</option>` +
    materias.map(m => `<option>${m}</option>`).join("");

  buscar("#c-materia", cont).addEventListener("change", pintar);
  pintar();

  function pintar() {
    const materia = buscar("#c-materia", cont).value;

    const filtrados = evals
      .filter(e => !materia || e.materia === materia)
      .reverse();

    buscar("#c-info", cont).textContent = `${filtrados.length} comentario(s)`;

    buscar("#c-lista", cont).innerHTML = filtrados.length
      ? filtrados.map(e => `
          <li>
            <p>“${e.comentario}”</p>
            <span class="meta">${e.materia} · ${e.fecha}</span>
          </li>`).join("")
      : `<li class="vacio">No hay comentarios con esos filtros.</li>`;
  }
}