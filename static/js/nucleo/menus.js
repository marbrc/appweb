// menus.js
//se define que opciones tiene cada rol

// ROOLES, el rol como se guarda en el registro y  la carpeta de sus pantallas y cómo se escribe 
export const ROLES = {
  administrador: { carpeta: "admin", nombre: "Administrador" },
  alumno: { carpeta: "alumno", nombre: "Alumno" }
};

// o, arma una opción
const o = (ruta, nombre, icono, desc) => ({ ruta, nombre, icono, desc });

// los menús, es lo mismo pero cada rol tiene sus opciones
export const MENUS = {
  admin: [
    o("admin/inicio", "Inicio", "inicio", "Resumen general del sistema"),
    o("admin/grupos", "Grupos", "grupos", "Administra los grupos registrados"),
    o("admin/carreras", "Carreras", "carreras", "Administra las carreras registradas"),
    o("admin/docentes", "Docentes", "docentes", "Administra los docentes"),
    o("admin/asignaturas", "Asignaturas", "libro", "Administra las asignaturas"),
    // --- OPCIÓN MOVIDA AQUÍ ---
    o("admin/clases", "Carga Académica", "maletin", "Asigna maestros a grupos y materias"), 
    // -------------------------
    o("admin/preguntas", "Preguntas", "pregunta", "Edita las preguntas de la encuesta"),
    o("admin/reportes", "Reportes", "grafica", "Consulta los resultados por grupo, profesor y materia"),
    o("admin/accesos", "Códigos de acceso", "enlace", "Genera el código y el enlace para que cada grupo evalúe")
  ],
  alumno: [
    o("alumno/evaluar", "Evaluar profesor", "editar", "Responde las 12 preguntas de tu clase")
  ]
};

// comun, las pantallas que usan los roles, salen en el menú debajo de la rayita separadora
export const COMUN = [
  o("comun/cuenta", "Cuenta", "usuario", "Cambia tu correo y tu contraseña"),
  o("comun/config", "Configuración", "ajustes", "Elige el tema de la aplicación"),
  o("comun/acerca", "Acerca del sistema", "info", "Conoce de qué trata este sistema y quién lo hizo"),
  o("comun/calificar", "Calificar el sistema", "estrella", "Cuéntanos qué te parece este sistema")
];

// comunDe, las opciones comunes que le tocan a cada rol.
// El alumno no tiene cuenta, así que no ve esa opción.
export const comunDe = carpeta => carpeta === "alumno" ? COMUN.filter(o => o.ruta !== "comun/cuenta") : COMUN;