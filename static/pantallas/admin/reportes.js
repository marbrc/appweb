// /static/pantallas/admin/reportes.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  getEvaluaciones, getPreguntas, getGrupos, getDocentes,
  promedioGeneral, promedioPorPregunta,
  getCarrerasConEvaluaciones, promedioDe
} from "/static/js/nucleo/datos.js";

let cont = null;
const sel = k => buscar("#r-" + k, cont);

const ESTILOS = `
#r-barras { display: flex; align-items: stretch; gap: 2rem; margin: 1.5rem 0; padding: 1rem; background: var(--card); border: 1px solid var(--bd); border-radius: 1rem; color: var(--tx); }
#r-barras .grafica-area { display: flex; flex: 1; position: relative; padding-left: 28px; }
#r-barras .y-axis { position: absolute; left: -8px; top: 50%; transform: translateY(-50%) rotate(-90deg); font-size: .8rem; color: var(--mut); white-space: nowrap; }
#r-barras .ticks { display: flex; flex-direction: column; justify-content: space-between; margin-top: 30px; height: 140px; padding-right: 6px; font-size: .7rem; text-align: right; color: var(--mut); }
#r-barras .grafica-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
#r-barras .fila-vals, #r-barras .fila-nums { display: flex; }
#r-barras .val-cel { flex: 1; text-align: center; font-size: .75rem; color: var(--tx); }
#r-barras .fila-vals { height: 30px; align-items: center; }
#r-barras .val-top { border: 1px solid var(--bd); background: var(--in); border-radius: .3rem; padding: 1px 4px; font-weight: 700; }
#r-barras .cols-container { display: flex; height: 140px; border: 1px solid var(--bd); background-image: linear-gradient(to top, var(--bd) 1px, transparent 1px); background-size: 100% 20%; }
#r-barras .col { flex: 1; display: flex; flex-direction: row; align-items: flex-end; justify-content: center; height: 100%; }
#r-barras .col i { display: block; width: 80%; border-radius: 4px 4px 0 0; }
#r-barras .fila-nums { margin-top: 4px; }
#r-barras .x-axis { text-align: center; font-size: .85rem; margin-top: 4px; color: var(--mut); }
#r-barras .promedio-lateral { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 120px; gap: .8rem; }
#r-barras .promedio-lateral .lbl { font-size: .85rem; color: var(--mut); text-transform: uppercase; text-align: center; letter-spacing: 1px; }
#r-barras .caja-prom { font-size: 2rem; font-weight: 800; padding: .5rem 1.2rem; border: 2px solid var(--pri); background: var(--in); color: var(--ac); border-radius: .8rem; box-shadow: 0 6px 16px #0b2a5b33; }
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

  // 1. Jalamos datos frescos
  const evals = getEvaluaciones() || [];
  const preguntas = getPreguntas() || [];
  const grupos = getGrupos() || [];
  const docentes = getDocentes() || [];

  // 2. Enriquecer evaluaciones: buscar cuatrimestre Y traducir el correo del profe a su nombre
  evals.forEach(e => {
    const grupoInfo = grupos.find(g => g.clave === e.grupo);
    if (grupoInfo) e.cuatrimestre = grupoInfo.cuatrimestre;

    const docenteInfo = docentes.find(d => d.correo === e.profesor || d.nombre === e.profesor);
    if (docenteInfo) e.profesor = docenteInfo.nombre; 
  });

  const carrerasUnicas = getCarrerasConEvaluaciones() || [];

  // 3. Llenar select de carreras
  const sCarrera = sel("carrera");
  if (sCarrera) {
    sCarrera.innerHTML = `<option value="">Todas las carreras</option>` +
      carrerasUnicas.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  // 4. Función para actualizar los filtros en cascada
  function actualizarFiltros(origen) {
    const c = sel("carrera")?.value || "";
    const ct = sel("cuatri")?.value || "";
    const g = sel("grupo")?.value || "";
    const p = sel("prof")?.value || "";

    const unicos = (arr, key) => [...new Set(arr.map(e => e[key]))].filter(x => x !== undefined && x !== null && x !== "").sort();

    // --- CUATRIMESTRES ---
    const sCuatri = sel("cuatri");
    if (sCuatri && origen !== "cuatri") {
      if (c) {
        const valorPrevio = sCuatri.value; // Guardamos la selección
        const cuatris = unicos(evals.filter(e => e.carrera === c), "cuatrimestre");
        
        sCuatri.innerHTML = `<option value="">Todos los cuatrimestres</option>` + 
          cuatris.map(x => `<option value="${x}">${x}°</option>`).join("");
        
        sCuatri.value = valorPrevio; // Restauramos la selección
        sCuatri.disabled = false;
      } else {
        sCuatri.innerHTML = `<option value="">Todos los cuatrimestres</option>`;
        sCuatri.disabled = true;
      }
    }

    // --- GRUPOS ---
    const sGrupo = sel("grupo");
    if (sGrupo && origen !== "grupo") {
      if (c && ct) {
        const valorPrevio = sGrupo.value; // Guardamos la selección
        const grps = unicos(evals.filter(e => e.carrera === c && String(e.cuatrimestre) === String(ct)), "grupo");
        
        sGrupo.innerHTML = `<option value="">Todos los grupos</option>` + grps.map(x => `<option value="${x}">${x}</option>`).join("");
        
        sGrupo.value = valorPrevio; // Restauramos la selección
        sGrupo.disabled = false;
      } else {
        sGrupo.innerHTML = `<option value="">Todos los grupos</option>`;
        sGrupo.disabled = true;
      }
    }

    // --- PROFESORES ---
    const sProf = sel("prof");
    if (sProf && origen !== "prof") {
      if (c && ct && g) {
        const valorPrevio = sProf.value; // Guardamos la selección
        const profes = unicos(evals.filter(e => e.carrera === c && String(e.cuatrimestre) === String(ct) && e.grupo === g), "profesor");
        
        sProf.innerHTML = `<option value="">Todos los profesores</option>` + profes.map(x => `<option value="${x}">${x}</option>`).join("");
        
        sProf.value = valorPrevio; // Restauramos la selección
        sProf.disabled = false;
      } else {
        sProf.innerHTML = `<option value="">Todos los profesores</option>`;
        sProf.disabled = true;
      }
    }

    // --- MATERIAS ---
    const sMat = sel("mat");
    if (sMat && origen !== "mat") {
      if (c && ct && g && p) {
        const valorPrevio = sMat.value; // Guardamos la selección
        const materias = unicos(evals.filter(e => e.carrera === c && String(e.cuatrimestre) === String(ct) && e.grupo === g && e.profesor === p), "materia");
        
        sMat.innerHTML = `<option value="">Todas las materias</option>` + materias.map(x => `<option value="${x}">${x}</option>`).join("");
        
        sMat.value = valorPrevio; // Restauramos la selección
        sMat.disabled = false;
      } else {
        sMat.innerHTML = `<option value="">Todas las materias</option>`;
        sMat.disabled = true;
      }
    }

    dibujarTabla(evals, preguntas);
  }

  // 5. Eventos de los selects
  if (sel("carrera")) {
    sel("carrera").onchange = () => {
      if (sel("cuatri")) sel("cuatri").value = "";
      if (sel("grupo")) sel("grupo").value = "";
      if (sel("prof")) sel("prof").value = "";
      if (sel("mat")) sel("mat").value = "";
      actualizarFiltros("carrera");
    };
  }
  if (sel("cuatri")) {
    sel("cuatri").onchange = () => {
      if (sel("grupo")) sel("grupo").value = "";
      if (sel("prof")) sel("prof").value = "";
      if (sel("mat")) sel("mat").value = "";
      actualizarFiltros("cuatri");
    };
  }
  if (sel("grupo")) {
    sel("grupo").onchange = () => {
      if (sel("prof")) sel("prof").value = "";
      if (sel("mat")) sel("mat").value = "";
      actualizarFiltros("grupo");
    };
  }
  if (sel("prof")) {
    sel("prof").onchange = () => {
      if (sel("mat")) sel("mat").value = "";
      actualizarFiltros("prof");
    };
  }
  if (sel("mat")) {
    sel("mat").onchange = () => actualizarFiltros("mat");
  }

  // 6. Pintar por primera vez
  actualizarFiltros();
}

// 7. Función para dibujar la gráfica y la tabla
function dibujarTabla(evals, preguntas) {
  const c = sel("carrera")?.value || "";
  const ct = sel("cuatri")?.value || "";
  const g = sel("grupo")?.value || "";
  const p = sel("prof")?.value || "";
  const m = sel("mat")?.value || "";

  const filtradas = evals
    .filter(e => !c || e.carrera === c)
    .filter(e => !ct || String(e.cuatrimestre) === String(ct))
    .filter(e => !g || e.grupo === g)
    .filter(e => !p || e.profesor === p)
    .filter(e => !m || e.materia === m);

  const infoEl = buscar("#r-info", cont);
  if (infoEl) infoEl.textContent = `${filtradas.length} evaluación(es) encontradas`;

  const promGeneral = Number(promedioGeneral(filtradas)) || 0;
  const proms = (promedioPorPregunta(filtradas, preguntas.length) || []).map(v => Number(v) || 0);

  const vals = proms.map(v => `<div class="val-cel"><span class="val-top">${v.toFixed(1)}</span></div>`).join("");
  const cols = proms.map((v, i) => {
    const pct = Math.min(Math.max((v - 5) / 5 * 100, 0), 100);
    return `<div class="col" title="P${i + 1}: ${v.toFixed(1)}"><i style="height:${pct}%;background:var(--pri)"></i></div>`;
  }).join("");
  const nums = proms.map((_, i) => `<b class="val-cel">${i + 1}</b>`).join("");
  const ticks = [10, 9, 8, 7, 6, 5].map(t => `<span>${t}</span>`).join("");

  const barrasEl = buscar("#r-barras", cont);
  if (barrasEl) {
    barrasEl.innerHTML = `
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
  }

  const tablaEl = buscar("#r-tabla", cont);
  if (tablaEl) {
    tablaEl.innerHTML = filtradas.length
      ? filtradas.slice().reverse().map(e => `
          <tr>
            <td>${e.fecha || "—"}</td>
            <td>${e.carrera || "—"}</td>
            <td>${e.cuatrimestre || "—"}</td>
            <td>${e.grupo || "—"}</td>
            <td>${e.profesor || "—"}</td>
            <td>${e.materia || "—"}</td>
            <td><b>${promedioDe(e).toFixed(1)}</b></td>
            <td>${e.comentario || "—"}</td>
          </tr>`).join("")
      : `<tr><td colspan="8" class="vacio">No hay evaluaciones con esos filtros.</td></tr>`;
  }
}