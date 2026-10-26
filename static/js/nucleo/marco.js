// ARRANCA el marco, se ejecuta una sola vez y arma menú, cuenta, ocultar menú, reloj y router
import { obtenerSesion, cerrarSesion, preferencia } from "./datos.js";
import { ROLES, MENUS, comunDe } from "./menus.js";
import { iniciarRouter } from "./router.js";
import { icono, pintarIconos } from "./iconos.js";
import { buscar, buscarTodos } from "./utiles.js";

const sesion = obtenerSesion();

// el alumno entra por /alumno con el cdg de su grupo si no lo tiene, regresa allá
// los dems roles necesitan iniciar sesión si no hay sesión o el rol no existe regresan al login
if (sesion?.rol === "alumno" && !sesion.codigo) location.replace("/alumno");
else if (!sesion || !ROLES[sesion.rol]) location.replace("/#login");
else arrancar();

function arrancar() {
  const rol = ROLES[sesion.rol], marco = buscar("#marco");

  // 1. el menú, las opciones de wste rol una rayita y las opciones comunes
  const boton = o => `<button class="op" data-ruta="${o.ruta}" title="${o.nombre}"><i>${icono(o.icono)}</i><span>${o.nombre}</span></button>`;
  buscar("#menu-op").innerHTML = '<span class="pill" id="pill"></span>' +
    MENUS[rol.carpeta].map(boton).join("") + '<hr class="linea">' + comunDe(rol.carpeta).map(boton).join("");
  pintarIconos(); // pone los iconos en los lugares del HTML que tienen data-icono

  // 2 la cuenta de arriba textContent y no innerHTML para que nadie pueda meter código en su nombre
  buscar("#cuenta-nombre").textContent = sesion.nombre;
  buscar("#cuenta-rol").textContent = "Rol: " + rol.nombre;
  // el alumno es anónimo y no tiene cuenta, así que no ve "Mi cuenta"
  if (rol.carpeta === "alumno") buscar('#menu-cuenta [data-ruta="comun/cuenta"]').hidden = true;

  // 3ocultar/mostrar el menú con las tres rayitas, se acuerda de cómo lo dejaste
  //    si es la primera vez, en el celular empieza oculto
  const guardado = preferencia("menuCerrado");
  marco.classList.toggle("cerrado", guardado === null ? innerWidth < 700 : guardado === "1");
  buscar("#btn-menu").onclick = () => preferencia("menuCerrado", marco.classList.toggle("cerrado") ? "1" : "0");

  // 4 los clics, opciones del menú data-ruta, cerrar sesión data-salir y el menú de la cuenta
  document.addEventListener("click", e => {
    const ir = e.target.closest("[data-ruta]"), salir = e.target.closest("[data-salir]");
    if (ir) location.hash = ir.dataset.ruta; // cambiar el # hace que el router abra la pantalla
    if (salir) cerrando();
    // el menú de la cuenta se abre con su botón y se cierra con cualquier otro clic
    const menu = buscar("#menu-cuenta");
    menu.hidden = !(e.target.closest("#btn-cuenta") && menu.hidden);
  });

  // 5 aqui estaba el reloj (hora y fecha de la barra de arriba) pero se quito porq era innecesario
  //   tambien se borro su setInterval asi q ya no hay nada corriendo cada segundooo

  // 6 el router, cada vez que cambia la pantalla actualiza la barra y mueve el cristal del menú
  iniciarRouter(rol.carpeta, op => {
    buscar("#titulo").textContent = op.nombre;
    buscar("#desc").textContent = op.desc;
    document.title = op.nombre + " · Encuesta Docente UTNG";
    marcarActiva(op);
  });
}

// marcarActiva, pone en negritas la opción actual y desliza el cristal
// si la pantalla no está en el menú el cristal se esconde
function marcarActiva(op) {
  const botones = buscarTodos(".op[data-ruta]"), pill = buscar("#pill");
  const activa = botones.find(b => b.dataset.ruta === op.ruta);
  botones.forEach(b => b.classList.toggle("activa", b === activa));
  if (!activa) { pill.style.opacity = 0; return; }
  // la primera vez el cristal aparece directo en su lugar sin viajar desde arriba
  const primera = !pill.style.height;
  if (primera) pill.style.transition = "none";
  pill.style.top = activa.offsetTop + "px";
  pill.style.height = activa.offsetHeight + "px";
  pill.style.opacity = 1;
  if (primera) { pill.offsetHeight; pill.style.transition = ""; } // offsetHeight obliga a aplicar el cambio antes de reactivar la animación
}

// cerrando, muestra la pantallita cerrando sesión y después borra la sesión
// el alumno regresa a la entrada de alumnos y los demás al login
let saliendo = false;
function cerrando() {
  if (saliendo) return; // por si le dan clic dos veces
  saliendo = true;
  buscar("#cerrando").hidden = false;
  setTimeout(() => { cerrarSesion(); location.href = sesion.rol === "alumno" ? "/alumno" : "/#login"; }, 1800);
}