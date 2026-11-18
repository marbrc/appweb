// /static/pantallas/admin/asignaturas.js
import { buscar, esc, avisar, confirmar } from "/static/js/nucleo/utiles.js";
import { getAsignaturas, setAsignaturas, refrescarDatos } from "/static/js/nucleo/datos.js";
import { abrirPapelera } from "/static/js/nucleo/papelera.js";
import { filtrar, conectar, cuenta } from "/static/js/nucleo/filtro.js";

let cont = null;
let editando = -1;

// primera letra mayúscula y luego letras, números, espacios y signos (Inglés IV, Cálculo de Varias Variables, Animación 3D)
const REGEX_NOMBRE = /^[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,\-]*$/;
const MSG_NOMBRE = "El nombre debe empezar con mayúscula y puede llevar letras, números y espacios (ej. Inglés IV, Animación 3D).";

export function iniciar(contenedor) {
  cont = contenedor;
  editando = -1;

  const form = buscar("#s-form", cont);
  const tabla = buscar("#s-tabla", cont);

  buscar("#s-nuevo", cont).onclick = () => abrirForm(-1);
  buscar("#s-cancelar", cont).onclick = () => { form.reset(); form.hidden = true; editando = -1; };
  buscar("#s-papelera", cont).onclick = () => abrirPapelera("asignaturas", dibujar);
  // buscador: filtra por nombre de la asignatura
  const campoBuscar = buscar("#s-buscar", cont);
  conectar(campoBuscar, () => dibujar());

  // Agregamos `async` aquí para esperar la respuesta del backend
  form.onsubmit = async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    let nombre = (d.nombre || "").trim().replace(/\s+/g, " ");
    if (nombre) nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    if (!nombre) return avisar("Escribe el nombre de la asignatura.", "err");
    if (!REGEX_NOMBRE.test(nombre)) { form.nombre.focus(); return avisar(MSG_NOMBRE, "err"); }

    // VALIDACIÓN DE DUPLICADOS (global por nombre)
    const lista = getAsignaturas();
    const existe = lista.some((a, i) => i !== editando && a.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) { form.nombre.focus(); return avisar(`"${nombre}" ya está registrada en el catálogo.`, "err"); }

    const item = { nombre };
    if (editando >= 0) {
      if (lista[editando].id) item.id = lista[editando].id;
      lista[editando] = item;
    } else {
      lista.push(item);
    }
    
    // Guardar en la base de datos y esperar la respuesta
    await setAsignaturas(lista);
    avisar(editando >= 0 ? "Asignatura actualizada." : "Asignatura agregada.");

    form.reset();
    form.hidden = true;
    editando = -1;
    dibujar();
  };

  tabla.onclick = async e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");
    if (ed) abrirForm(+ed.dataset.ed);
    if (del) {
      const lista = getAsignaturas(), a = lista[+del.dataset.del];

      // nada se borra: la asignatura y sus asignaciones de Carga Académica solo se desactivan
      if (!await confirmar('No se borra: queda desactivada y la puedes recuperar en "Ver eliminados". ' +
        "También se desactivan sus asignaciones de Carga Académica y sus códigos dejan de servir.",
        { titulo: `¿Desactivar "${a.nombre}"?`, si: "Desactivar", peligro: true })) return;

      lista.splice(+del.dataset.del, 1);
      await setAsignaturas(lista);
      await refrescarDatos();
      dibujar();
    }
  };

  dibujar();

  function abrirForm(i) {
    editando = i;
    form.hidden = false;
    buscar("#s-titulo", cont).textContent = i >= 0 ? "Editar asignatura" : "Nueva asignatura";
    if (i >= 0) {
      const a = getAsignaturas()[i];
      form.nombre.value = a.nombre;
    } else {
      form.reset();
    }
    form.nombre.focus();
  }

  function dibujar() {
    const lista = getAsignaturas();
    const q = campoBuscar ? campoBuscar.value : "";
    const textoPlanes = a => (a.planes || [])
      .map(p => `${p.carrera} ${p.cuatrimestre}°`).join(" ");
    const visibles = filtrar(lista, q, a => `${a.nombre} ${textoPlanes(a)}`);
    buscar("#s-total", cont).textContent = cuenta(visibles.length, lista.length, "registrada", "registradas");

    const planes = a => (a.planes || []).length
      ? `<div class="chips-planes">${a.planes.map(p =>
          `<span class="chip">${esc(p.carrera)} · ${esc(p.cuatrimestre)}°</span>`).join("")}</div>`
      : `<span class="badge warn">Sin plan todavía</span>`;

    tabla.innerHTML = visibles.length
      ? visibles.map(([a, i]) => `
          <tr>
            <td><b>${esc(a.nombre)}</b></td>
            <td>${planes(a)}</td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`).join("")
      : q.trim()
        ? `<tr><td colspan="3" class="vacio">Nada coincide con "${esc(q.trim())}".</td></tr>`
        : `<tr><td colspan="3" class="vacio">Todavía no hay asignaturas registradas en el catálogo.</td></tr>`;
  }
}