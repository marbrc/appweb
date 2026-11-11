// /static/js/nucleo/datos.js
// el puente entre las pantallas y el servidor: al abrir trae todo de SQL Server y lo deja en localStorage
// para que las pantallas lo lean rapidito, y cuando guardan algo lo sube al servidor
import { avisar } from "./utiles.js";

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
// estas NO se suben con PUT: las preguntas tienen su propia ruta (/api/preguntas) y las evaluaciones
// solo las manda el alumno una por una
const NO_SUBIR = ["admin_preguntas", "evaluaciones"];

const ponerLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// refrescarDatos, vuelve a traer TODO del servidor y avisa a las pantallas
export async function refrescarDatos() {
  try {
    const r = await fetch("/api/datos", { cache: "no-store" });
    if (!r.ok) return false;
    const store = await r.json();
    COMPARTIDAS.forEach(k => {
      if (Array.isArray(store[k])) { ponerLocal(k, store[k]); emitir(k, store[k]); }
    });
    return true;
  } catch { return false; }
}

// manda una lista completa al servidor
// ANTES si el servidor decia que no (por ejemplo borrar un grupo que ya tiene clases) no avisaba nada
// y en la pantalla se veia como si si se hubiera guardado, ahora sale el aviso rojo y se regresa a lo de la BD
const subir = async (k, v) => {
  try {
    const r = await fetch("/api/datos/" + k, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v)
    });
    const json = await r.json().catch(() => ({}));
    if (r.status === 401) { localStorage.removeItem("sesion"); location.replace("/#login"); return; }
    if (!r.ok) throw new Error(json.error || "No se pudo guardar.");
    if (Array.isArray(json.lista)) { ponerLocal(k, json.lista); emitir(k, json.lista); } // asi queda igualito a la BD
    if (json.omitidas?.length) avisar("No se guardaron: " + json.omitidas.join(", ") + " (no hay grupos de esa carrera y cuatrimestre).", "err");
  } catch (e) {
    avisar(e.message.includes("fetch") ? "No se pudo conectar con el servidor." : e.message, "err");
    // regreso los datos a como estan en la BD y vuelvo a abrir la pantalla para que se vea lo real
    if (await refrescarDatos()) window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
};

// Guarda local, avisa a la pantalla y sube al servidor
export const guardar = (k, v) => {
  ponerLocal(k, v);
  emitir(k, v);
  if (COMPARTIDAS.includes(k) && !NO_SUBIR.includes(k)) return subir(k, v);
};

// ---- Carga inicial desde el servidor ----
// top-level await: ninguna pantalla arranca hasta que esto termine
// (ya no hay "semilla" con datos de prueba, todo sale de la base de datos)
if (location.pathname === "/app") await refrescarDatos();

// Suscripción a cambios de una clave. Devuelve función para desuscribirse.
export const alCambiarDatos = (clave, cb) => {
  const handler = (e) => { if (e.detail.clave === clave) cb(e.detail.valor); };
  window.addEventListener("datos:cambio", handler);
  return () => window.removeEventListener("datos:cambio", handler);
};

export const obtenerSesion = () => { try { return JSON.parse(localStorage.getItem("sesion")); } catch { return null; } };
export const actualizarSesion = s => {
  localStorage.setItem("sesion", JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("sesion:cambio")); // para que la barra de arriba cambie la foto y el nombre
};
export const cerrarSesion = () => localStorage.removeItem("sesion");
export const preferencia = (k, v) => v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v);
export const cambiarTema = t => { document.documentElement.dataset.tema = t; localStorage.setItem("tema", t); };

const K = {
  carreras: "admin_carreras",
  grupos: "admin_grupos",
  docentes: "admin_docentes",
  asignaturas: "admin_asignaturas",
  preguntas: "admin_preguntas",
  evaluaciones: "evaluaciones",
  clases: "admin_clases"
};

export const getCarreras = () => leer(K.carreras);
export const setCarreras = v => guardar(K.carreras, v);
export const getGrupos = () => leer(K.grupos);
export const setGrupos = v => guardar(K.grupos, v);
export const getDocentes = () => leer(K.docentes);
export const setDocentes = v => guardar(K.docentes, v);
export const getAsignaturas = () => leer(K.asignaturas);
export const setAsignaturas = v => guardar(K.asignaturas, v);
// todas las preguntas (con las desactivadas) y solo las activas, que son las que contesta el alumno
export const getPreguntas = () => leer(K.preguntas);
export const getPreguntasActivas = () => getPreguntas().filter(p => p.activa !== false);
export const setPreguntas = v => guardar(K.preguntas, v);   // solo local, las guarda preguntas.js con /api/preguntas
export const getEvaluaciones = () => leer(K.evaluaciones);

// ---- CLASES (Carga Académica) ----
export const getClases = () => leer(K.clases);
export const setClases = v => guardar(K.clases, v);

export const addClase = (clase) => {
  const lista = getClases();
  clase.id = Date.now(); // ID único
  lista.push(clase);
  return guardar(K.clases, lista);
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

// promedioPorPregunta, el promedio de cada pregunta
// ahora se busca por el id de la pregunta (e.respuestas) y no por la posicion, asi si mueven
// el orden de las preguntas o desactivan una los reportes no se revuelven
export function promedioPorPregunta(evals, preguntas = getPreguntasActivas()) {
  const lista = Array.isArray(preguntas) ? preguntas : Array.from({ length: preguntas }, (_, i) => ({ num: i + 1 }));
  return lista.map((p, i) => {
    const vals = evals.map(e => p.id !== undefined && e.respuestas ? Number(e.respuestas[p.id]) : calificacionesDe(e)[i])
                      .filter(v => v > 0);
    return vals.length ? +(vals.reduce((a, v) => a + v, 0) / vals.length).toFixed(1) : 0;
  });
}

export function evaluacionesDeDocente(nombre) {
  return getEvaluaciones().filter(e => !nombre || e.profesor === nombre);
}

export const getCarrerasConEvaluaciones = () => {
  const evals = getEvaluaciones();
  return [...new Set(evals.map(e => e.carrera))].filter(Boolean).sort();
};
