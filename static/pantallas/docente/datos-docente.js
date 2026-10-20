// /static/pantallas/docente/datos-docente.js
// Lee las evaluaciones del docente logueado.
import { getEvaluaciones, getPreguntas, obtenerSesion } from "/static/js/nucleo/datos.js";

export const PREG = getPreguntas().map(p => p.texto);

export function evaluacionesDelDocente() {
  const s = obtenerSesion() || {};
  const nombre = s.nombre || "";
  return getEvaluaciones().filter(e => !nombre || e.profesor === nombre);
}

// datos de ejemplo (solo si NO hay evaluaciones reales para ese docente)
const EJEMPLO = [
  {
    fecha: "19/10/2026",
    carrera: "Desarrollo de Software",
    cuatrimestre: "2° cuatrimestre",
    grupo: "DSW-2A",
    profesor: "Vazquez Juarez Erika",
    materia: "Bases de datos",
    calificaciones: [9, 9, 9, 9, 9, 9, 9, 9, 8, 8, 8, 8],
    promedio: 8.8,
    comentario: "Que proporcione más ejercicios"
  },
  {
    fecha: "18/10/2026",
    carrera: "Desarrollo de Software",
    cuatrimestre: "2° cuatrimestre",
    grupo: "DSW-2A",
    profesor: "Vazquez Juarez Erika",
    materia: "Bases de datos",
    calificaciones: [10, 10, 9, 10, 10, 10, 10, 10, 9, 9, 10, 10],
    promedio: 9.75,
    comentario: "Siga así, es muy buena profesora"
  }
];

export function evaluacionesDelDocenteConEjemplo() {
  const reales = evaluacionesDelDocente();
  return reales.length ? reales : EJEMPLO;
}