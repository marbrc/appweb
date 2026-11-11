// /static/pantallas/admin/inicio.js
import { buscar, esc, api } from "/static/js/nucleo/utiles.js";
import { icono } from "/static/js/nucleo/iconos.js";
import {
  getGrupos, getDocentes, getClases, getEvaluaciones,
  promedioGeneral, getPreguntasActivas, promedioDe, obtenerSesion
} from "/static/js/nucleo/datos.js";

// clasePromedio, el color de la pastillita segun el promedio  9 o mas verde  7 o mas amarillo y menos de 7 rojo
const clasePromedio = n => n >= 9 ? "alta" : n >= 7 ? "media" : "baja";

// respondieron, cuantos alumnos de un grupo ya contestaron
// cada alumno manda 1 evaluación por materia, así que tomo la materia con más evaluaciones
function respondieron(evals, clave) {
  const cuenta = {};
  evals.filter(e => e.grupo === clave).forEach(e => {
    const k = `${e.profesor}|${e.materia}`;
    cuenta[k] = (cuenta[k] || 0) + 1;
  });
  return Math.max(0, ...Object.values(cuenta));
}

export async function iniciar(cont) {
  const evals = getEvaluaciones() || [];
  const grupos = getGrupos() || [];
  const docentes = getDocentes() || [];
  const clases = getClases() || [];
  const preguntas = getPreguntasActivas();

  // 0. el saludo de arriba, buenos dias tardes o noches segun la hora y el nombre de quien inicio sesion
  //    textContent y no innerHTML para q nadie pueda meter codigo en su nombre
  const hora = new Date().getHours();
  buscar("#a-saludo", cont).textContent = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const ses = obtenerSesion();
  buscar("#a-nombre", cont).textContent = ses?.nombres || ses?.nombre || "Administrador";
  const fecha = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  buscar("#a-fecha", cont).textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  // 1. la franja de numeros [numero, letrero, detalle, a donde lleva]
  const totalAlumnos = grupos.reduce((a, g) => a + (Number(g.alumnos) || 0), 0);
  const resumen = [
    [grupos.length, "Grupos", totalAlumnos ? `${totalAlumnos} alumnos` : "sin alumnos capturados", "admin/grupos"],
    [docentes.length, "Docentes", `${clases.length} asignaciones`, "admin/docentes"],
    [preguntas.length, "Preguntas activas", "escala del 5 al 10", "admin/preguntas"],
    [evals.length, "Evaluaciones", evals.length === 1 ? "respuesta recibida" : "respuestas recibidas", "admin/reportes"],
    [evals.length ? promedioGeneral(evals).toFixed(1) : "—", "Promedio general", "de todas las materias", "admin/reportes"]
  ];
  buscar("#a-resumen", cont).innerHTML = resumen.map(([num, lbl, det, ruta]) => `
    <button class="kpi" type="button" data-ruta="${ruta}">
      <small>${lbl}</small><b>${num}</b><span>${det}</span>
    </button>`).join("");

  // 2. avance por grupo, la barrita es cuantos ya contestaron de cuantos alumnos tiene el grupo
  buscar("#a-avance", cont).innerHTML = grupos.length
    ? grupos.map(g => {
        const ya = respondieron(evals, g.clave);
        const pct = g.alumnos ? Math.min(100, Math.round(ya / g.alumnos * 100)) : 0;
        return `<li>
          <span class="chip clave">${esc(g.clave)}</span>
          <div class="prog" title="${pct}%"><i style="width:${pct}%"></i></div>
          <small>${g.alumnos ? `${ya} de ${g.alumnos} · ${pct}%` : `${ya} · falta capturar alumnos`}</small>
        </li>`;
      }).join("")
    : `<li class="sub">Todavía no hay grupos registrados.</li>`;

  // 3. tabla con las ultimas 6 evaluaciones
  const ultimas = evals.slice(-6).reverse();
  buscar("#a-tabla", cont).innerHTML = ultimas.length
    ? ultimas.map(e => {
        const prom = promedioDe(e);
        return `<tr>
          <td>${esc(e.fecha) || "—"}</td>
          <td><span class="chip clave">${esc(e.grupo) || "—"}</span></td>
          <td>${esc(e.profesor) || "—"}</td>
          <td>${esc(e.materia) || "—"}</td>
          <td><span class="nota-prom ${clasePromedio(prom)}">${prom.toFixed(1)}</span></td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="5" class="vacio">Todavía no hay evaluaciones. Cuando los alumnos contesten con su enlace aparecen aquí.</td></tr>`;

  // 4. pendientes, lo que falta para que los alumnos puedan evaluar
  //    los codigos se preguntan al servidor porque no estan en localStorage
  let codigos = [];
  try { codigos = await api("/api/codigos"); } catch { /* si falla solo no sale ese pendiente */ }
  const sinCodigo = clases.filter(c => !codigos.some(k => k.grupo === c.grupoId && k.materia === c.asignaturaId)).length;
  const sinAlumnos = grupos.filter(g => !g.alumnos).length;
  const sinCorreo = docentes.filter(d => !d.correo).length;

  const p = [];   // [tipo, texto, detalle, boton, ruta]
  if (!preguntas.length) p.push(["warn", "No hay preguntas activas", "Sin preguntas los alumnos no pueden contestar.", "Agregar preguntas", "admin/preguntas"]);
  if (!clases.length) p.push(["warn", "No hay carga académica", "Asigna qué docente da cada materia en cada grupo.", "Ir a carga académica", "admin/clases"]);
  else if (sinCodigo) p.push(["warn", `${sinCodigo} ${sinCodigo === 1 ? "asignación no tiene" : "asignaciones no tienen"} código`, "Sin código el grupo no tiene enlace para evaluar.", "Generar códigos", "admin/accesos"]);
  if (sinAlumnos) p.push(["warn", `${sinAlumnos} ${sinAlumnos === 1 ? "grupo sin" : "grupos sin"} número de alumnos`, "Sin ese número no se puede calcular la participación.", "Editar grupos", "admin/grupos"]);
  if (sinCorreo) p.push(["info", `${sinCorreo} ${sinCorreo === 1 ? "docente sin" : "docentes sin"} correo`, "No es obligatorio, pero sirve para mandarles sus resultados.", "Ver docentes", "admin/docentes"]);
  if (!p.some(x => x[0] === "warn")) p.unshift(["ok", "Todo listo para evaluar", "Los grupos ya pueden contestar con su enlace.", "", ""]);

  buscar("#a-pendientes", cont).innerHTML = p.map(([tipo, txt, det, btn, ruta]) => `
    <li class="${tipo}">
      ${icono(tipo === "ok" ? "check" : tipo === "warn" ? "alerta" : "info").replace("<svg", '<svg width="18" height="18"')}
      <div><b>${txt}</b><span class="sub">${det}</span>${btn ? `<button class="link" type="button" data-ruta="${ruta}">${btn} →</button>` : ""}</div>
    </li>`).join("");
}
