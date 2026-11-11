// /static/pantallas/admin/asignaturas.js
import { buscar, esc, avisar, confirmar } from "/static/js/nucleo/utiles.js";
import { getAsignaturas, setAsignaturas, getCarreras, getGrupos, getClases } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

// primera letra mayúscula y luego letras, números (Inglés IV, Cálculo de Varias Variables)
const REGEX_NOMBRE = /^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ,.()-]*$/;
const MSG_NOMBRE = "El nombre debe empezar con mayúscula (ej. Inglés IV, Bases de Datos).";

export function iniciar(contenedor) {
  cont = contenedor;
  editando = -1;

  const form = buscar("#s-form", cont);
  const tabla = buscar("#s-tabla", cont);
  const fCarrera = buscar("#s-f-carrera", cont), fCuatri = buscar("#s-f-cuatri", cont);

  // los selects de carrera y cuatrimestre (en el form y en los filtros)
  const opciones = (lista, txt) => `<option value="">${txt}</option>` + lista.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("");
  form.carrera.innerHTML = opciones(getCarreras(), "Selecciona una carrera");
  fCarrera.innerHTML = opciones(getCarreras(), "Todas las carreras");
  const cuatris = Array.from({ length: 11 }, (_, i) => i + 1);
  form.cuatrimestre.innerHTML = `<option value="">Selecciona</option>` + cuatris.map(c => `<option value="${c}">${c}°</option>`).join("");
  fCuatri.innerHTML = `<option value="">Todos los cuatrimestres</option>` + cuatris.map(c => `<option value="${c}">${c}°</option>`).join("");
  fCarrera.onchange = fCuatri.onchange = dibujar;

  buscar("#s-nuevo", cont).onclick = () => abrirForm(-1);
  buscar("#s-cancelar", cont).onclick = () => { form.reset(); form.hidden = true; editando = -1; };

  form.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    let nombre = (d.nombre || "").trim().replace(/\s+/g, " ");
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    const carrera = d.carrera, cuatrimestre = Number(d.cuatrimestre);

    if (!nombre || !carrera || !cuatrimestre) return avisar("Llena el nombre, la carrera y el cuatrimestre.", "err");
    if (!REGEX_NOMBRE.test(nombre)) { form.nombre.focus(); return avisar(MSG_NOMBRE, "err"); }

    // sin grupos de esa carrera y cuatrimestre la BD no tiene donde ponerla
    if (!getGrupos().some(g => g.carrera === carrera && Number(g.cuatrimestre) === cuatrimestre))
      return avisar(`Primero registra un grupo de ${carrera} en ${cuatrimestre}° cuatrimestre.`, "err");

    // VALIDACIÓN DE DUPLICADOS (ignorando mayúsculas/minúsculas) en la misma carrera y cuatrimestre
    const lista = getAsignaturas();
    const existe = lista.some((a, i) => i !== editando && a.nombre.toLowerCase() === nombre.toLowerCase()
      && a.carrera === carrera && Number(a.cuatrimestre) === cuatrimestre);
    if (existe) { form.nombre.focus(); return avisar(`"${nombre}" ya está registrada en ${cuatrimestre}° de esa carrera.`, "err"); }

    const item = { nombre, carrera, cuatrimestre };
    if (editando >= 0) lista[editando] = item;
    else lista.push(item);
    setAsignaturas(lista);
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
      // si ya esta en carga academica no se puede borrar (la BD no deja)
      const suyos = getGrupos().filter(g => g.carrera === a.carrera && Number(g.cuatrimestre) === Number(a.cuatrimestre)).map(g => g.clave);
      if (getClases().some(c => c.asignaturaId === a.nombre && suyos.includes(c.grupoId)))
        return avisar(`"${a.nombre}" tiene asignaciones en Carga Académica, elimínalas primero.`, "err");
      if (!await confirmar(`Se quitará de todos los grupos de ${a.carrera} en ${a.cuatrimestre}°.`,
        { titulo: `¿Eliminar "${a.nombre}"?`, si: "Eliminar", peligro: true })) return;
      lista.splice(+del.dataset.del, 1);
      setAsignaturas(lista);
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
      form.carrera.value = a.carrera || "";
      form.cuatrimestre.value = a.cuatrimestre || "";
    } else {
      form.reset();
      if (fCarrera.value) form.carrera.value = fCarrera.value;
      if (fCuatri.value) form.cuatrimestre.value = fCuatri.value;
    }
    form.nombre.focus();
  }

  function dibujar() {
    const lista = getAsignaturas();
    // la pastillita de arriba que dice cuantas asignaturas hay
    buscar("#s-total", cont).textContent = lista.length + (lista.length === 1 ? " registrada" : " registradas");

    const visibles = lista.map((a, i) => [a, i])
      .filter(([a]) => (!fCarrera.value || a.carrera === fCarrera.value) && (!fCuatri.value || String(a.cuatrimestre) === fCuatri.value));
    tabla.innerHTML = visibles.length
      ? visibles.map(([a, i]) => `
          <tr>
            <td><b>${esc(a.nombre)}</b></td>
            <td>${esc(a.carrera) || '<span class="badge warn">Sin carrera</span>'}</td>
            <td>${a.cuatrimestre ? `<span class="chip">${esc(a.cuatrimestre)}°</span>` : "—"}</td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="4" class="vacio">${lista.length ? "No hay asignaturas con esos filtros." : "Todavía no hay asignaturas registradas."}</td></tr>`;
  }
}
