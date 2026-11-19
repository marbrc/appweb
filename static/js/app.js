// static/js/app.js
import { obtenerSesion, cerrarSesion } from "./nucleo/datos.js"; 
import { ROLES, MENUS, comunDe } from "./nucleo/menus.js"; 
import { iniciarRouter } from "./nucleo/router.js"; 
import { icono, pintarIconos } from "./nucleo/iconos.js"; 
import { buscar, buscarTodos } from "./nucleo/utiles.js"; 

const sesion = obtenerSesion();

// Si no hay sesión, lo regresamos al login
if (!sesion || !sesion.rol) {
    window.location.href = "/";
} else {
    arrancar();
}

function arrancar() {
    const rol = ROLES[sesion.rol] || ROLES.administrador; 
    
    // Armar el menú lateral
    const boton = o => `<button class="op" data-ruta="${o.ruta}" title="${o.nombre}">
        <i>${icono(o.icono)}</i><span>${o.nombre}</span>
    </button>`;
    
    const menuOp = buscar("#menu-op");
    if (menuOp) {
        menuOp.innerHTML = MENUS[rol.carpeta].map(boton).join("") + 
                           '<hr class="linea">' + 
                           comunDe(rol.carpeta).map(boton).join("");
        pintarIconos();
    }

    // Escuchar clics del menú
    document.addEventListener("click", e => {
        const ir = e.target.closest("[data-ruta]");
        if (ir) location.hash = ir.dataset.ruta;
    });

    // Iniciar el Router
    iniciarRouter(rol.carpeta, op => {
        if(buscar("#titulo")) buscar("#titulo").textContent = op.nombre;
        if(buscar("#desc")) buscar("#desc").textContent = op.desc;
        document.title = op.nombre + " · Encuesta Docente UTNG";
        marcarActiva(op);
    });
}

function marcarActiva(op) {
    const botones = buscarTodos(".op[data-ruta]");
    const activa = botones.find(b => b.dataset.ruta === op.ruta);
    botones.forEach(b => b.classList.toggle("activa", b === activa));
}