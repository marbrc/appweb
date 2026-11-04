// /static/pantallas/alumno/evaluar.js
import { buscar, buscarTodos } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  obtenerSesion, getClases, getPreguntas, addEvaluacion
} from "/static/js/nucleo/datos.js";

let cont = null;
let sesion = null; // lo que guardó el código: grupo, carrera, cuatri
const sel = k => buscar("#f-" + k, cont);

// pintarGrupo, los datos salen del código con el que entró el alumno
function pintarGrupo() {
  buscar("#g-grupo", cont).textContent = sesion.grupo;
  buscar("#g-carrera", cont).textContent = sesion.carrera;
  buscar("#g-cuatri", cont).textContent = sesion.cuatri + "° cuatrimestre";
}

function cargarClases() {
  const sClase = sel("clase");
  if (!sClase) return;

  const clases = (getClases() || []).filter(c => c.grupoId === sesion.grupo);

  if (clases.length === 0) {
    sClase.innerHTML = `<option value="">No hay clases asignadas a este grupo</option>`;
    sClase.disabled = true;
  } else {
    sClase.innerHTML = `<option value="">Selecciona materia y profesor</option>` +
      clases.map(cl => `<option value="${cl.asignaturaId}|${cl.docenteId}">${cl.asignaturaId} - ${cl.docenteId}</option>`).join("");
    sClase.disabled = false;
  }
  verificarFormulario();
}

function verificarFormulario() {
  const ok = sel("clase")?.value;

  const preguntasFieldset = buscar("#preguntas", cont);
  if (preguntasFieldset) preguntasFieldset.disabled = !ok;

  const aviso = buscar("#aviso", cont);
  if (aviso) aviso.hidden = ok;

  const claseInfo = buscar("#clase-info", cont);
  if (claseInfo) {
    claseInfo.hidden = !ok;
    if (ok) {
      const [materia, profe] = sel("clase").value.split("|");
      claseInfo.textContent = `Evaluando a ${profe}, en la materia ${materia} (grupo ${sesion.grupo})`;
    }
  }
}

// ---------- preguntas dinámicas ----------
function pintarPreguntas() {
  const preguntas = getPreguntas() || [];
  const fieldset = buscar("#preguntas", cont);
  if (!fieldset) return;
  
  fieldset.innerHTML = preguntas.map((p, i) => `
    <fieldset>
      <legend>${p.num}. ${p.texto}</legend>
      <div class="esc">${
        Array.from({ length: 6 }, (_, k) => `
          <label>
            <input type="radio" name="p${i + 1}" value="${k + 5}" required>
            <span>${k + 5}</span>
          </label>`).join("")
      }</div>
    </fieldset>`).join("");
}

function cuenta() {
  const total = (getPreguntas() || []).length;
  const n = buscarTodos("#preguntas input:checked", cont).length;
  const cuentaEl = buscar("#cuenta-eval", cont);
  const progEl = buscar(".prog i", cont);
  
  if (cuentaEl) cuentaEl.textContent = `${n} de ${total} respondidas`;
  if (progEl) progEl.style.width = total > 0 ? (n / total * 100) + "%" : "0%";
}

// ---------- guardar ----------
function guardarEvaluacion(form) {
  const datos = Object.fromEntries(new FormData(form));
  const total = (getPreguntas() || []).length;
  const califs = Array.from({ length: total }, (_, i) => Number(datos["p" + (i + 1)]));
  
  const [materia, profesor] = sel("clase").value.split("|");

  const registro = {
    fecha: new Date().toLocaleDateString("es-MX"),
    carrera: sesion.carrera,
    cuatrimestre: Number(sesion.cuatri),
    grupo: sesion.grupo,
    profesor: profesor, 
    materia: materia,   
    calificaciones: califs,
    promedio: +(califs.reduce((a, b) => a + b, 0) / califs.length).toFixed(1),
    comentario: (datos.comentario || "").trim()
  };

  addEvaluacion(registro);
  return registro;
}

// ---------- arranque ----------
export function iniciar(contenedor) {
  cont = contenedor;
  sesion = obtenerSesion();

  // sin código no se puede evaluar, regresa a la entrada del alumno
  if (!sesion?.codigo || !sesion.grupo) { location.replace("/alumno"); return; }

  pintarIconos(cont);

  pintarGrupo();
  pintarPreguntas();
  cargarClases();
  cuenta();

  const sClase = sel("clase");
  if (sClase) sClase.onchange = verificarFormulario;

  const preguntasEl = buscar("#preguntas", cont);
  if (preguntasEl) preguntasEl.addEventListener("change", cuenta);

  const formEl = buscar("#form-eval", cont);
  if (formEl) {
    formEl.addEventListener("submit", e => {
      e.preventDefault();
      if (!sel("clase")?.value) return;

      guardarEvaluacion(e.target);
      e.target.reset();
      pintarPreguntas();
      cargarClases(); // para resetear el select
      cuenta();

      formEl.hidden = true;
      const gracias = buscar("#gracias", cont);
      if (gracias) gracias.hidden = false;
    });
  }
}