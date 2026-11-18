// /static/js/nucleo/admins.js
// el cuadro "Administradores" del Inicio (dashboard): lista de quien puede entrar al sistema y el formulario
// para registrar administradores nuevos. ANTES el registro estaba en la pantalla del login y cualquiera
// podia crearse una cuenta de administrador; ahora solo lo hace otro administrador con la sesion iniciada.
import { buscar, buscarTodos, esc, api, avisar, confirmar, cargando, ojitos, fuerza, REGLA_CLAVE, MSG_CLAVE } from "./utiles.js";
import { obtenerSesion } from "./datos.js";
import { pintarIconos } from "./iconos.js";

// las mismas reglas que tenia el registro del login (y que valida el servidor)
const NOMBRE = /^[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]*\.?(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]*\.?){0,4}$/;
const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function montarAdmins(cont) {
  const caja = buscar("#a-admins", cont);
  if (!caja) return;
  const form = buscar("#ad-form", caja), tabla = buscar("#ad-tabla", caja), msg = buscar("[data-error]", form);
  const yo = obtenerSesion();
  let lista = [];

  const error = t => { msg.textContent = t || ""; msg.hidden = !t; };
  ojitos(form);

  buscar("#ad-nuevo", caja).onclick = () => { form.hidden = !form.hidden; error(""); if (!form.hidden) form.nombres.focus(); };
  buscar("#ad-cancelar", caja).onclick = () => { form.reset(); form.hidden = true; error(""); buscar("#ad-fuerza", form).dataset.n = 0; };
  form.clave.addEventListener("input", () => buscar("#ad-fuerza", form).dataset.n = fuerza(form.clave.value));

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    ["nombres", "paterno", "materno", "correo"].forEach(k => d[k] = (d[k] || "").trim().replace(/\s+/g, " "));
    if (!NOMBRE.test(d.nombres) || d.nombres.length < 2) return error("El nombre debe empezar con mayúscula y llevar solo letras.");
    if (!NOMBRE.test(d.paterno)) return error("El apellido paterno debe empezar con mayúscula y llevar solo letras.");
    if (d.materno && !NOMBRE.test(d.materno)) return error("El apellido materno debe empezar con mayúscula y llevar solo letras.");
    if (!CORREO.test(d.correo)) return error("Escribe un correo válido.");
    if (!REGLA_CLAVE.test(d.clave)) return error(MSG_CLAVE);
    if (d.clave !== d.clave2) return error("Las contraseñas no son iguales.");
    error("");
    const btn = buscar("button[type=submit]", form);
    cargando(btn, true);
    try {
      const nuevo = await api("/api/admins", { metodo: "POST", datos: d });
      avisar(`${nuevo.nombre} ya es administrador. Puede entrar con su correo y contraseña.`);
      form.reset(); form.hidden = true; buscar("#ad-fuerza", form).dataset.n = 0;
      await cargar();
    } catch (err) { error(err.message); }
    cargando(btn, false);
  });

  tabla.addEventListener("click", async e => {
    const b = e.target.closest("[data-id]");
    if (!b) return;
    const activar = b.dataset.acc === "activar", a = lista.find(x => String(x.id) === b.dataset.id);
    if (!activar && !await confirmar(`${a.nombre} ya no podrá iniciar sesión hasta que lo actives otra vez.`,
      { titulo: "¿Desactivar este administrador?", si: "Desactivar", peligro: true })) return;
    cargando(b, true);
    try {
      lista = await api(`/api/admins/${a.id}/estatus`, { metodo: "PUT", datos: { activo: activar } });
      avisar(activar ? "Administrador activado." : "Administrador desactivado.");
      dibujar();
    } catch (err) { avisar(err.message, "err"); cargando(b, false); }
  });

  function dibujar() {
    buscar("#ad-total", caja).textContent = lista.length + (lista.length === 1 ? " administrador" : " administradores");
    tabla.innerHTML = lista.length ? lista.map(a => `
      <tr>
        <td><b>${esc(a.nombre)}</b>${a.id === yo?.id ? ' <span class="badge gris">Tú</span>' : ""}<br><small class="sub">${esc(a.correo)}</small></td>
        <td>${esc(a.ultimoAcceso) || '<span class="sub">Nunca</span>'}</td>
        <td><span class="badge ${a.activo ? "ok" : "warn"}">${a.activo ? "Activo" : "Desactivado"}</span></td>
        <td class="acciones-fila">${a.id === yo?.id ? "" :
          `<button class="mini ${a.activo ? "rojo" : "azul"}" type="button" data-id="${a.id}" data-acc="${a.activo ? "desactivar" : "activar"}">${a.activo ? "Desactivar" : "Activar"}</button>`}</td>
      </tr>`).join("") : `<tr><td colspan="4" class="vacio">No se pudieron cargar los administradores.</td></tr>`;
  }

  async function cargar() {
    try { lista = await api("/api/admins"); } catch (err) { lista = []; avisar(err.message, "err"); }
    dibujar();
  }
  pintarIconos(caja);
  await cargar();
}
