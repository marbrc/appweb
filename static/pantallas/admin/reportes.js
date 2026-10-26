// /static/pantallas/admin/reportes.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  getEvaluaciones, getPreguntas,
  promedioGeneral, promedioPorPregunta,
  getCarrerasConEvaluaciones, promedioDe
} from "/static/js/nucleo/datos.js";

let cont = null;
const sel = k => buscar("#r-" + k, cont);

const ESTILOS = `
#r-barras {
  display: flex; align-items: stretch; gap: 2rem;
  margin: 1.5rem 0; padding: 1rem;
  background: var(--card); border: 1px solid var(--bd); border-radius: 1rem; color: var(--tx);
}
#r-barras .grafica-area { display: flex; flex: 1; position: relative; padding-left: 28px; }
#r-barras .y-axis {
  position: absolute; left: -8px; top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  font-size: .8rem; color: var(--mut); white-space: nowrap;
}
#r-barras .ticks {
  display: flex; flex-direction: column; justify-content: space-between;
  margin-top: 30px; height: 140px; padding-right: 6px;
  font-size: .7rem; text-align: right; color: var(--mut);
}
#r-barras .grafica-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
#r-barras .fila-vals, #r-barras .fila-nums { display: flex; }
#r-barras .val-cel { flex: 1; text-align: center; font-size: .75rem; color: var(--tx); }
#r-barras .fila-vals { height: 30px; align-items: center; }
#r-barras .val-top { border: 1px solid var(--bd); background: var(--in); border-radius: .3rem; padding: 1px 4px; font-weight: 700; }
#r-barras .cols-container {
  display: flex; height: 140px; border: 1px solid var(--bd);
  background-image: linear-gradient(to top, var(--bd) 1px, transparent 1px);
  background-size: 100% 20%;
}
/* flex-direction row porq si no heredaba column de estilos.css y la barra se pegaba a la derecha de su columna */
#r-barras .col { flex: 1; display: flex; flex-direction: row; align-items: flex-end; justify-content: center; height: 100%; }
#r-barras .col i { display: block; width: 80%; border-radius: 4px 4px 0 0; }
#r-barras .fila-nums { margin-top: 4px; }
#r-barras .x-axis { text-align: center; font-size: .85rem; margin-top: 4px; color: var(--mut); }
#r-barras .promedio-lateral {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-width: 120px; gap: .8rem;
}
#r-barras .promedio-lateral .lbl {
  font-size: .85rem; color: var(--mut); text-transform: uppercase;
  text-align: center; letter-spacing: 1px;
}
#r-barras .caja-prom {
  font-size: 2rem; font-weight: 800; padding: .5rem 1.2rem;
  border: 2px solid var(--pri); background: var(--in); color: var(--ac);
  border-radius: .8rem; box-shadow: 0 6px 16px #0b2a5b33;
}
`;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  if (!document.getElementById("estilos-resultados")) {
    const st = document.createElement("style");
    st.id = "estilos-resultados";
    st.textContent = ESTILOS;
    document.head.appendChild(st);
  }

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
    s.innerHTML = `<option value="">${lbl[k]}</option>`
                + (abierto ? OPC[k]() : []).map(x => `<option>${x}</option>`).join("");
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

  const promGeneral = Number(promedioGeneral(filtradas)) || 0;
  const proms = (promedioPorPregunta(filtradas, preguntas.length) || []).map(v => Number(v) || 0);

  // antes cada barra era de un gris distinto (tonos) y con el tema negro ni se veian, ahora todas usan el azul del tema
  const tonos = ["var(--pri)"];

  const vals = proms.map(v =>
    `<div class="val-cel"><span class="val-top">${v.toFixed(1)}</span></div>`
  ).join("");

  // Escala 5 a 10 -> 0% a 100%
  const cols = proms.map((v, i) => {
    const pct = Math.min(Math.max((v - 5) / 5 * 100, 0), 100);
    return `<div class="col" title="P${i + 1}: ${v.toFixed(1)}"><i style="height:${pct}%;background:${tonos[i % tonos.length]}"></i></div>`;
  }).join("");

  const nums = proms.map((_, i) => `<b class="val-cel">${i + 1}</b>`).join("");
  const ticks = [10, 9, 8, 7, 6, 5].map(t => `<span>${t}</span>`).join("");

  buscar("#r-barras", cont).innerHTML = `
    <div class="grafica-area">
      <span class="y-axis">Puntuación</span>
      <div class="ticks">${ticks}</div>
      <div class="grafica-main">
        <div class="fila-vals">${vals}</div>
        <div class="cols-container">${cols}</div>
        <div class="fila-nums">${nums}</div>
        <div class="x-axis">Preguntas</div>
      </div>
    </div>
    <div class="promedio-lateral">
      <span class="lbl">Promedio<br>General</span>
      <div class="caja-prom">${promGeneral.toFixed(1)}</div>
    </div>`;

  buscar("#r-tabla", cont).innerHTML = filtradas.length
    ? filtradas.slice().reverse().map(e => `
        <tr>
          <td>${e.fecha}</td>
          <td>${e.carrera}</td>
          <td>${e.cuatrimestre}</td>
          <td>${e.grupo}</td>
          <td>${e.profesor}</td>
          <td>${e.materia}</td>
          <td><b>${promedioDe(e).toFixed(1)}</b></td>
          <td>${e.comentario || "—"}</td>
        </tr>`).join("")
    : `<tr><td colspan="8" class="vacio">No hay evaluaciones con esos filtros.</td></tr>`;
}