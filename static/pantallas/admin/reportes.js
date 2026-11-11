// /static/pantallas/admin/reportes.js
import { buscar, esc } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  getEvaluaciones, getPreguntasActivas, getGrupos, getDocentes,
  promedioGeneral, promedioPorPregunta,
  getCarrerasConEvaluaciones, promedioDe
} from "/static/js/nucleo/datos.js";

let cont = null;
const sel = k => buscar("#r-" + k, cont);


export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  // 1. Jalamos datos frescos
  const evals = getEvaluaciones() || [];
  const preguntas = getPreguntasActivas();
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
      carrerasUnicas.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
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
        
        sGrupo.innerHTML = `<option value="">Todos los grupos</option>` + grps.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("");
        
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
        
        sProf.innerHTML = `<option value="">Todos los profesores</option>` + profes.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("");
        
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
        
        sMat.innerHTML = `<option value="">Todas las materias</option>` + materias.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("");
        
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

  // los cuadritos de arriba: cuantas, promedio, la mejor y la peor pregunta
  const promGeneral = Number(promedioGeneral(filtradas)) || 0;
  const proms = promedioPorPregunta(filtradas, preguntas).map(v => Number(v) || 0);
  const conDatos = proms.map((v, i) => [v, i]).filter(([v]) => v > 0);
  const mejor = conDatos.length ? conDatos.reduce((a, b) => b[0] > a[0] ? b : a) : null;
  const peor = conDatos.length ? conDatos.reduce((a, b) => b[0] < a[0] ? b : a) : null;
  const resumenEl = buscar("#r-resumen", cont);
  if (resumenEl) resumenEl.innerHTML = [
    ["Evaluaciones", filtradas.length],
    ["Promedio general", filtradas.length ? promGeneral.toFixed(1) : "—"],
    ["Pregunta mejor calificada", mejor ? `P${mejor[1] + 1} · ${mejor[0].toFixed(1)}` : "—"],
    ["Pregunta más baja", peor ? `P${peor[1] + 1} · ${peor[0].toFixed(1)}` : "—"]
  ].map(([l, v]) => `<div class="pg-card"><small>${l}</small><b>${v}</b></div>`).join("");

  // la grafica, una barra por pregunta con su texto. va de 5 a 10 asi que el 5 es la barra vacia
  const barrasEl = buscar("#r-barras", cont);
  if (barrasEl) {
    barrasEl.innerHTML = preguntas.length
      ? preguntas.map((p, i) => {
          const v = proms[i] || 0;
          const pct = v ? Math.min(Math.max((v - 5) / 5 * 100, 2), 100) : 0;
          return `<li title="${esc(p.texto)}">
            <span class="n">P${i + 1}</span>
            <div class="t"><span>${esc(p.texto)}</span><div class="pista"><i style="width:${pct}%"></i></div></div>
            <b class="v">${v ? v.toFixed(1) : "—"}</b>
          </li>`;
        }).join("")
      : `<li class="sub">No hay preguntas activas.</li>`;
  }

  const clasePromedio = n => n >= 9 ? "alta" : n >= 7 ? "media" : "baja";
  const tablaEl = buscar("#r-tabla", cont);
  if (tablaEl) {
    tablaEl.innerHTML = filtradas.length
      ? filtradas.slice().reverse().map(e => {
          const prom = promedioDe(e);
          return `
          <tr>
            <td>${esc(e.fecha) || "—"}</td>
            <td>${esc(e.carrera) || "—"}</td>
            <td>${esc(e.cuatrimestre) ? esc(e.cuatrimestre) + "°" : "—"}</td>
            <td><span class="chip clave">${esc(e.grupo) || "—"}</span></td>
            <td>${esc(e.profesor) || "—"}</td>
            <td>${esc(e.materia) || "—"}</td>
            <td><span class="nota-prom ${clasePromedio(prom)}">${prom.toFixed(1)}</span></td>
            <td class="comentario-celda">${esc(e.comentario) || "—"}</td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="8" class="vacio">No hay evaluaciones con esos filtros.</td></tr>`;
  }
}
