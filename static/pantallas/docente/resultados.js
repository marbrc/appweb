// /static/pantallas/docente/resultados.js
// Resultados del docente: promedio general, promedio por pregunta y tabla detallada.
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { evaluacionesDelDocente, PREG } from "./datos-docente.js";

let cont = null;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  const evals = evaluacionesDelDocente();

  // llena el select de materias
  const materias = [...new Set(evals.map(e => e.materia))];
  buscar("#r-materia", cont).innerHTML =
    `<option value="">Todas las materias</option>` +
    materias.map(m => `<option>${m}</option>`).join("");

  buscar("#r-materia", cont).addEventListener("change", pintar);
  pintar();

  function pintar() {
    const materia = buscar("#r-materia", cont).value;
    const filtradas = materia ? evals.filter(e => e.materia === materia) : evals;

    if (!filtradas.length) {
      buscar("#res-info", cont).textContent = "Todavía no tienes evaluaciones.";
      buscar("#r-promedio", cont).textContent = "0.0";
      buscar("#r-barras", cont).innerHTML = "";
      buscar("#r-tabla", cont).innerHTML = "";
      return;
    }

    buscar("#res-info", cont).textContent =
      `${filtradas.length} evaluación(es) · ${materia || "todas las materias"}`;

    // promedio general
    const promGeneral = filtradas.reduce((a, e) => a + e.promedio, 0) / filtradas.length;
    buscar("#r-promedio", cont).textContent = promGeneral.toFixed(1);

    // promedio por pregunta
    const proms = Array.from({ length: 12 }, (_, i) => {
      const suma = filtradas.reduce((a, e) => a + (e.calificaciones[i] || 0), 0);
      return suma / filtradas.length;
    });

    // barras
    buscar("#r-barras", cont).innerHTML = proms.map((v, i) => `
      <span class="col" title="Pregunta ${i + 1}: ${v.toFixed(1)}">
        <i style="height:${v * 10}%"></i>
        <b>${i + 1}</b>
      </span>`).join("");

    // tabla
    buscar("#r-tabla", cont).innerHTML = PREG.map((q, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${q}</td>
        <td><b>${proms[i].toFixed(1)}</b></td>
      </tr>`).join("");
  }
}