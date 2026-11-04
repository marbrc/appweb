// /static/pantallas/alumno/evaluar.js
import { buscar, buscarTodos } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  obtenerSesion, getClases, getDocentes, getPreguntas, addEvaluacion, leer, guardar
} from "/static/js/nucleo/datos.js";

const MAX_COMENTARIO = 250;
const K_PARTICIPACIONES = "participaciones"; // una por cada clase evaluada con un código

let cont = null;
let sesion = null; // lo que guardó el código: grupo, carrera, cuatri
const sel = k => buscar("#f-" + k, cont);

// yaEvaluada, ¿este navegador ya mandó la evaluación de esa clase con este código?
const yaEvaluada = (materia, profesor) => leer(K_PARTICIPACIONES).some(p =>
  p.codigo === sesion.codigo && p.grupo === sesion.grupo && p.materia === materia && p.profesor === profesor);

// pintarGrupo, los datos salen del código con el que entró el alumno
function pintarGrupo() {
  buscar("#g-grupo", cont).textContent = sesion.grupo;
  buscar("#g-carrera", cont).textContent = sesion.carrera;
  buscar("#g-cuatri", cont).textContent = sesion.cuatri + "° cuatrimestre";
}

// ---------- profesor y materia ----------
// el docente se guarda con su correo o su nombre, aquí se busca el nombre para mostrarlo
const nombreDocente = id => (getDocentes() || []).find(d => (d.correo || d.nombre) === id)?.nombre || id;

// las clases del grupo del alumno (el del código con el que entró)
const clasesDelGrupo = () => (getClases() || []).filter(c => c.grupoId === sesion.grupo);

function cargarProfesores() {
  const s = sel("profesor");
  const clases = clasesDelGrupo();
  // cada profesor sale una sola vez, aunque dé varias materias
  const ids = [...new Set(clases.map(c => c.docenteId))];

  if (!ids.length) {
    s.innerHTML = `<option value="">Este grupo todavía no tiene clases asignadas</option>`;
    s.disabled = true;
  } else {
    s.innerHTML = `<option value="">Selecciona profesor</option>` + ids.map(id => {
      const materias = clases.filter(c => c.docenteId === id);
      const hechas = materias.filter(c => yaEvaluada(c.asignaturaId, id)).length;
      const marca = hechas === materias.length ? " (ya evaluado)" : "";
      return `<option value="${id}">${nombreDocente(id)}${marca}</option>`;
    }).join("");
    s.disabled = false;
  }
  cargarMaterias();
}

function cargarMaterias() {
  const sProf = sel("profesor"), sMat = sel("materia");
  const prof = sProf.value;
  const materias = prof ? clasesDelGrupo().filter(c => c.docenteId === prof).map(c => c.asignaturaId) : [];

  // la lista solo se muestra si ese profesor da más de una materia
  sMat.hidden = materias.length < 2;
  if (materias.length >= 2) {
    sMat.innerHTML = `<option value="">Selecciona materia</option>` + materias.map(m =>
      `<option value="${m}">${m}${yaEvaluada(m, prof) ? " (ya evaluada)" : ""}</option>`).join("");
  } else {
    // con una sola materia (o ninguna) se pone sola
    sMat.innerHTML = materias.length ? `<option value="${materias[0]}">${materias[0]}</option>` : "";
    sMat.value = materias[0] || "";
  }
  verificarFormulario();
}

// la clase elegida { profesor, materia } o null si falta algo
function claseElegida() {
  const profesor = sel("profesor").value, materia = sel("materia").value;
  return profesor && materia ? { profesor, materia } : null;
}

function verificarFormulario() {
  const clase = claseElegida();
  const repetida = !!clase && yaEvaluada(clase.materia, clase.profesor);
  const ok = !!clase && !repetida;

  buscar("#preguntas", cont).disabled = !ok;
  buscar("button[type=submit]", cont).disabled = !ok;

  const aviso = buscar("#aviso", cont);
  aviso.hidden = ok;
  if (repetida) aviso.textContent = "Ya evaluaste esta clase. Solo se puede evaluar una vez, elige otra.";
  else if (sel("profesor").value) aviso.textContent = "Elige la materia que vas a evaluar.";
  else aviso.textContent = "Elige al profesor que vas a evaluar.";

  const info = buscar("#clase-info", cont);
  info.hidden = !clase;
  if (clase) info.textContent = `Evaluando a ${nombreDocente(clase.profesor)}, en la materia ${clase.materia} (grupo ${sesion.grupo})`;
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

  const { materia, profesor } = claseElegida();

  const registro = {
    fecha: new Date().toLocaleDateString("es-MX"),
    carrera: sesion.carrera,
    cuatrimestre: Number(sesion.cuatri), // ahora sí se guarda en cada evaluación
    grupo: sesion.grupo,
    profesor: profesor,
    materia: materia,
    calificaciones: califs,
    promedio: +(califs.reduce((a, b) => a + b, 0) / califs.length).toFixed(1),
    comentario: (datos.comentario || "").trim().slice(0, MAX_COMENTARIO)
  };

  addEvaluacion(registro);

  // la participación va ligada al código y a la clase, NO al alumno (sigue siendo anónimo)
  guardar(K_PARTICIPACIONES, [...leer(K_PARTICIPACIONES),
    { codigo: sesion.codigo, grupo: sesion.grupo, materia, profesor }]);
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
  cargarProfesores();
  cuenta();

  sel("profesor").onchange = cargarMaterias;
  sel("materia").onchange = verificarFormulario;

  const preguntasEl = buscar("#preguntas", cont);
  if (preguntasEl) preguntasEl.addEventListener("change", cuenta);

  // contador del comentario (máximo 250)
  const coment = buscar("textarea[name=comentario]", cont);
  coment.maxLength = MAX_COMENTARIO;
  coment.addEventListener("input", () => {
    buscar("#cuenta-coment", cont).textContent = `${coment.value.length} / ${MAX_COMENTARIO}`;
  });

  const formEl = buscar("#form-eval", cont);
  formEl.addEventListener("submit", e => {
    e.preventDefault();
    const clase = claseElegida();
    // la doble evaluación se revisa otra vez aquí, no solo al elegir
    if (!clase || yaEvaluada(clase.materia, clase.profesor)) return verificarFormulario();

    guardarEvaluacion(e.target);
    formEl.hidden = true;
    sel("profesor").parentElement.hidden = true;
    buscar("#aviso", cont).hidden = true;
    buscar("#clase-info", cont).hidden = true;
    buscar("#gracias", cont).hidden = false;
  });

  // evaluar a otro profesor del mismo grupo
  buscar("#otra", cont).onclick = () => {
    formEl.reset();
    formEl.hidden = false;
    sel("profesor").parentElement.hidden = false;
    buscar("#gracias", cont).hidden = true;
    buscar("#cuenta-coment", cont).textContent = `0 / ${MAX_COMENTARIO}`;
    pintarPreguntas();
    cargarProfesores();
    cuenta();
  };
}