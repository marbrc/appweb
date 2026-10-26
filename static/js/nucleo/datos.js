// /static/js/nucleo/datos.js
export const leer = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
export const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const obtenerSesion = () => { try { return JSON.parse(localStorage.getItem("sesion")); } catch { return null; } };
export const actualizarSesion = s => localStorage.setItem("sesion", JSON.stringify(s));
export const cerrarSesion = () => localStorage.removeItem("sesion");
export const preferencia = (k, v) => v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v);
export const cambiarTema = t => { document.documentElement.dataset.tema = t; localStorage.setItem("tema", t); };

export const CARRERAS = ["Mecatrónica", "Desarrollo de Software", "Contabilidad"];

const K = {
  grupos: "admin_grupos",
  docentes: "admin_docentes",
  asignaturas: "admin_asignaturas",
  preguntas: "admin_preguntas",
  evaluaciones: "evaluaciones"
};

// Semilla para no arrancar vacío
function semillar() {
  if (!localStorage.getItem(K.grupos)) {
    guardar(K.grupos, [
      { clave: "DSW-1A", carrera: "Desarrollo de Software", cuatrimestre: 1 },
      { clave: "MEC-1A", carrera: "Mecatrónica", cuatrimestre: 1 },
      { clave: "CON-1A", carrera: "Contabilidad", cuatrimestre: 1 }
    ]);
  }
  if (!localStorage.getItem(K.docentes)) {
    guardar(K.docentes, [{ nombre: "Profesor Prueba", correo: "profe@test.com" }]);
  }
  if (!localStorage.getItem(K.asignaturas)) {
    guardar(K.asignaturas, [
      { nombre: "Programación", carrera: "Desarrollo de Software", cuatrimestre: 1 }
    ]);
  }
  if (!localStorage.getItem(K.preguntas)) {
    guardar(K.preguntas, [{ num: 1, texto: "¿El profesor explica bien?" }]);
  }
}
semillar();

export const getGrupos = () => leer(K.grupos);
export const setGrupos = v => guardar(K.grupos, v);
export const getDocentes = () => leer(K.docentes);
export const setDocentes = v => guardar(K.docentes, v);
export const getAsignaturas = () => leer(K.asignaturas);
export const setAsignaturas = v => guardar(K.asignaturas, v);
export const getPreguntas = () => leer(K.preguntas);
export const setPreguntas = v => guardar(K.preguntas, v);
export const getEvaluaciones = () => leer(K.evaluaciones);

export const addEvaluacion = e => {
  const lista = getEvaluaciones();
  lista.push(e);
  guardar(K.evaluaciones, lista);
};

export const getCuatrimestres = carrera => [...new Set(getGrupos().filter(g => g.carrera === carrera).map(g => g.cuatrimestre))].sort((a, b) => a - b);
export const getGruposDe = (carrera, cuatrimestre) => getGrupos().filter(g => g.carrera === carrera && g.cuatrimestre === cuatrimestre);
export const getAsignaturasDe = (carrera, cuatrimestre) => getAsignaturas().filter(a => a.carrera === carrera && a.cuatrimestre === cuatrimestre);

// calificacionesDe, saca las calificaciones de una evaluacion sin importar como se haya guardado
// las nuevas (pantalla del alumno) traen e.calificaciones que es una lista y las viejas (la pagina vieja app.js)
// traian p1 p2 p3 ... p12 sueltas. antes si llegaba una vieja tronaba y el inicio se quedaba en blancooo
export function calificacionesDe(e) {
  if (Array.isArray(e?.calificaciones)) return e.calificaciones.map(Number);
  return Array.from({ length: 12 }, (_, i) => Number(e?.["p" + (i + 1)]) || 0);
}

// promedioDe, el promedio de UNA evaluacion si ya lo trae lo usa y si no lo calcula con sus calificaciones
export function promedioDe(e) {
  if (Number.isFinite(Number(e?.promedio)) && e?.promedio !== undefined && e?.promedio !== null) return Number(e.promedio);
  const lista = calificacionesDe(e).filter(n => n > 0);
  return lista.length ? +(lista.reduce((a, n) => a + n, 0) / lista.length).toFixed(1) : 0;
}

export function promedioGeneral(evals) {
  if (!evals.length) return 0;
  return +(evals.reduce((a, e) => a + promedioDe(e), 0) / evals.length).toFixed(1);
}

export function promedioPorPregunta(evals, num = 12) {
  if (!evals.length) return Array(num).fill(0);
  return Array.from({ length: num }, (_, i) => +(evals.reduce((a, e) => a + (calificacionesDe(e)[i] || 0), 0) / evals.length).toFixed(1));
}

export function evaluacionesDeDocente(nombre) {
  return getEvaluaciones().filter(e => !nombre || e.profesor === nombre);
}

export const getCarrerasConEvaluaciones = () => {
  const evals = getEvaluaciones();
  return [...new Set(evals.map(e => e.carrera))].filter(Boolean).sort();
};