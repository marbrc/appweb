// /static/pantallas/admin/registrar.js
// agregar administradores y activar/desactivar los que ya existen.
// NUNCA se borra un administrador: solo se le pone Estatus = 0 (baja lógica),
// así lo que haya hecho (encuestas, opiniones, recuperaciones) no se pierde.
import { buscar, buscarTodos, api, avisar, confirmar, cargando, ojitos, fuerza, esc, REGLA_CLAVE, MSG_CLAVE } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { obtenerSesion } from "/static/js/nucleo/datos.js";
import { filtrar, conectar, cuenta } from "/static/js/nucleo/filtro.js";

// las mismas reglas de nombre que usa el servidor
const NOMBRE = /^[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]*\.?(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]*\.?){0,4}$/;
const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

let cont = null;
let admins = [];
let yo = null;

export async function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);
  yo = obtenerSesion() || {};

  const btnNuevo = buscar("#ad-nuevo", cont);
  const form = buscar("#ad-form", cont);
  const btnCancelar = buscar("#ad-cancelar", cont);
  const tabla = buscar("#ad-tabla", cont);
  const fuerzaEl = buscar("#ad-fuerza", cont);

  if (!btnNuevo || !form || !btnCancelar || !tabla) {
    console.error("Faltan elementos en el HTML de administradores. Revisa los IDs.");
    return;
  }

  ojitos(form);

  // buscador: filtra por nombre o correo
  const campoBuscar = buscar("#ad-buscar", cont);
  conectar(campoBuscar, () => dibujar());

  // ---------- mostrar / ocultar el formulario ----------
  const abrirForm = () => {
    form.hidden = false;
    form.reset();
    buscar("[data-error]", form).hidden = true;
    fuerzaEl.dataset.n = 0;
    form.nombres.focus();
  };
  btnNuevo.onclick = abrirForm;
  btnCancelar.onclick = () => { form.reset(); form.hidden = true; };

  // ---------- rayitas de la contraseña ----------
  form.clave.addEventListener("input", () => { fuerzaEl.dataset.n = fuerza(form.clave.value); });

  // ---------- limpieza suave de los nombres (misma idea que carreras.js) ----------
  ["nombres", "paterno", "materno"].forEach(k => {
    form[k].addEventListener("input", function () {
      this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ.\s]/g, "").replace(/\s{2,}/g, " ").slice(0, 60);
    });
  });

  // ---------- validar y mandar ----------
  const error = texto => {
    const m = buscar("[data-error]", form);
    m.className = "msg err"; m.textContent = texto || ""; m.hidden = !texto;
  };

  form.onsubmit = async e => {
    e.preventDefault();

    const d = {
      nombres: form.nombres.value.trim().replace(/\s+/g, " "),
      paterno: form.paterno.value.trim().replace(/\s+/g, " "),
      materno: form.materno.value.trim().replace(/\s+/g, " "),
      correo: form.correo.value.trim().toLowerCase(),
      clave: form.clave.value
    };

    if (!d.nombres || !NOMBRE.test(d.nombres)) return error("El nombre debe empezar con mayúscula y llevar solo letras.");
    if (!d.paterno || !NOMBRE.test(d.paterno)) return error("El apellido paterno debe empezar con mayúscula y llevar solo letras.");
    if (d.materno && !NOMBRE.test(d.materno)) return error("El apellido materno debe empezar con mayúscula y llevar solo letras.");
    if (!CORREO.test(d.correo)) return error("Escribe un correo válido.");
    if (!REGLA_CLAVE.test(d.clave)) return error(MSG_CLAVE);
    if (d.clave !== form.clave2.value) return error("Las contraseñas no son iguales.");

    error("");
    const btn = buscar("button[type='submit']", form);
    cargando(btn, true);
    try {
      await api("/api/registro", { metodo: "POST", datos: d });
      form.reset();
      form.hidden = true;
      fuerzaEl.dataset.n = 0;
      avisar("Administrador creado.");
      await cargar();
    } catch (err) {
      error(err.message);
    }
    cargando(btn, false);
  };

  // ---------- activar / desactivar ----------
  tabla.onclick = async e => {
    const b = e.target.closest("[data-estado]");
    if (!b) return;

    const id = +b.dataset.estado;
    const activar = b.dataset.accion === "activar";
    const a = admins.find(x => x.id === id);
    if (!a) return;

    const titulo = activar ? `¿Activar a "${a.nombre}"?` : `¿Desactivar a "${a.nombre}"?`;
    const mensaje = activar
      ? "Podrá volver a entrar al sistema con su correo y contraseña."
      : "No se borra nada: su cuenta queda desactivada y ya no podrá entrar. Sus datos se conservan.";

    if (!await confirmar(mensaje, { titulo, si: activar ? "Activar" : "Desactivar", peligro: !activar })) return;

    cargando(b, true);
    try {
      admins = await api(`/api/admins/${id}`, { metodo: "PUT", datos: { activo: activar } });
      avisar(activar ? "Administrador activado." : "Administrador desactivado.");
      dibujar();
    } catch (err) {
      avisar(err.message, "err");
    }
    cargando(b, false);
  };

  // ---------- traer la lista ----------
  async function cargar() {
    try {
      admins = await api("/api/admins");
      dibujar();
    } catch (err) {
      avisar(err.message, "err");
    }
  }

  function dibujar() {
    const q = campoBuscar ? campoBuscar.value : "";
    const visibles = filtrar(admins, q, a => `${a.nombre} ${a.correo}`);
    const total = buscar("#ad-total", cont);
    if (total) total.textContent = cuenta(visibles.length, admins.length, "cuenta", "cuentas");

    const soyYo = a => yo && Number(yo.id) === Number(a.id);

    tabla.innerHTML = visibles.length
      ? visibles.map(([a, i]) => `
        <tr>
          <td class="sub">${i + 1}</td>
          <td><b>${esc(a.nombre)}</b>${soyYo(a) ? ' <span class="chip">Tú</span>' : ""}</td>
          <td>${esc(a.correo)}</td>
          <td class="sub">${esc(a.registro || "—")}</td>
          <td>${a.activo ? '<span class="chip">Activo</span>' : '<span class="sub">Desactivado</span>'}</td>
          <td class="acciones-fila">
            ${a.activo
              ? `<button class="mini rojo" type="button" data-estado="${a.id}" data-accion="desactivar" ${soyYo(a) ? "disabled title='No puedes desactivar tu propia cuenta'" : ""}>Desactivar</button>`
              : `<button class="mini" type="button" data-estado="${a.id}" data-accion="activar">Activar</button>`}
          </td>
        </tr>`).join("")
      : q.trim()
        ? `<tr><td colspan="6" class="vacio">Nada coincide con "${esc(q.trim())}".</td></tr>`
        : `<tr><td colspan="6" class="vacio">Todavía no hay administradores.</td></tr>`;
  }

  await cargar();
}
