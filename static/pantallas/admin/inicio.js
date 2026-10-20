// /static/pantallas/admin/inicio.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  getGrupos, getDocentes, getAsignaturas, getEvaluaciones,
  promedioGeneral, promedioPorPregunta, getPreguntas
} from "/static/js/nucleo/datos.js";

export function iniciar(cont) {
  pintarIconos(cont);

  const evals = getEvaluaciones();
  const preguntas = getPreguntas();

  buscar("#a-resumen", cont).innerHTML = `
    <div class="tarjeta"><span class="num">${getGrupos().length}</span><span class="lbl">Grupos</span></div>
    <div class="tarjeta"><span class="num">${getDocentes().length}</span><span class="lbl">Docentes</span></div>
    <div class="tarjeta"><span class="num">${getAsignaturas().length}</span><span class="lbl">Asignaturas</span></div>
    <div class="tarjeta"><span class="num">${evals.length}</span><span class="lbl">Evaluaciones</span></div>
    <div class="tarjeta"><span class="num">${promedioGeneral(evals).toFixed(1)}</span><span class="lbl">Promedio</span></div>
  `;

  const proms = promedioPorPregunta(evals, preguntas.length);
  buscar("#a-barras", cont).innerHTML = proms.map((v, i) => `
    <span class="col" title="P${i + 1}: ${v}">
      <i style="height:${v * 10}%"></i><b>${i + 1}</b>
    </span>`).join("");

  const ultimas = evals.slice(-8).reverse();
  buscar("#a-tabla", cont).innerHTML = ultimas.length
    ? ultimas.map(e => `
        <tr>
          <td>${e.fecha}</td>
          <td>${e.carrera}</td>
          <td>${e.grupo}</td>
          <td>${e.profesor}</td>
          <td>${e.materia}</td>
          <td><b>${e.promedio.toFixed(1)}</b></td>
        </tr>`).join("")
    : `<tr><td colspan="6" class="vacio">Todavía no hay evaluaciones.</td></tr>`;
}