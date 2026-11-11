// ARRANCA el marco, se ejecuta una sola vez y arma menú, cuenta, ocultar menú y router
import { obtenerSesion, actualizarSesion, cerrarSesion, preferencia } from "./datos.js";
import { ROLES, MENUS, TITULOS, comunDe } from "./menus.js";
import { iniciarRouter } from "./router.js";
import { icono, pintarIconos } from "./iconos.js";
import { buscar, buscarTodos, api, confirmar, ponerAvatar } from "./utiles.js";

let sesion = obtenerSesion();

// el alumno ya no entra aqui, contesta en /alumno con su enlace
// los demás necesitan iniciar sesión, si no hay sesión regresan al login
if (sesion?.rol === "alumno") location.replace("/alumno");
else if (!sesion || !ROLES[sesion.rol]) location.replace("/#login");
else arrancar();

async function arrancar() {
  const rol = ROLES[sesion.rol], marco = buscar("#marco");

  // 0. le pregunto al servidor quien soy, si la sesion de flask ya se acabo me manda al login
  //    (antes cualquiera entraba poniendo lo que fuera en el login porque no se revisaba nada)
  try {
    sesion = { ...sesion, ...(await api("/api/yo")) };
    actualizarSesion(sesion);
  } catch { /* api() ya lo mandó al login si fue 401, si es otro error se queda con lo guardado */ }

  // 1. el menú, el titulito, las opciones de este rol y luego las comunes
  //    cada opcion trae su flechita azul que solo se ve en la que esta elegida
  const boton = o => `<button class="op" type="button" data-ruta="${o.ruta}" title="${o.nombre}"><i class="ico">${icono(o.icono)}</i><span>${o.nombre}</span><i class="flecha">${icono("derecha")}</i></button>`;
  buscar("#menu-op").innerHTML = '<span class="pill" id="pill"></span>' +
    `<p class="grupo-menu">${TITULOS[rol.carpeta]}</p>` + MENUS[rol.carpeta].map(boton).join("") +
    `<p class="grupo-menu">${TITULOS.comun}</p>` + comunDe(rol.carpeta).map(boton).join("");
  pintarIconos(); // pone los iconos en los lugares del HTML que tienen data-icono

  // 2 la cuenta de arriba, textContent y no innerHTML para que nadie pueda meter código en su nombre
  pintarCuenta();
  addEventListener("sesion:cambio", () => { sesion = obtenerSesion(); pintarCuenta(); }); // lo avisa la pantalla de cuenta

  // 3 ocultar/mostrar el menú con los tres puntitos, se acuerda de cómo lo dejaste
  //   en la compu se encoge y quedan los iconos, en el celular sale encima y se esconde
  const celular = () => innerWidth <= 860;
  marco.classList.toggle("cerrado", preferencia("menuCerrado") === "1");
  buscar("#btn-menu").onclick = () => {
    if (celular()) return marco.classList.toggle("abierto");
    preferencia("menuCerrado", marco.classList.toggle("cerrado") ? "1" : "0");
    setTimeout(() => marcarActiva(), 340); // cuando termina de encogerse acomodo la cajita azul
  };
  buscar("#velo").onclick = () => marco.classList.remove("abierto");

  // 4 los clics, opciones del menú data-ruta, cerrar sesión data-salir y el menú de la cuenta
  const menu = buscar("#menu-cuenta"), btnCuenta = buscar("#btn-cuenta");
  document.addEventListener("click", e => {
    const ir = e.target.closest("[data-ruta]"), salir = e.target.closest("[data-salir]");
    if (ir) { location.hash = ir.dataset.ruta; marco.classList.remove("abierto"); } // cambiar el # hace que el router abra la pantalla
    if (salir) cerrando();
    // el menú de la cuenta se abre con su botón y se cierra con cualquier otro clic
    const abrir = !!e.target.closest("#btn-cuenta") && menu.hidden;
    menu.hidden = !abrir;
    btnCuenta.setAttribute("aria-expanded", abrir);
  });
  addEventListener("keydown", e => { if (e.key === "Escape") { menu.hidden = true; marco.classList.remove("abierto"); } });
  addEventListener("resize", () => marcarActiva());

  // 5 el router, cada vez que cambia la pantalla actualiza las migas de arriba y mueve la cajita del menú
  //   ANTES el titulo tambien salia arriba de cada pantalla y por eso se veia doble el encabezado
  iniciarRouter(rol.carpeta, op => {
    buscar("#titulo").textContent = op.nombre;
    document.title = op.nombre + " · Encuesta Docente UTNG";
    marcarActiva(op);
  });
}

// pintarCuenta, el nombre, el rol y la foto (o la inicial) de arriba y del menu de la cuenta
function pintarCuenta() {
  const nombre = [sesion.nombres, sesion.paterno].filter(Boolean).join(" ") || sesion.nombre || "Administrador";
  buscar("#cuenta-nombre").textContent = nombre;
  buscar("#cuenta-rol").textContent = ROLES[sesion.rol]?.nombre || "";
  buscar("#mc-nombre").textContent = sesion.nombre || nombre;
  buscar("#mc-correo").textContent = sesion.correo || "";
  ponerAvatar(buscar("#cuenta-foto"), sesion);
  ponerAvatar(buscar("#mc-foto"), sesion);
}

// marcarActiva, pone en azul la opción actual y desliza la cajita hasta ella
// si la pantalla no está en el menú la cajita se esconde
let actual = null;
function marcarActiva(op = actual) {
  actual = op;
  if (!op) return;
  const botones = buscarTodos(".op[data-ruta]"), pill = buscar("#pill");
  const activa = botones.find(b => b.dataset.ruta === op.ruta);
  botones.forEach(b => { b.classList.toggle("activa", b === activa); b.toggleAttribute("aria-current", b === activa); });
  if (!activa) { pill.style.opacity = 0; return; }
  // la primera vez la cajita aparece directo en su lugar sin viajar desde arriba
  const primera = !pill.style.height;
  if (primera) pill.style.transition = "none";
  pill.style.top = activa.offsetTop + "px";
  pill.style.height = activa.offsetHeight + "px";
  pill.style.opacity = 1;
  if (primera) { pill.offsetHeight; pill.style.transition = ""; } // offsetHeight obliga a aplicar el cambio antes de reactivar la animación
}

// cerrando, primero pregunta, luego muestra la pantallita cerrando sesión y borra la sesión
let saliendo = false;
async function cerrando() {
  if (saliendo) return; // por si le dan clic dos veces
  if (!await confirmar("Vas a salir del sistema. Para volver a entrar necesitas tu correo y contraseña.",
    { titulo: "¿Cerrar sesión?", si: "Cerrar sesión" })) return;
  saliendo = true;
  buscar("#cerrando").hidden = false;
  try { await api("/api/logout", { metodo: "POST" }); } catch { /* aunque falle, localmente si se cierra */ }
  setTimeout(() => { cerrarSesion(); location.href = "/#login"; }, 900);
}
