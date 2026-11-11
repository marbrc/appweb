// menus.js
//se define que opciones tiene cada rol

// ROOLES, el rol como se guarda en la sesion, la carpeta de sus pantallas y cómo se escribe
// el alumno YA NO entra al marco, él contesta todo en /alumno con el enlace (alumno.html + acceso.js)
export const ROLES = {
  administrador: { carpeta: "admin", nombre: "Administrador" }
};

// o, arma una opción
const o = (ruta, nombre, icono, desc) => ({ ruta, nombre, icono, desc });

// los menús, es lo mismo pero cada rol tiene sus opciones
// titulo es el letrerito chiquito que sale arriba de las opciones en el menú (Gestión)
export const MENUS = {
  admin: [
    o("admin/inicio", "Inicio", "inicio", "Resumen general del sistema"),
    o("admin/grupos", "Grupos", "grupos", "Administra los grupos registrados"),
    o("admin/carreras", "Carreras", "carreras", "Administra las carreras registradas"),
    o("admin/docentes", "Docentes", "docentes", "Administra los docentes"),
    o("admin/asignaturas", "Asignaturas", "libro", "Administra las asignaturas"),
    o("admin/clases", "Carga Académica", "maletin", "Asigna maestros a grupos y materias"),
    o("admin/preguntas", "Preguntas", "pregunta", "Edita las preguntas de la encuesta"),
    o("admin/reportes", "Reportes", "grafica", "Consulta los resultados por grupo, profesor y materia"),
    o("admin/accesos", "Códigos de acceso", "enlace", "Genera el código y el enlace para que cada grupo evalúe")
  ]
};
export const TITULOS = { admin: "Gestión", comun: "General" };

// comun, las pantallas que usan todos los roles, salen en el menú debajo del titulito General
export const COMUN = [
  o("comun/cuenta", "Mi cuenta", "usuario", "Tu foto, tus datos, tu correo y tu contraseña"),
  o("comun/config", "Configuración", "ajustes", "Elige el tema de la aplicación"),
  o("comun/acerca", "Acerca del sistema", "info", "Conoce de qué trata este sistema y quién lo hizo"),
  o("comun/calificar", "Calificar el sistema", "estrella", "Cuéntanos qué te parece este sistema")
];

// comunDe, las opciones comunes que le tocan a cada rol (por ahora el admin las tiene todas)
export const comunDe = () => COMUN;
