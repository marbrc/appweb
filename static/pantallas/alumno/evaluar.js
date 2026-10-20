// /static/pantallas/alumno/evaluar.js
import { buscar, buscarTodos } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  CARRERAS,
  getCuatrimestres, getGruposDe, getDocentes,
  getAsignaturasDe, getPreguntas, addEvaluacion
} from "/static/js/nucleo/datos.js";

let cont = null;
const sel = k => buscar("#f-" + k, cont);

// ---------- opciones dinámicas ----------
const OPC = {
  carrera: () => CARRERAS, // ← carreras estáticas
  cuatri:  () => getCuatrimestres(sel("carrera").value).map(n => `${n}° cuatrimestre`),
  grupo:   () => getGruposDe(
    sel("carrera").value,
    parseInt(sel("cuatri").value)
  ).map(g => g.clave),
  prof:    () => getDocentes().map(d => d.nombre), // ← getDocentes devuelve [{nombre, correo}]
  mat:     () => getAsignaturasDe(
    sel("carrera").value,
    parseInt(sel("cuatri").value)
  ).map(a => a.nombre)
};

const SIG = { carrera: ["cuatri"], cuatri: ["grupo"], grupo: ["prof", "mat"] };

function poner(k, abierto) {
  const s = sel(k);
  s.innerHTML = `<option value="">${abierto ? "Selecciona" : "Elige el campo anterior"}</option>`
              + (abierto ? OPC[k]() : []).map(x => `<option>${x}</option>`).join("");
  s.disabled = !abierto;
}
function limpiar(k) { poner(k, false); (SIG[k] || []).forEach(limpiar); }

function clase() {
  const ok = Object.keys(OPC).every(k => sel(k).value);
  buscar("#preguntas", cont).disabled = !ok;
  buscar("#aviso", cont).hidden = ok;
  buscar("#clase", cont).hidden = !ok;
  if (ok) buscar("#clase", cont).textContent =
    `Evaluando a ${sel("prof").value}, ${sel("mat").value} (grupo ${sel("grupo").value})`;
}

function iniciarFiltros() {
  Object.keys(OPC).forEach(k => poner(k, k === "carrera"));
  Object.keys(OPC).forEach(k => {
    const s = sel(k);
    const clon = s.cloneNode(true);
    s.replaceWith(clon);
    clon.addEventListener("change", () => {
      (SIG[k] || []).forEach(limpiar);
      if (clon.value) (SIG[k] || []).forEach(n => poner(n, true));
      clase();
    });
  });
  clase();
}

// ---------- preguntas dinámicas ----------
function pintarPreguntas() {
  const preguntas = getPreguntas();
  buscar("#preguntas", cont).innerHTML = preguntas.map((p, i) => `
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
  const total = getPreguntas().length;
  const n = buscarTodos("#preguntas input:checked", cont).length;
  buscar("#cuenta-eval", cont).textContent = `${n} de ${total} respondidas`;
  buscar(".prog i", cont).style.width = (n / total * 100) + "%";
}

// ---------- guardar ----------
function guardarEvaluacion(form) {
  const datos = Object.fromEntries(new FormData(form));
  const total = getPreguntas().length;
  const califs = Array.from({ length: total }, (_, i) => Number(datos["p" + (i + 1)]));

  const registro = {
    fecha: new Date().toLocaleDateString("es-MX"),
    carrera: sel("carrera").value,
    cuatrimestre: sel("cuatri").value,
    grupo: sel("grupo").value,
    profesor: sel("prof").value,
    materia: sel("mat").value,
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
  iniciarFiltros();
  cuenta();

  buscar("#preguntas", cont).addEventListener("change", cuenta);

  buscar("#form-eval", cont).addEventListener("submit", e => {
    e.preventDefault();
    if (!Object.keys(OPC).every(k => sel(k).value)) return;

    guardarEvaluacion(e.target);
    e.target.reset();
    pintarPreguntas();
    iniciarFiltros();
    cuenta();
    buscar("#form-eval", cont).hidden = true;
    buscar("#gracias", cont).hidden = false;
  });
}