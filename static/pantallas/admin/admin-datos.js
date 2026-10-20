// /static/pantallas/admin/datos-admin.js
// Datos compartidos por las pantallas del administrador.
// Lee de localStorage (mientras no hay backend) y expone CRUD sencillo.

export const PREG = [
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

// ---------- almacenamiento ----------
const leer = (k, def) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? def; }
  catch { return def; }
};
const guardar = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ---------- semilla inicial (solo la primera vez) ----------
function semillar() {
  if (!localStorage.getItem("admin_grupos")) {
    guardar("admin_grupos", [
      { clave: "GTRD321", carrera: "Desarrollo de Software", cuatrimestre: 1 },
      { clave: "GTID143", carrera: "Desarrollo de Software", cuatrimestre: 1 },
      { clave: "GTID321", carrera: "Desarrollo de Software", cuatrimestre: 2 },
      { clave: "GTID456", carrera: "Desarrollo de Software", cuatrimestre: 3 },
      { clave: "GTID432", carrera: "Entornos virtuales",    cuatrimestre: 1 },
      { clave: "GTID123", carrera: "Entornos virtuales",    cuatrimestre: 2 },
      { clave: "GTID342", carrera: "Mecatrónica",           cuatrimestre: 1 },
      { clave: "GTID341", carrera: "Mecatrónica",           cuatrimestre: 2 }
    ]);
  }
  if (!localStorage.getItem("admin_docentes")) {
    guardar("admin_docentes", [
      { nombre: "Vazquez Juarez Erika",     correo: "erika@utng.edu.mx" },
      { nombre: "Sustaita Cruces Daniel",   correo: "daniel@utng.edu.mx" },
      { nombre: "Rodriguez Garcia Anastacio", correo: "anastacio@utng.edu.mx" },
      { nombre: "Hernández Monzón Verónica", correo: "veronica@utng.edu.mx" }
    ]);
  }
  if (!localStorage.getItem("admin_asignaturas")) {
    guardar("admin_asignaturas", [
      { nombre: "Programación Estructurada", carrera: "Desarrollo de Software", cuatrimestre: 1 },
      { nombre: "Calculo de varias variables", carrera: "Desarrollo de Software", cuatrimestre: 1 },
      { nombre: "Bases de datos", carrera: "Desarrollo de Software", cuatrimestre: 2 },
      { nombre: "Redes", carrera: "Desarrollo de Software", cuatrimestre: 3 },
      { nombre: "Fisica", carrera: "Entornos virtuales", cuatrimestre: 1 },
      { nombre: "Redes", carrera: "Entornos virtuales", cuatrimestre: 2 },
      { nombre: "Electrónica", carrera: "Mecatrónica", cuatrimestre: 1 },
      { nombre: "Programación", carrera: "Mecatrónica", cuatrimestre: 2 }
    ]);
  }
  if (!localStorage.getItem("admin_preguntas")) {
    guardar("admin_preguntas", PREG.map((t, i) => ({ num: i + 1, texto: t })));
  }
}
semillar();

// ---------- CRUD ----------
export const grupos      = () => leer("admin_grupos", []);
export const docentes    = () => leer("admin_docentes", []);
export const asignaturas = () => leer("admin_asignaturas", []);
export const preguntas   = () => leer("admin_preguntas", []);
export const evaluaciones= () => leer("evaluaciones", []);

export function guardarGrupos(v)      { guardar("admin_grupos", v); }
export function guardarDocentes(v)    { guardar("admin_docentes", v); }
export function guardarAsignaturas(v) { guardar("admin_asignaturas", v); }
export function guardarPreguntas(v)   { guardar("admin_preguntas", v); }

// carreras = lista única sacada de los grupos
export const carreras = () =>
  [...new Set(grupos().map(g => g.carrera))].sort();

// ---------- helpers ----------
export function promedioGeneral(evals) {
  if (!evals.length) return 0;
  return +(evals.reduce((a, e) => a + e.promedio, 0) / evals.length).toFixed(1);
}

export function promedioPorPregunta(evals) {
  if (!evals.length) return Array(12).fill(0);
  return Array.from({ length: 12 }, (_, i) =>
    +(evals.reduce((a, e) => a + (e.calificaciones[i] || 0), 0) / evals.length).toFixed(1)
  );
}