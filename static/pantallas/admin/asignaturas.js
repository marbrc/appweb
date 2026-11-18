// /static/pantallas/admin/asignaturas.js
import { buscar, esc, avisar, confirmar } from "/static/js/nucleo/utiles.js";
<<<<<<< HEAD
import { getAsignaturas, setAsignaturas, refrescarDatos } from "/static/js/nucleo/datos.js";
import { abrirPapelera } from "/static/js/nucleo/papelera.js";
import { filtrar, conectar, cuenta } from "/static/js/nucleo/filtro.js";
=======
import { getAsignaturas, setAsignaturas, getClases, getCarreras, alCambiarDatos } from "/static/js/nucleo/datos.js";
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36

let cont = null;
let editando = -1;
let desuscribir = null;

<<<<<<< HEAD
// primera letra mayúscula y luego letras, números, espacios y signos (Inglés IV, Cálculo de Varias Variables, Animación 3D)
const REGEX_NOMBRE = /^[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,\-]*$/;
const MSG_NOMBRE = "El nombre debe empezar con mayúscula y puede llevar letras, números y espacios (ej. Inglés IV, Animación 3D).";
=======
// DSM, IRD... la sigla de cada carrera para no llenar la tabla de nombres largos
const sigla = c => c.split(/\s+/).filter(w => w.length > 3).map(w => w[0].toUpperCase()).join("");

// primera letra mayúscula y luego letras, números y espacios (Inglés IV, Animación 3D)
const REGEX_NOMBRE = /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ]*$/;
const MSG_NOMBRE = "El nombre debe empezar con mayúscula y solo llevar letras, números y espacios (ej. Inglés IV, Animación 3D).";
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36

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
<<<<<<< HEAD

      // nada se borra: la asignatura y sus asignaciones de Carga Académica solo se desactivan
      if (!await confirmar('No se borra: queda desactivada y la puedes recuperar en "Ver eliminados". ' +
        "También se desactivan sus asignaciones de Carga Académica y sus códigos dejan de servir.",
        { titulo: `¿Desactivar "${a.nombre}"?`, si: "Desactivar", peligro: true })) return;

      lista.splice(+del.dataset.del, 1);
      await setAsignaturas(lista);
      await refrescarDatos();
=======
      
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
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
      dibujar();
    }
  };

  // ---- filtros ----
  const fBuscar = buscar("#s-buscar", cont), fCarrera = buscar("#s-carrera", cont),
        fCuatri = buscar("#s-cuatri", cont), fUso = buscar("#s-uso", cont);
  fCarrera.innerHTML = '<option value="">Todas las carreras</option>' +
    getCarreras().map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  fCuatri.innerHTML = '<option value="">Todos los cuatrimestres</option>' +
    Array.from({ length: 11 }, (_, i) => `<option value="${i + 1}">${i + 1}°</option>`).join("");
  [fBuscar, fCarrera, fCuatri, fUso].forEach(el => el.addEventListener(el === fBuscar ? "input" : "change", dibujar));

  if (desuscribir) desuscribir();
  desuscribir = alCambiarDatos("admin_asignaturas", dibujar);

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
<<<<<<< HEAD
    const q = campoBuscar ? campoBuscar.value : "";
    const textoPlanes = a => (a.planes || [])
      .map(p => `${p.carrera} ${p.cuatrimestre}°`).join(" ");
    const visibles = filtrar(lista, q, a => `${a.nombre} ${textoPlanes(a)}`);
    buscar("#s-total", cont).textContent = cuenta(visibles.length, lista.length, "registrada", "registradas");

    const planes = a => (a.planes || []).length
      ? `<div class="chips-planes">${a.planes.map(p =>
          `<span class="chip">${esc(p.carrera)} · ${esc(p.cuatrimestre)}°</span>`).join("")}</div>`
      : `<span class="badge warn">Sin plan todavía</span>`;
=======
    const clases = getClases();
    const q = fBuscar.value.trim().toLowerCase(), c = fCarrera.value, ct = fCuatri.value, uso = fUso.value;
    const grupos = a => clases.filter(x => x.asignaturaId === a.nombre).length;

    // se guarda el lugar real de cada asignatura en la lista para que Editar y Eliminar apunten bien aunque haya filtros
    const visibles = lista.map((a, i) => [a, i]).filter(([a]) =>
      (!q || a.nombre.toLowerCase().includes(q)) &&
      (!c || (a.planes || []).some(p => p.carrera === c && (!ct || String(p.cuatrimestre) === ct))) &&
      (c || !ct || (a.planes || []).some(p => String(p.cuatrimestre) === ct)) &&
      (uso !== "sin-plan" || !(a.planes || []).length) &&
      (uso !== "en-carga" || grupos(a) > 0) &&
      (uso !== "libres" || grupos(a) === 0));

    buscar("#s-total", cont).textContent = visibles.length === lista.length
      ? lista.length + (lista.length === 1 ? " registrada" : " registradas")
      : `${visibles.length} de ${lista.length}`;
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36

    tabla.innerHTML = visibles.length
      ? visibles.map(([a, i]) => {
          const planes = a.planes || [];
          const chips = planes.length
            ? planes.slice(0, 4).map(p => `<span class="chip" title="${esc(p.carrera)}">${esc(sigla(p.carrera))} ${esc(p.cuatrimestre)}°</span>`).join(" ") +
              (planes.length > 4 ? ` <span class="sub">+${planes.length - 4} más</span>` : "")
            : `<span class="sub">Aún sin carrera</span>`;
          return `
          <tr>
            <td><b>${esc(a.nombre)}</b></td>
<<<<<<< HEAD
            <td>${planes(a)}</td>
=======
            <td><div style="display:flex;flex-wrap:wrap;gap:4px">${chips}</div></td>
            <td>${grupos(a) || '<span class="sub">—</span>'}</td>
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
<<<<<<< HEAD
          </tr>`).join("")
      : q.trim()
        ? `<tr><td colspan="3" class="vacio">Nada coincide con "${esc(q.trim())}".</td></tr>`
        : `<tr><td colspan="3" class="vacio">Todavía no hay asignaturas registradas en el catálogo.</td></tr>`;
=======
          </tr>`;
        }).join("")
      : `<tr><td colspan="4" class="vacio">${lista.length ? "Ninguna asignatura coincide con los filtros." : "Todavía no hay asignaturas registradas en el catálogo."}</td></tr>`;
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
  }
}