// /static/pantallas/docente/datos-docente.js
import { getEvaluaciones, getPreguntas, obtenerSesion } from "/static/js/nucleo/datos.js";

// Obtenemos las preguntas actuales de la encuesta
export const PREG = getPreguntas().map(p => p.texto);

// Buscamos las evaluaciones reales del docente
export function evaluacionesDelDocente() {
  const sesion = obtenerSesion() || {};
  const nombre = sesion.nombre || "";
  
  // Filtramos las evaluaciones donde el nombre del profesor coincida exactamente
  return getEvaluaciones().filter(e => !nombre || e.profesor === nombre);
}

// Datos de ejemplo (solo para pruebas si el docente no tiene evaluaciones)
const EJEMPLO = [
  {
    fecha: "19/10/2026",
    carrera: "Desarrollo de Software",
    cuatrimestre: "2° cuatrimestre",
    grupo: "DSW-2A",
    profesor: "Apolibar Emma",
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
    profesor: "Apolibar Emma",
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