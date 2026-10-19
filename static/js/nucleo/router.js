// cambia solo lo que hay dentro de #contenido, el menú y la barra ni se tocan

import { buscar } from "./utiles.js";
import { MENUS, comunDe } from "./menus.js";
let carpeta = "";          // la carpeta del rol que inició sesión con admin, docente o alumno
let alCambiar = () => {};  // función del marco para actualizar título, descripción y opción marcada
let version = 0;           // sirve por si das clic muy rápido a varias opciones: solo gana la última

// esperar, una pausita y la usamos para dejar que la pantalla anterior se desvanezca
const esperar = ms => new Promise(r => setTimeout(r, ms));

// iniciarRouter, lo llama marco.js una vez
export function iniciarRouter(carpetaRol, callback) {
  carpeta = carpetaRol; alCambiar = callback;
  addEventListener("hashchange", abrir); // cada vez que cambia el # se abre la pantalla que toca
  abrir();
}

// abrir: busca la pantalla, trae su HTML, lo mete en #contenido y arranca su JS
async function abrir() {
  // solo se pueden abrir las pantallas de  rol que es admin o docente y las comunes 
  const permitidas = [...MENUS[carpeta], ...comunDe(carpeta)];
  
  let op = permitidas.find(x => x.ruta === location.hash.slice(1));
  if (!op) { op = MENUS[carpeta][0]; history.replaceState(null, "", "#" + op.ruta); }

  alCambiar(op); // el marco cambia el título de la barra y mueve el cristal del menú
  const mia = ++version, cont = buscar("#contenido");

  // la pantalla de antes se desvanece mientras se trae la nueva 
  cont.classList.add("saliendo");
  const pausa = esperar(180);

  // 1 el HTML de la pantalla, si el archivo todavía no existe (pero pronto se hace) sale el aviso de "en construcción"
  let html;
  try {
    const r = await fetch(`/static/pantallas/${op.ruta}.html`);
    if (!r.ok) throw new Error("no existe");
    html = await r.text();
  } catch {
    html = `<div class="vacio"><h2>${op.nombre}</h2><p class="sub">Esta pantalla todavía está en construcción 🚧</p></div>`;
  }
  await pausa;
  if (mia !== version) return; // ya dió clic a otra opción, esta se descarta
  cont.innerHTML = html;
  cont.scrollTop = 0;

  // 2 el JS de la pantalla es opcional,  bebe tener export function iniciar(contenedor)
  let modulo;
  try { modulo = await import(`/static/pantallas/${op.ruta}.js`); } catch { console.info("Sin JS para", op.ruta); }
  if (mia !== version) return;
  modulo?.iniciar?.(cont);

  cont.classList.remove("saliendo"); // ahora sí aparece la pantalla nueva
}