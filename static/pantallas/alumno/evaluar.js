// /static/pantallas/alumno/evaluar.js
import { buscar, buscarTodos } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  getCarreras, getGrupos, getClases, getPreguntas, addEvaluacion
} from "/static/js/nucleo/datos.js";

let cont = null;
const sel = k => buscar("#f-" + k, cont);

// ---------- armar selects ----------
function cargarCarreras() {
  const s = sel("carrera");
  if (!s) return;
  const carreras = getCarreras() || [];
  s.innerHTML = `<option value="">Selecciona carrera</option>` + 
    carreras.map(c => `<option value="${c}">${c}</option>`).join("");
  s.disabled = false;
}

function cargarGrupos() {
  const sCarrera = sel("carrera");
  const sGrupo = sel("grupo");
  const sClase = sel("clase");
  
  if (!sCarrera || !sGrupo || !sClase) return;

  const carrera = sCarrera.value;
  
  if (carrera) {
    const grupos = (getGrupos() || []).filter(g => g.carrera === carrera).map(g => g.clave);
    sGrupo.innerHTML = `<option value="">Selecciona grupo</option>` + 
      grupos.map(x => `<option value="${x}">${x}</option>`).join("");
    sGrupo.disabled = false;
  } else {
    sGrupo.innerHTML = `<option value="">Elige carrera primero</option>`;
    sGrupo.disabled = true;
  }

  // Al cambiar la carrera, reseteamos la clase
  sClase.innerHTML = `<option value="">Elige grupo primero</option>`;
  sClase.disabled = true;
  
  verificarFormulario();
}

function cargarClases() {
  const sGrupo = sel("grupo");
  const sClase = sel("clase");
  
  if (!sGrupo || !sClase) return;

  const grupo = sGrupo.value;

  if (grupo) {
    const clases = (getClases() || []).filter(c => c.grupoId === grupo);
    
    if (clases.length === 0) {
      sClase.innerHTML = `<option value="">No hay clases asignadas a este grupo</option>`;
    } else {
      sClase.innerHTML = `<option value="">Selecciona materia y profesor</option>` + 
        clases.map(cl => `<option value="${cl.asignaturaId}|${cl.docenteId}">${cl.asignaturaId} - ${cl.docenteId}</option>`).join("");
    }
    sClase.disabled = false;
  } else {
    sClase.innerHTML = `<option value="">Elige grupo primero</option>`;
    sClase.disabled = true;
  }

  verificarFormulario();
}

function verificarFormulario() {
  const ok = sel("carrera")?.value && sel("grupo")?.value && sel("clase")?.value;
  
  const preguntasFieldset = buscar("#preguntas", cont);
  if (preguntasFieldset) preguntasFieldset.disabled = !ok;
  
  const aviso = buscar("#aviso", cont);
  if (aviso) aviso.hidden = ok;
  
  const claseInfo = buscar("#clase-info", cont);
  if (claseInfo) {
    claseInfo.hidden = !ok;
    if (ok) {
      const [materia, profe] = sel("clase").value.split("|");
      claseInfo.textContent = `Evaluando a ${profe}, en la materia ${materia} (grupo ${sel("grupo").value})`;
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
    carrera: sel("carrera").value,
    cuatrimestre: "", 
    grupo: sel("grupo").value,
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
  pintarIconos(cont);

  pintarPreguntas();
  cargarCarreras();
  cuenta();

  // Asignar los eventos de cambio
  const sCarrera = sel("carrera");
  const sGrupo = sel("grupo");
  const sClase = sel("clase");

  if (sCarrera) sCarrera.onchange = cargarGrupos;
  if (sGrupo) sGrupo.onchange = cargarClases;
  if (sClase) sClase.onchange = verificarFormulario;

  const preguntasEl = buscar("#preguntas", cont);
  if (preguntasEl) preguntasEl.addEventListener("change", cuenta);

  const formEl = buscar("#form-eval", cont);
  if (formEl) {
    formEl.addEventListener("submit", e => {
      e.preventDefault();
      if (!sel("carrera")?.value || !sel("grupo")?.value || !sel("clase")?.value) return;

      guardarEvaluacion(e.target);
      e.target.reset();
      pintarPreguntas();
      cargarCarreras();
      cargarGrupos(); // Para resetear los selects
      cuenta();
      
      formEl.hidden = true;
      const gracias = buscar("#gracias", cont);
      if (gracias) gracias.hidden = false;
    });
  }
}