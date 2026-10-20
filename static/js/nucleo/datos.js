// /static/js/nucleo/datos.js
// EL ÚNICO archivo que toca el almacenamiento.
// Ahorita todo es local (de prueba). Cuando haya base de datos,
// SOLO se cambia este archivo y las pantallas no se enteran.

// ---------- helpers base ----------
export const leer = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
export const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ---------- sesión ----------
export const obtenerSesion = () => { try { return JSON.parse(localStorage.getItem("sesion")); } catch { return null; } };
export const actualizarSesion = s => localStorage.setItem("sesion", JSON.stringify(s));
export const cerrarSesion = () => localStorage.removeItem("sesion");

// ---------- preferencias ----------
export const preferencia = (k, v) => v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v);
export const cambiarTema = t => {
  document.documentElement.dataset.tema = t;
  localStorage.setItem("tema", t);
};

// =====================================================================
// CARRERAS ESTÁTICAS (no se editan desde el admin)
// =====================================================================
export const CARRERAS = ["Mecatrónica", "Desarrollo de Software", "Contabilidad"];

// =====================================================================
// CLAVES DE ALMACENAMIENTO
// =====================================================================
const K = {
  grupos:      "admin_grupos",
  docentes:    "admin_docentes",
  asignaturas: "admin_asignaturas",
  preguntas:   "admin_preguntas",
  evaluaciones:"evaluaciones"
};

// =====================================================================
// SEMILLA (solo la primera vez, con relaciones coherentes)
// =====================================================================
function semillar() {
  if (!localStorage.getItem(K.grupos)) {
    guardar(K.grupos, [
      // Desarrollo de Software
      { clave: "DSW-1A", carrera: "Desarrollo de Software", cuatrimestre: 1 },
      { clave: "DSW-2A", carrera: "Desarrollo de Software", cuatrimestre: 2 },
      { clave: "DSW-3A", carrera: "Desarrollo de Software", cuatrimestre: 3 },
      // Mecatrónica
      { clave: "MEC-1A", carrera: "Mecatrónica", cuatrimestre: 1 },
      { clave: "MEC-2A", carrera: "Mecatrónica", cuatrimestre: 2 },
      // Contabilidad
      { clave: "CON-1A", carrera: "Contabilidad", cuatrimestre: 1 },
      { clave: "CON-2A", carrera: "Contabilidad", cuatrimestre: 2 }
    ]);
  }
  if (!localStorage.getItem(K.docentes)) {
    guardar(K.docentes, [
      { nombre: "Vazquez Juarez Erika",       correo: "erika@utng.edu.mx" },
      { nombre: "Sustaita Cruces Daniel",     correo: "daniel@utng.edu.mx" },
      { nombre: "Rodriguez Garcia Anastacio", correo: "anastacio@utng.edu.mx" },
      { nombre: "Hernández Monzón Verónica",  correo: "veronica@utng.edu.mx" }
    ]);
  }
  if (!localStorage.getItem(K.asignaturas)) {
    guardar(K.asignaturas, [
      // Desarrollo de Software
      { nombre: "Programación Estructurada", carrera: "Desarrollo de Software", cuatrimestre: 1 },
      { nombre: "Cálculo",                   carrera: "Desarrollo de Software", cuatrimestre: 1 },
      { nombre: "Bases de datos",            carrera: "Desarrollo de Software", cuatrimestre: 2 },
      { nombre: "Inglés",                    carrera: "Desarrollo de Software", cuatrimestre: 2 },
      { nombre: "Redes",                     carrera: "Desarrollo de Software", cuatrimestre: 3 },
      // Mecatrónica
      { nombre: "Electrónica",               carrera: "Mecatrónica", cuatrimestre: 1 },
      { nombre: "Física",                    carrera: "Mecatrónica", cuatrimestre: 1 },
      { nombre: "Programación",              carrera: "Mecatrónica", cuatrimestre: 2 },
      // Contabilidad
      { nombre: "Contabilidad Básica",       carrera: "Contabilidad", cuatrimestre: 1 },
      { nombre: "Matemáticas Financieras",   carrera: "Contabilidad", cuatrimestre: 2 }
    ]);
  }
  if (!localStorage.getItem(K.preguntas)) {
    guardar(K.preguntas, [
      { num: 1,  texto: "El profesor expone los contenidos y prácticas de su asignatura de manera clara, gradual y congruente." },
      { num: 2,  texto: "El profesor proporciona orientación y apoyo a los alumnos con problemas de aprendizaje." },
      { num: 3,  texto: "Propicia un ambiente de confianza y de participación durante la clase." },
      { num: 4,  texto: "Establece controles de evaluación del aprendizaje considerando: exámenes parciales, participación, trabajos, prácticas, etc." },
      { num: 5,  texto: "El profesor da seguimiento al programa, considerando los propósitos y contenidos, a fin de lograr el saber, el saber hacer y el saber ser." },
      { num: 6,  texto: "El profesor emplea métodos didácticos (gráficas, folletos, acetatos, ilustraciones, dinámicas de grupo o trabajos en equipo) para facilitar la comprensión de los temas." },
      { num: 7,  texto: "El profesor proporciona mayores referencias sobre los temas que se les dificulta a los alumnos." },
      { num: 8,  texto: "El profesor responde todas las preguntas formuladas por los alumnos." },
      { num: 9,  texto: "El profesor muestra disposición para atender a los alumnos dentro y fuera de clase para resolver y aclarar preguntas o dudas en temas que te interesen." },
      { num: 10, texto: "El nivel de dificultad de los ejemplos de clase es congruente con el de los exámenes." },
      { num: 11, texto: "El profesor entra a tiempo a clase." },
      { num: 12, texto: "El profesor fomenta el auto-aprendizaje o actividades de lectura." }
    ]);
  }
}
semillar();

