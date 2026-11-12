// /static/pantallas/admin/asignaturas.js
import { buscar, esc, avisar, confirmar } from "/static/js/nucleo/utiles.js";
import { getAsignaturas, setAsignaturas, getClases } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

// primera letra mayúscula y luego letras, números (Inglés IV, Cálculo de Varias Variables)
const REGEX_NOMBRE = /[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]*/;
const MSG_NOMBRE = "El nombre debe empezar con mayúscula (ej. Inglés IV, Bases de Datos).";

export function iniciar(contenedor) {
  cont = contenedor;
  editando = -1;

  const form = buscar("#s-form", cont);
  const tabla = buscar("#s-tabla", cont);

  buscar("#s-nuevo", cont).onclick = () => abrirForm(-1);
  buscar("#s-cancelar", cont).onclick = () => { form.reset(); form.hidden = true; editando = -1; };

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
      
      // Si ya está asignada en la Carga Académica global, no permitir eliminar
      if (getClases().some(c => c.asignaturaId === a.nombre || c.asignaturaId === a.id))
        return avisar(`"${a.nombre}" está asignada en la Carga Académica, elimínala de ahí primero.`, "err");

      if (!await confirmar(`La asignatura "${a.nombre}" se eliminará del catálogo general.`,
        { titulo: `¿Eliminar "${a.nombre}"?`, si: "Eliminar", peligro: true })) return;

      // 1. Eliminar de la lista local
      lista.splice(+del.dataset.del, 1);
      
      // 2. Enviar los cambios a la BD (esperar a que el backend procese la eliminación)
      await setAsignaturas(lista);
      
      // 3. Redibujar la tabla
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
    buscar("#s-total", cont).textContent = lista.length + (lista.length === 1 ? " registrada" : " registradas");

    tabla.innerHTML = lista.length
      ? lista.map((a, i) => `
          <tr>
            <td><b>${esc(a.nombre)}</b></td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="2" class="vacio">Todavía no hay asignaturas registradas en el catálogo.</td></tr>`;
  }
}