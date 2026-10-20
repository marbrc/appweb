// /static/pantallas/admin/reportes.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  CARRERAS, getEvaluaciones, getPreguntas,
  promedioGeneral, promedioPorPregunta
} from "/static/js/nucleo/datos.js";

let cont = null;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  // llena el select de carreras con las estáticas
  buscar("#f-carrera", cont).innerHTML =
    `<option value="">Todas las carreras</option>` +
    CARRERAS.map(c => `<option>${c}</option>`).join("");

  // primera vez: carga los filtros de grupo/prof/mat con datos reales
  llenarSelects();

  ["#f-carrera", "#f-grupo", "#f-prof", "#f-mat"].forEach(s =>
    buscar(s, cont).addEventListener("change", pintar)
  );

  pintar();

  function llenarSelects() {
    const evals = getEvaluaciones();
    const grupos = [...new Set(evals.map(e => e.grupo))].sort();
    const profs  = [...new Set(evals.map(e => e.profesor))].sort();
    const mats   = [...new Set(evals.map(e => e.materia))].sort();

    buscar("#f-grupo", cont).innerHTML =
      `<option value="">Todos los grupos</option>` + grupos.map(g => `<option>${g}</option>`).join("");
    buscar("#f-prof", cont).innerHTML =
      `<option value="">Todos los profesores</option>` + profs.map(p => `<option>${p}</option>`).join("");
    buscar("#f-mat", cont).innerHTML =
      `<option value="">Todas las materias</option>` + mats.map(m => `<option>${m}</option>`).join("");
  }

  function pintar() {
    const c = buscar("#f-carrera", cont).value;
    const g = buscar("#f-grupo", cont).value;
    const p = buscar("#f-prof", cont).value;
    const m = buscar("#f-mat", cont).value;

    const filtradas = getEvaluaciones()
      .filter(e => !c || e.carrera === c)
      .filter(e => !g || e.grupo === g)
      .filter(e => !p || e.profesor === p)
      .filter(e => !m || e.materia === m);

    buscar("#r-info", cont).textContent = `${filtradas.length} evaluación(es)`;
    buscar("#r-promedio", cont).textContent = promedioGeneral(filtradas).toFixed(1);

    const preguntas = getPreguntas();
    const proms = promedioPorPregunta(filtradas, preguntas.length);

    buscar("#r-barras", cont).innerHTML = proms.map((v, i) => `
      <span class="col" title="P${i + 1}: ${v}">
        <i style="height:${v * 10}%"></i><b>${i + 1}</b>
      </span>`).join("");

    buscar("#r-tabla", cont).innerHTML = filtradas.length
      ? filtradas.slice().reverse().map(e => `
          <tr>
            <td>${e.fecha}</td>
            <td>${e.carrera}</td>
            <td>${e.grupo}</td>
            <td>${e.profesor}</td>
            <td>${e.materia}</td>
            <td><b>${e.promedio.toFixed(1)}</b></td>
            <td>${e.comentario || "—"}</td>
          </tr>`).join("")
      : `<tr><td colspan="7" class="vacio">No hay evaluaciones con esos filtros.</td></tr>`;
  }
}