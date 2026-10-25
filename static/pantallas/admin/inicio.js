// /static/pantallas/admin/inicio.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos, icono } from "/static/js/nucleo/iconos.js";
import { MENUS } from "/static/js/nucleo/menus.js";
import {
  getGrupos, getDocentes, getAsignaturas, getEvaluaciones,
  promedioGeneral, promedioPorPregunta, getPreguntas,
  promedioDe, obtenerSesion
} from "/static/js/nucleo/datos.js";

// esc, para q lo q venga de las evaluaciones no se meta como codigo html (por seguridad nomas)
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// clasePromedio, el color de la pastillita segun el promedio  9 o mas verde  7 o mas amarillo y menos de 7 rojo
const clasePromedio = n => n >= 9 ? "alta" : n >= 7 ? "media" : "baja";

export function iniciar(cont) {
  pintarIconos(cont);

  const evals = getEvaluaciones() || [];
  const preguntas = getPreguntas() || [];

  // 0. el saludo de arriba, buenos dias tardes o noches segun la hora y el nombre de quien inicio sesion
  //    textContent y no innerHTML para q nadie pueda meter codigo en su nombre
  const hora = new Date().getHours();
  buscar("#a-saludo", cont).textContent = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const ses = obtenerSesion();
  buscar("#a-nombre", cont).textContent = ses?.nombres || ses?.nombre || "Administrador";

  // 1. Tarjetas de resumen
  // cada una es [icono, numero, letrero, color] y --c es el color de su circulito, --d hace q salgan una tras otra
  const resumen = [
    ["grupos", (getGrupos() || []).length, "Grupos", "#1f6feb"],
    ["docentes", (getDocentes() || []).length, "Docentes", "#0e9f8e"],
    ["libro", (getAsignaturas() || []).length, "Asignaturas", "#7c4dff"],
    ["pregunta", preguntas.length, "Preguntas", "#e8590c"],
    ["editar", evals.length, "Evaluaciones", "#d6336c"],
    ["estrella", promedioGeneral(evals).toFixed(1), "Promedio", "#f5a524"]
  ];
  buscar("#a-resumen", cont).innerHTML = resumen.map(([ic, num, lbl, color], i) => `
    <div class="stat" style="--c:${color};--d:${i}">
      <span class="stat-ico">${icono(ic)}</span>
      <span class="num">${num}</span>
      <span class="lbl">${lbl}</span>
    </div>`).join("");

  // 1.5 los atajos, salen de menus.js (todas las opciones del admin menos Inicio) asi si un dia agregan una pantalla
  //     nueva al menu aparece solita aqui. el clic lo atrapa marco.js por el data-ruta y cambia de pantallaaa
  buscar("#a-atajos", cont).innerHTML = MENUS.admin.filter(o => o.ruta !== "admin/inicio").map((o, i) => `
    <button class="atajo-card" type="button" data-ruta="${o.ruta}" style="--d:${i}">
      <span class="ico">${icono(o.icono)}</span>
      <b>${o.nombre}</b>
      <small>${o.desc}</small>
    </button>`).join("");

  // 2. Gráfica de barras global
  // cada columna tiene el valor arriba, la barra en medio (dentro de .pista) y el numero de la pregunta abajo
  const proms = promedioPorPregunta(evals, preguntas.length);
  buscar("#a-barras", cont).innerHTML = proms.map((v, i) => `
    <span class="col" title="P${i + 1}: ${v}">
      <em>${v ? v.toFixed(1) : ""}</em>
      <span class="pista"><i style="height:${v * 10}%"></i></span>
      <b>${i + 1}</b>
    </span>`).join("");
  // si todavia no hay evaluaciones cambio el texto de arriba para q no se vea una grafica vacia sin explicacion
  if (!evals.length) buscar("#a-aviso", cont).textContent = "Todavía no hay evaluaciones, en cuanto los alumnos respondan aquí van a aparecer las barras.";

  // 3. Tabla de últimas 8 evaluaciones (con protección por si no hay datos)
  // ahora el promedio sale con promedioDe porq las evaluaciones viejas no traian e.promedio y eso hacia q tronara todooo
  const ultimas = evals.slice(-8).reverse();
  buscar("#a-tabla", cont).innerHTML = ultimas.length
    ? ultimas.map(e => {
        const prom = promedioDe(e);
        return `
        <tr>
          <td>${esc(e.fecha) || "—"}</td>
          <td>${esc(e.carrera) || "—"}</td>
          <td>${esc(e.grupo) || "—"}</td>
          <td>${esc(e.profesor) || "—"}</td>
          <td>${esc(e.materia) || "—"}</td>
          <td><span class="nota-prom ${clasePromedio(prom)}">${prom.toFixed(1)}</span></td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="6" class="vacio">Todavía no hay evaluaciones.</td></tr>`;
}