// =====================================================================
// CRUD CATÁLOGOS
// =====================================================================
export const getGrupos      = () => leer(K.grupos);
export const setGrupos      = v => guardar(K.grupos, v);

export const getDocentes    = () => leer(K.docentes);
export const setDocentes    = v => guardar(K.docentes, v);

export const getAsignaturas = () => leer(K.asignaturas);
export const setAsignaturas = v => guardar(K.asignaturas, v);

export const getPreguntas   = () => leer(K.preguntas);
export const setPreguntas   = v => guardar(K.preguntas, v);

// =====================================================================
// EVALUACIONES (respuestas del alumno)
// =====================================================================
export const getEvaluaciones = () => leer(K.evaluaciones);
export const addEvaluacion = e => {
  const lista = getEvaluaciones();
  lista.push(e);
  guardar(K.evaluaciones, lista);
  return e;
};

// =====================================================================
// RELACIONES (carrera → cuatrimestre → grupo / asignatura)
// =====================================================================

// cuatrimestres que existen en los grupos de una carrera
export const getCuatrimestres = carrera =>
  [...new Set(getGrupos().filter(g => g.carrera === carrera).map(g => g.cuatrimestre))]
    .sort((a, b) => a - b);

// grupos de una carrera y cuatrimestre
export const getGruposDe = (carrera, cuatrimestre) =>
  getGrupos().filter(g => g.carrera === carrera && g.cuatrimestre === cuatrimestre);

// asignaturas de una carrera y cuatrimestre
export const getAsignaturasDe = (carrera, cuatrimestre) =>
  getAsignaturas().filter(a => a.carrera === carrera && a.cuatrimestre === cuatrimestre);

// todos los docentes (se filtran en el alumno)
export const getDocentesTodos = () => getDocentes().map(d => d.nombre);

// =====================================================================
// HELPERS DE REPORTES
// =====================================================================
export function promedioGeneral(evals) {
  if (!evals.length) return 0;
  return +(evals.reduce((a, e) => a + e.promedio, 0) / evals.length).toFixed(1);
}

export function promedioPorPregunta(evals, numPreguntas = 12) {
  if (!evals.length) return Array(numPreguntas).fill(0);
  return Array.from({ length: numPreguntas }, (_, i) =>
    +(evals.reduce((a, e) => a + (e.calificaciones[i] || 0), 0) / evals.length).toFixed(1)
  );
}

// evaluaciones de un docente (filtradas por nombre)
export function evaluacionesDeDocente(nombre) {
  return getEvaluaciones().filter(e => !nombre || e.profesor === nombre);
}