// /static/js/nucleo/datos.js

// ---- Bus de cambios entre pantallas/pestañas ----
const emitir = (clave, valor) => {
  window.dispatchEvent(new CustomEvent("datos:cambio", { detail: { clave, valor } }));
};

window.addEventListener("storage", (e) => {
  if (!e.key) return;
  let valor = [];
  try { valor = JSON.parse(e.newValue) || []; } catch { valor = []; }
  emitir(e.key, valor);
});

export const leer = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };

// claves que viven en el servidor (la sesión y el tema se quedan locales)
const COMPARTIDAS = ["admin_carreras", "admin_grupos", "admin_docentes", "admin_asignaturas",
                     "admin_preguntas", "admin_clases", "evaluaciones"];

// manda una lista completa al servidor (sin bloquear la pantalla)
const subir = (k, v) => fetch("/api/datos/" + k, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(v)
}).catch(() => {});

// Guarda local, avisa a la pantalla y sube al servidor. Las evaluaciones NO se suben
// con PUT, esas entran una por una con addEvaluacion para no pisar las de otros alumnos
export const guardar = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  emitir(k, v);
  if (COMPARTIDAS.includes(k) && k !== "evaluaciones") subir(k, v);
};

// ---- Carga inicial desde el servidor ----
// top-level await: ninguna pantalla arranca hasta que esto termine
try {
  const r = await fetch("/api/datos", { cache: "no-store" });
  if (r.ok) {
    const store = await r.json();
    COMPARTIDAS.forEach(k => {
      if (Array.isArray(store[k])) {
        localStorage.setItem(k, JSON.stringify(store[k]));   // el servidor manda
      } else {
        // el servidor no tiene esta lista todavía: migro la que ya había en este navegador
        const local = localStorage.getItem(k);
        if (local) { try { subir(k, JSON.parse(local)); } catch {} }
      }
    });
  }
} catch { /* sin servidor: se trabaja con lo local */ }

// Suscripción a cambios de una clave. Devuelve función para desuscribirse.
export const alCambiarDatos = (clave, cb) => {
  const handler = (e) => { if (e.detail.clave === clave) cb(e.detail.valor); };
  window.addEventListener("datos:cambio", handler);
  return () => window.removeEventListener("datos:cambio", handler);
};

export const obtenerSesion = () => { try { return JSON.parse(localStorage.getItem("sesion")); } catch { return null; } };
export const actualizarSesion = s => localStorage.setItem("sesion", JSON.stringify(s));
export const cerrarSesion = () => localStorage.removeItem("sesion");
export const preferencia = (k, v) => v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v);
export const cambiarTema = t => { document.documentElement.dataset.tema = t; localStorage.setItem("tema", t); };

export const CARRERAS = ["Mecatrónica", "Desarrollo de Software", "Contabilidad"];

const K = {
  carreras: "admin_carreras",
  grupos: "admin_grupos",
  docentes: "admin_docentes",
  asignaturas: "admin_asignaturas",
  preguntas: "admin_preguntas",
  evaluaciones: "evaluaciones",
  clases: "admin_clases"
};

// Semilla para no arrancar vacío (solo local, NO sube al servidor para que un
// alumno nunca pise el catálogo del admin con datos de prueba)
function semillar() {
  const poner = (k, v) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(v)); };
  poner(K.carreras, ["Desarrollo de Software", "Entornos Virtuales", "Mecatrónica"]);
  poner(K.grupos, [
    { clave: "DSW-1A", carrera: "Desarrollo de Software", cuatrimestre: 1 },
    { clave: "MEC-1A", carrera: "Mecatrónica", cuatrimestre: 1 },
    { clave: "CON-1A", carrera: "Contabilidad", cuatrimestre: 1 }
  ]);
  poner(K.docentes, [{ nombre: "Profesor Prueba", correo: "profe@test.com" }]);
  poner(K.asignaturas, [{ nombre: "Programación", carrera: "Desarrollo de Software", cuatrimestre: 1 }]);
  poner(K.preguntas, [{ num: 1, texto: "¿El profesor explica bien?" }]);
  poner(K.clases, []);
}
semillar();

export const getCarreras = () => leer(K.carreras);
export const setCarreras = v => guardar(K.carreras, v);
export const getGrupos = () => leer(K.grupos);
export const setGrupos = v => guardar(K.grupos, v);
export const getDocentes = () => leer(K.docentes);
export const setDocentes = v => guardar(K.docentes, v);
export const getAsignaturas = () => leer(K.asignaturas);
export const setAsignaturas = v => guardar(K.asignaturas, v);
export const getPreguntas = () => leer(K.preguntas);
export const setPreguntas = v => guardar(K.preguntas, v);
export const getEvaluaciones = () => leer(K.evaluaciones);

// ---- CLASES (Carga Académica) ----
export const getClases = () => leer(K.clases);
export const setClases = v => guardar(K.clases, v);

export const addClase = (clase) => {
  const lista = getClases();
  clase.id = Date.now(); // ID único
  lista.push(clase);
  guardar(K.clases, lista);
};

export const addEvaluacion = e => {
  const lista = getEvaluaciones();
  lista.push(e);
  guardar(K.evaluaciones, lista);   // local
  fetch("/api/evaluaciones", {      // servidor
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(e)
  }).catch(() => {});
};

export const getCuatrimestres = carrera => [...new Set(getGrupos().filter(g => g.carrera === carrera).map(g => g.cuatrimestre))].sort((a, b) => a - b);
export const getGruposDe = (carrera, cuatrimestre) => getGrupos().filter(g => g.carrera === carrera && g.cuatrimestre === cuatrimestre);
export const getAsignaturasDe = (carrera, cuatrimestre) => getAsignaturas().filter(a => a.carrera === carrera && a.cuatrimestre === cuatrimestre);

// calificacionesDe, saca las calificaciones de una evaluacion sin importar como se haya guardado
export function calificacionesDe(e) {
  if (Array.isArray(e?.calificaciones)) return e.calificaciones.map(Number);
  return Array.from({ length: 12 }, (_, i) => Number(e?.["p" + (i + 1)]) || 0);
}

// promedioDe, el promedio de UNA evaluacion si ya lo trae lo usa y si no lo calcula
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