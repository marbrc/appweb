// en utiles.js: las abreviaturas de siempre y ahora para usarlas en tds los archivos
// tambien aqui viven la ventanita de confirmar, los avisos de abajo y el fetch al servidor
import { icono } from "./iconos.js";

// buscar, encuentra un elemento s es el selector y r es donde lo busco
export const buscar = (s, r = document) => r.querySelector(s);

// buscarTodos encuentra todoos y los pasa a una lista normal para poder usar forEach
export const buscarTodos = (s, r = document) => [...r.querySelectorAll(s)];

// esc, para q lo q escriben los usuarios no se meta como codigo html (por seguridad)
export const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// inicial, la letra para la bolita cuando no hay foto
export const inicial = t => (String(t || "?").trim().charAt(0) || "?").toUpperCase();

// avatar, pone la foto o la inicial dentro de un elemento (textContent y img para que no metan codigo)
export function ponerAvatar(el, usuario) {
  if (!el) return;
  el.textContent = "";
  if (usuario?.foto) {
    const img = document.createElement("img");
    img.src = usuario.foto; img.alt = "";
    el.appendChild(img);
  } else {
    el.textContent = inicial(usuario?.nombres || usuario?.nombre);
  }
}

// ---------- api: el fetch de siempre pero ya con JSON y con los errores bien ----------
// si el servidor dice 401 (la sesion se acabo) te regresa al login
export async function api(url, { metodo = "GET", datos } = {}) {
  let r;
  try {
    r = await fetch(url, {
      method: metodo,
      headers: datos !== undefined ? { "Content-Type": "application/json" } : {},
      body: datos !== undefined ? JSON.stringify(datos) : undefined,
      cache: "no-store"
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisa que flask esté corriendo.");
  }
  let json = null;
  try { json = await r.json(); } catch { /* sin cuerpo */ }
  if (r.status === 401 && location.pathname === "/app") {
    localStorage.removeItem("sesion");
    location.replace("/#login");
  }
  if (!r.ok) throw new Error(json?.error || "Algo salió mal (error " + r.status + ").");
  return json;
}

// ---------- confirmar: la ventanita pequeña en lugar del confirm() feo del navegador ----------
// uso:  if (!await confirmar("¿Eliminar este grupo?", { peligro: true })) return;
export function confirmar(mensaje, { titulo = "¿Estás segura?", si = "Sí, continuar", no = "Cancelar", peligro = false } = {}) {
  return new Promise(resolver => {
    const d = document.createElement("dialog");
    d.className = "modal";
    d.innerHTML = `
      <div class="modal-cuerpo">
        <span class="modal-ico ${peligro ? "rojo" : ""}">${icono(peligro ? "alerta" : "pregunta")}</span>
        <h3></h3><p></p>
      </div>
      <div class="modal-botones">
        <button class="btn sec" type="button" data-r="0"></button>
        <button class="btn ${peligro ? "rojo" : ""}" type="button" data-r="1"></button>
      </div>`;
    d.querySelector("h3").textContent = titulo;
    d.querySelector("p").textContent = mensaje;
    d.querySelector('[data-r="0"]').textContent = no;
    d.querySelector('[data-r="1"]').textContent = si;
    const cerrar = v => { d.close(); d.remove(); resolver(v); };
    d.addEventListener("click", e => {
      const b = e.target.closest("[data-r]");
      if (b) cerrar(b.dataset.r === "1");
      else if (e.target === d) cerrar(false);   // clic afuera de la ventanita
    });
    d.addEventListener("cancel", e => { e.preventDefault(); cerrar(false); }); // tecla Esc
    document.body.appendChild(d);
    d.showModal();
    d.querySelector('[data-r="1"]').focus();
  });
}

// ---------- avisar: el letrerito que sale abajo a la derecha y se va solito ----------
// tipo puede ser "ok", "err" o "info"
export function avisar(texto, tipo = "ok") {
  let caja = buscar(".avisos");
  if (!caja) {
    caja = document.createElement("div");
    caja.className = "avisos";
    caja.setAttribute("aria-live", "polite");
    document.body.appendChild(caja);
  }
  const a = document.createElement("div");
  a.className = "aviso " + tipo;
  a.innerHTML = icono(tipo === "err" ? "alerta" : tipo === "ok" ? "check" : "info") + "<span></span>";
  a.querySelector("svg")?.setAttribute("width", "18");
  a.querySelector("span").textContent = texto;
  caja.appendChild(a);
  setTimeout(() => { a.classList.add("sale"); setTimeout(() => a.remove(), 300); }, tipo === "err" ? 5000 : 3200);
}

// cargando: pone la ruedita en un boton mientras espera al servidor
export const cargando = (btn, si) => { if (!btn) return; btn.disabled = si; btn.classList.toggle("cargando", si); };

// el ojito de las contraseñas, sirve para cualquier pantalla que tenga .pw con un boton .ojo
export function ojitos(raiz = document) {
  buscarTodos(".pw", raiz).forEach(caja => {
    const input = buscar("input", caja), b = buscar(".ojo", caja);
    if (!b || b.dataset.listo) return;
    b.dataset.listo = "1";
    b.innerHTML = icono("ojo");
    b.onclick = () => {
      const ver = input.type === "password";
      input.type = ver ? "text" : "password";
      b.innerHTML = icono(ver ? "ojo-no" : "ojo");
      b.setAttribute("aria-label", ver ? "Ocultar contraseña" : "Ver contraseña");
    };
  });
}

// reglas de la contraseña (las mismas de validacion.js y del servidor)
export const REGLA_CLAVE = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/;
export const MSG_CLAVE = "De 8 a 20 caracteres, con una mayúscula, una minúscula y un número.";

// fuerza: de 0 a 4, para las rayitas de colores debajo de la contraseña
export function fuerza(clave) {
  let n = 0;
  if (clave.length >= 8) n++;
  if (/[a-z]/.test(clave) && /[A-Z]/.test(clave)) n++;
  if (/\d/.test(clave)) n++;
  if (clave.length >= 12 || /[^A-Za-z0-9]/.test(clave)) n++;
  return clave ? Math.max(1, n) : 0;
}
