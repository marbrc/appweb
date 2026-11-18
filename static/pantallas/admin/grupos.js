// /static/pantallas/admin/grupos.js
import { buscar, avisar, confirmar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
<<<<<<< HEAD
import { getGrupos, setGrupos, getCarreras, participacionesDeGrupo, alCambiarDatos, refrescarDatos } from "/static/js/nucleo/datos.js";
import { abrirPapelera } from "/static/js/nucleo/papelera.js";
import { filtrar, conectar, cuenta as resumen } from "/static/js/nucleo/filtro.js";
=======
import { getGrupos, setGrupos, getCarreras, getClases, participacionDe, alCambiarDatos } from "/static/js/nucleo/datos.js";
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36

let cont = null;
let editando = -1;
let desuscribir = null;

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

<<<<<<< HEAD
// participaciones: se cuentan de las encuestas de las clases del grupo (ya no hay contador guardado)
const respondieron = clave => participacionesDeGrupo(clave);
=======
// las participaciones de cada grupo las calcula el servidor contando las encuestas (participacionDe en datos.js),
// ya no se guardan en un contador que se puede desfasar
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36

function llenarCarreras(form, seleccionada = "") {
  const lista = [...(getCarreras() || [])];
  if (seleccionada && !lista.includes(seleccionada)) lista.push(seleccionada);

  form.carrera.innerHTML = '<option value="">Selecciona una carrera</option>' +
    lista.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  form.carrera.value = seleccionada;
}

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);
  editando = -1;

  const btnNuevo = buscar("#g-nuevo", cont);
  const form = buscar("#g-form", cont);
  const btnCancelar = buscar("#g-cancelar", cont);
  const tabla = buscar("#g-tabla", cont);

  if (!btnNuevo || !form || !btnCancelar || !tabla) {
    console.error("Faltan elementos en el HTML de grupos. Revisa los IDs.");
    return;
  }

  btnNuevo.onclick = () => abrirForm(-1);
  btnCancelar.onclick = () => { form.reset(); form.hidden = true; editando = -1; };
  buscar("#g-papelera", cont).onclick = () => abrirPapelera("grupos", dibujar);
  // buscador: filtra por clave, carrera o cuatrimestre
  const campoBuscar = buscar("#g-buscar", cont);
  conectar(campoBuscar, () => dibujar());

  form.onsubmit = async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const clave = d.clave.trim().toUpperCase();
    const alumnos = Number(d.alumnos);
    const lista = getGrupos() || [];

    if (lista.some((g, i) => i !== editando && g.clave === clave)) {
      avisar(`La clave "${clave}" ya está registrada en otro grupo.`, "err");
      form.clave.focus();
      return;
    }

    if (!Number.isInteger(alumnos) || alumnos < 1) {
      avisar("El número de alumnos debe ser un entero mayor a 0.", "err");
      form.alumnos.focus();
      return;
    }

    // no dejar menos alumnos de los que ya respondieron
    const ya = editando >= 0 ? participacionDe(lista[editando]).ya : 0;
    if (alumnos < ya) {
      avisar(`Este grupo ya tiene ${ya} alumnos que respondieron. No puedes poner menos.`, "err");
      form.alumnos.focus();
      return;
    }

    // solo se mandan los datos del grupo; las participaciones las calcula el servidor
    const item = { clave, carrera: d.carrera, cuatrimestre: Number(d.cuatrimestre), alumnos };

    if (editando >= 0) lista[editando] = item;
    else lista.push(item);

    await setGrupos(lista);
    avisar(editando >= 0 ? "Grupo actualizado." : "Grupo registrado.");
    e.target.reset();
    form.hidden = true;
    editando = -1;
    dibujar();
  };

  tabla.onclick = async e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");

    if (ed) abrirForm(+ed.dataset.ed);

    if (del) {
      const lista = getGrupos() || [];
      const g = lista[+del.dataset.del];
<<<<<<< HEAD
      // nada se borra: el grupo, sus asignaciones y sus códigos solo se desactivan
      if (!await confirmar('No se borra: queda desactivado y lo puedes recuperar en "Ver eliminados". ' +
        "También se desactivan sus asignaciones de Carga Académica y sus códigos dejan de servir.",
        { titulo: `¿Desactivar el grupo ${g.clave}?`, si: "Desactivar", peligro: true })) return;
=======
      // si tiene clases en carga academica la BD no deja borrarlo, mejor avisar antes
      if ((getClases() || []).some(c => c.grupoId === g.clave))
        return avisar(`El grupo ${g.clave} tiene asignaciones en Carga Académica. Elimínalas primero.`, "err");
      if (!await confirmar("El grupo se quita de la lista. Esta acción no se puede deshacer.", { titulo: `¿Eliminar el grupo ${g.clave}?`, si: "Eliminar", peligro: true })) return;
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
      lista.splice(+del.dataset.del, 1);
      await setGrupos(lista);
      await refrescarDatos();
      dibujar();
    }
  };

  if (desuscribir) desuscribir();
  desuscribir = alCambiarDatos("admin_carreras", () => {
    llenarFiltroCarreras();
    if (!form.hidden) llenarCarreras(form, form.carrera.value);
  });

  // ---- filtros: buscar por clave, carrera y cuatrimestre ----
  const fBuscar = buscar("#g-buscar", cont), fCarrera = buscar("#g-f-carrera", cont), fCuatri = buscar("#g-f-cuatri", cont);
  const llenarFiltroCarreras = () => {
    const previa = fCarrera.value;
    fCarrera.innerHTML = '<option value="">Todas las carreras</option>' +
      (getCarreras() || []).map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
    fCarrera.value = previa;
  };
  llenarFiltroCarreras();
  fCuatri.innerHTML = '<option value="">Todos los cuatrimestres</option>' +
    Array.from({ length: 11 }, (_, i) => `<option value="${i + 1}">${i + 1}°</option>`).join("");
  fBuscar.addEventListener("input", dibujar);
  fCarrera.addEventListener("change", dibujar);
  fCuatri.addEventListener("change", dibujar);

  dibujar();

  function abrirForm(i) {
    editando = i;
    form.hidden = false;
    buscar("#g-titulo", cont).textContent = i >= 0 ? "Editar grupo" : "Nuevo grupo";

    if (i >= 0) {
      const g = getGrupos()[i];
      llenarCarreras(form, g.carrera);
      form.clave.value = g.clave;
      form.cuatrimestre.value = g.cuatrimestre;
      form.alumnos.value = g.alumnos ?? "";   // grupos viejos no lo traen
    } else {
      form.reset();
      llenarCarreras(form);
    }
    form.clave.focus();
  }

  function dibujar() {
    const lista = getGrupos() || [];
<<<<<<< HEAD
    const q = campoBuscar ? campoBuscar.value : "";
    const visibles = filtrar(lista, q, g => `${g.clave} ${g.carrera} ${g.cuatrimestre}`);
    const total = buscar("#g-total", cont);
    if (total) total.textContent = resumen(visibles.length, lista.length, "registrado", "registrados");

    tabla.innerHTML = visibles.length
      ? visibles.map(([g, i]) => {
          const ya = respondieron(g.clave);
          const pct = g.alumnos ? Math.min(100, Math.round(ya / g.alumnos * 100)) : null;
=======
    const q = fBuscar.value.trim().toUpperCase(), c = fCarrera.value, ct = fCuatri.value;
    // cada fila guarda su lugar real en la lista para que Editar y Eliminar apunten bien aunque haya filtros
    const visibles = lista.map((g, i) => [g, i]).filter(([g]) =>
      (!q || g.clave.includes(q)) && (!c || g.carrera === c) && (!ct || String(g.cuatrimestre) === ct));

    const total = buscar("#g-total", cont);
    if (total) total.textContent = visibles.length === lista.length
      ? lista.length + (lista.length === 1 ? " registrado" : " registrados")
      : `${visibles.length} de ${lista.length}`;

    tabla.innerHTML = visibles.length
      ? visibles.map(([g, i]) => {
          const { ya, pct, clases } = participacionDe(g);
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
          return `
          <tr>
            <td><span class="chip clave">${esc(g.clave)}</span></td>
            <td>${esc(g.carrera)}</td>
            <td><span class="chip">${esc(g.cuatrimestre)}°</span></td>
            <td>${g.alumnos || "—"}</td>
            <td>${clases || '<span class="sub">0</span>'}</td>
            <td>${g.alumnos ? `${ya} / ${g.alumnos}` : ya}</td>
            <td style="min-width:8rem">
              ${pct === null
                ? `<span class="badge warn">Falta # de alumnos</span>`
                : `<div class="prog"><i style="width:${pct}%"></i></div><small class="sub">${pct}%</small>`}
            </td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`;
        }).join("")
<<<<<<< HEAD
      : q.trim()
        ? `<tr><td colspan="7" class="vacio">Nada coincide con "${esc(q.trim())}".</td></tr>`
        : `<tr><td colspan="7" class="vacio">Todavía no hay grupos. Toca "+ Nuevo grupo".</td></tr>`;
=======
      : `<tr><td colspan="8" class="vacio">${lista.length ? "Ningún grupo coincide con los filtros." : 'Todavía no hay grupos. Toca "+ Nuevo grupo".'}</td></tr>`;
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
  }
}
