// /static/pantallas/admin/reportes.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  getEvaluaciones, getPreguntas, promedioGeneral, promedioPorPregunta, getCarrerasConEvaluaciones
} from "/static/js/nucleo/datos.js";

let cont = null;
const sel = k => buscar("#r-" + k, cont);

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  const evals = getEvaluaciones();
  const preguntas = getPreguntas();

  const unicos = (arr, key) => [...new Set(arr.map(e => e[key]))].filter(Boolean).sort();

  const OPC = {
    carrera: () => getCarrerasConEvaluaciones(),
    cuatri: () => {
      const c = sel("carrera").value;
      return unicos(evals.filter(e => !c || e.carrera === c), "cuatrimestre");
    },
    grupo: () => {
      const c = sel("carrera").value;
      const ct = sel("cuatri").value;
      return unicos(evals.filter(e => (!c || e.carrera === c) && (!ct || e.cuatrimestre === ct)), "grupo");
    },
    prof: () => {
      const c = sel("carrera").value;
      const ct = sel("cuatri").value;
      const g = sel("grupo").value;
      return unicos(evals.filter(e => (!c || e.carrera === c) && (!ct || e.cuatrimestre === ct) && (!g || e.grupo === g)), "profesor");
    },
    mat: () => {
      const c = sel("carrera").value;
      const ct = sel("cuatri").value;
      const g = sel("grupo").value;
      const p = sel("prof").value;
      return unicos(evals.filter(e => (!c || e.carrera === c) && (!ct || e.cuatrimestre === ct) && (!g || e.grupo === g) && (!p || e.profesor === p)), "materia");
    }
  };

  const SIG = { carrera: ["cuatri"], cuatri: ["grupo"], grupo: ["prof"], prof: ["mat"] };

  function poner(k, abierto) {
    const s = sel(k);
    const lbl = { carrera: "Todas las carreras", cuatri: "Todos los cuatrimestres", grupo: "Todos los grupos", prof: "Todos los profesores", mat: "Todas las materias" };
    s.innerHTML = `<option value="">${lbl[k]}</option>` + (abierto ? OPC[k]() : []).map(x => `<option>${x}</option>`).join("");
    s.disabled = !abierto && !sel("carrera").value;
  }

  function limpiar(k) {
    const s = sel(k);
    s.innerHTML = `<option value="">Todos</option>`;
    s.disabled = true;
    (SIG[k] || []).forEach(limpiar);
  }

  Object.keys(OPC).forEach(k => {
    if (k === "carrera") poner(k, true);
    else {
      const s = sel(k);
      s.innerHTML = `<option value="">Todos</option>`;
      s.disabled = true;
    }
  });

  Object.keys(OPC).forEach(k => {
    sel(k).addEventListener("change", () => {
      (SIG[k] || []).forEach(limpiar);
      if (sel(k).value) (SIG[k] || []).forEach(n => poner(n, true));
      pintar(evals, preguntas);
    });
  });

  pintar(evals, preguntas);
}

function pintar(evals, preguntas) {
  const c = sel("carrera").value;
  const ct = sel("cuatri").value;
  const g = sel("grupo").value;
  const p = sel("prof").value;
  const m = sel("mat").value;

  const filtradas = evals
    .filter(e => !c || e.carrera === c)
    .filter(e => !ct || e.cuatrimestre === ct)
    .filter(e => !g || e.grupo === g)
    .filter(e => !p || e.profesor === p)
    .filter(e => !m || e.materia === m);

  buscar("#r-info", cont).textContent = `${filtradas.length} evaluación(es) encontradas`;
  buscar("#r-promedio", cont).textContent = promedioGeneral(filtradas).toFixed(1);

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
          <td>${e.cuatrimestre}</td>
          <td>${e.grupo}</td>
          <td>${e.profesor}</td>
          <td>${e.materia}</td>
          <td><b>${e.promedio.toFixed(1)}</b></td>
          <td>${e.comentario || "—"}</td>
        </tr>`).join("")
    : `<tr><td colspan="8" class="vacio">No hay evaluaciones con esos filtros.</td></tr>`;
}