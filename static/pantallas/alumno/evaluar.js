// /static/pantallas/alumno/evaluar.js
// Vista de evaluación del alumno:
//  - filtros en cascada (carrera → cuatrimestre → grupo → prof/materia)
//  - 12 preguntas con botones del 5 al 10
//  - barra de progreso
//  - guarda la evaluación de forma anónima (localStorage por ahora)
import { buscar, buscarTodos } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";

// ---------- DATOS (de momento locales; luego vienen del backend) ----------

const PREG = [
  "El profesor expone los contenidos y prácticas de su asignatura de manera clara, gradual y congruente.",
  "El profesor proporciona orientación y apoyo a los alumnos con problemas de aprendizaje.",
  "Propicia un ambiente de confianza y de participación durante la clase.",
  "Establece controles de evaluación del aprendizaje considerando: exámenes parciales, participación, trabajos, prácticas, etc.",
  "El profesor da seguimiento al programa, considerando los propósitos y contenidos, a fin de lograr el saber, el saber hacer y el saber ser.",
  "El profesor emplea métodos didácticos (gráficas, folletos, acetatos, ilustraciones, dinámicas de grupo o trabajos en equipo) para facilitar la comprensión de los temas.",
  "El profesor proporciona mayores referencias sobre los temas que se les dificulta a los alumnos.",
  "El profesor responde todas las preguntas formuladas por los alumnos.",
  "El profesor muestra disposición para atender a los alumnos dentro y fuera de clase para resolver y aclarar preguntas o dudas en temas que te interesen.",
  "El nivel de dificultad de los ejemplos de clase es congruente con el de los exámenes.",
  "El profesor entra a tiempo a clase.",
  "El profesor fomenta el auto-aprendizaje o actividades de lectura."
];

const CARRERAS = {
  "Desarrollo de Software": {
    materias: { 1: ["Programación Estructurada", "Calculo de varias variables"], 2: ["Bases de datos", "Ingles"], 3: ["Redes", "Estadística"] },
    grupos:   { 1: ["GTRD321", "GTID143"], 2: ["GTID321", "GT1IDW32"], 3: ["GTID456"] }
  },
  "Entornos virtuales": {
    materias: { 1: ["Fisica", "Calculo Diferencial"], 2: ["Redes", "Ingle"] },
    grupos:   { 1: ["GTID432"], 2: ["GTID123"] }
  },
  "Mecatrónica": {
    materias: { 1: ["Electrónica", "Física"], 2: ["Programación", "Idioma Extranjero"] },
    grupos:   { 1: ["GTID342"], 2: ["GTID341"] }
  }
};

const PROFESORES = [
  "Vazquez Juarez Erika",
  "Sustaita Cruces Daniel",
  "Rodriguez Garcia Anastacio",
  "Hernández Monzón Verónica"
];

// ---------- ALMACENAMIENTO LOCAL ----------

const leer = k => {
  try { return JSON.parse(localStorage.getItem(k)) || []; }
  catch { return []; }
};

const guardar = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); }
  catch {}
};

// ---------- ESTADO DE LA VISTA ----------

let cont = null; // contenedor que nos pasa el router

const sel = k => buscar("#f-" + k, cont);

// qué filtros se abren después de elegir uno
const SIG = { carrera: ["cuatri"], cuatri: ["grupo"], grupo: ["prof", "mat"] };

// opciones de cada filtro
const OPC = {
  carrera: () => Object.keys(CARRERAS),
  cuatri:  () => Object.keys(CARRERAS[sel("carrera").value].materias).map(n => `${n}° cuatrimestre`),
  grupo:   () => CARRERAS[sel("carrera").value].grupos[parseInt(sel("cuatri").value)] || [],
  prof:    () => PROFESORES,
  mat:     () => CARRERAS[sel("carrera").value].materias[parseInt(sel("cuatri").value)] || []
};

// ---------- FILTROS EN CASCADA ----------

function poner(k, abierto) {
  const s = sel(k);
  s.innerHTML = `<option value="">${abierto ? "Selecciona" : "Elige el campo anterior"}</option>`
              + (abierto ? OPC[k]() : []).map(x => `<option>${x}</option>`).join("");
  s.disabled = !abierto;
}

function limpiar(k) {
  poner(k, false);
  (SIG[k] || []).forEach(limpiar);
}

function clase() {
  const ok = Object.keys(OPC).every(k => sel(k).value);
  buscar("#preguntas", cont).disabled = !ok;
  buscar("#aviso", cont).hidden = ok;
  buscar("#clase", cont).hidden = !ok;
  if (ok) {
    buscar("#clase", cont).textContent =
      `Evaluando a ${sel("prof").value}, ${sel("mat").value} (grupo ${sel("grupo").value})`;
  }
}

function iniciarFiltros() {
  // deja todos los filtros en su estado inicial
  Object.keys(OPC).forEach(k => poner(k, k === "carrera"));

  // conecta el "change" de cada filtro (clonando para no duplicar listeners)
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

// ---------- LAS 12 PREGUNTAS ----------

function pintarPreguntas() {
  buscar("#preguntas", cont).innerHTML = PREG.map((q, i) => `
    <fieldset>
      <legend>${i + 1}. ${q}</legend>
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
  const n = buscarTodos("#preguntas input:checked", cont).length;
  buscar("#cuenta-eval", cont).textContent = n + " de 12 respondidas";
  buscar(".prog i", cont).style.width = (n / 12 * 100) + "%";
}

// ---------- GUARDAR (ANÓNIMO) ----------

function guardarEvaluacion(form) {
  const datos = Object.fromEntries(new FormData(form));

  // arma el arreglo de 12 calificaciones en orden p1..p12
  const califs = Array.from({ length: 12 }, (_, i) => Number(datos["p" + (i + 1)]));

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
    // NO se guarda nada del alumno: es anónimo
  };

  guardar("evaluaciones", [...leer("evaluaciones"), registro]);
  return registro;
}

// ---------- ARRANQUE (lo llama el router) ----------

export function iniciar(contenedor) {
  cont = contenedor;

  // iconos dentro de esta vista (si no hay ninguno, no pasa nada)
  pintarIconos(cont);

  pintarPreguntas();
  iniciarFiltros();
  cuenta();

  // cada vez que el alumno contesta algo, se actualiza la cuenta
  buscar("#preguntas", cont).addEventListener("change", cuenta);

  // enviar la evaluación
  buscar("#form-eval", cont).addEventListener("submit", e => {
    e.preventDefault();

    // seguridad: que los 5 filtros estén llenos
    if (!Object.keys(OPC).every(k => sel(k).value)) return;

    guardarEvaluacion(e.target);

    // limpia y regresa al estado inicial
    e.target.reset();
    iniciarFiltros();
    cuenta();
    buscar("#form-eval", cont).hidden = true;
    buscar("#gracias", cont).hidden = false;
  });
}