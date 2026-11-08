// /static/pantallas/admin/grupos.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getGrupos, setGrupos, getCarreras, getEvaluaciones, alCambiarDatos } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;
let desuscribir = null;

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// alumnos que ya respondieron en un grupo:
// cada alumno manda 1 evaluación por materia, así que tomo la materia con más evaluaciones
function respondieron(clave) {
  const cuenta = {};
  (getEvaluaciones() || []).filter(e => e.grupo === clave).forEach(e => {
    const k = `${e.profesor}|${e.materia}`;
    cuenta[k] = (cuenta[k] || 0) + 1;
  });
  return Math.max(0, ...Object.values(cuenta));
}

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

  form.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const clave = d.clave.trim().toUpperCase();
    const alumnos = Number(d.alumnos);
    const lista = getGrupos() || [];

    if (lista.some((g, i) => i !== editando && g.clave === clave)) {
      alert(`Error: La clave "${clave}" ya está registrada en otro grupo.`);
      form.clave.focus();
      return;
    }

    if (!Number.isInteger(alumnos) || alumnos < 1) {
      alert("El número de alumnos debe ser un entero mayor a 0.");
      form.alumnos.focus();
      return;
    }

    // no dejar menos alumnos de los que ya respondieron
    const claveVieja = editando >= 0 ? lista[editando].clave : clave;
    const ya = respondieron(claveVieja);
    if (alumnos < ya) {
      alert(`Este grupo ya tiene ${ya} alumnos que respondieron. No puedes poner menos.`);
      form.alumnos.focus();
      return;
    }

    const item = { clave, carrera: d.carrera, cuatrimestre: Number(d.cuatrimestre), alumnos };

    if (editando >= 0) lista[editando] = item;
    else lista.push(item);

    setGrupos(lista);
    e.target.reset();
    form.hidden = true;
    editando = -1;
    dibujar();
  };

  tabla.onclick = e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");

    if (ed) abrirForm(+ed.dataset.ed);

    if (del) {
      if (!confirm("¿Eliminar este grupo?")) return;
      const lista = getGrupos() || [];
      lista.splice(+del.dataset.del, 1);
      setGrupos(lista);
      dibujar();
    }
  };

  if (desuscribir) desuscribir();
  desuscribir = alCambiarDatos("admin_carreras", () => {
    if (!form.hidden) llenarCarreras(form, form.carrera.value);
  });

  dibujar();

  function abrirForm(i) {
    editando = i;
    form.hidden = false;

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
    const total = buscar("#g-total", cont);
    if (total) total.textContent = lista.length + (lista.length === 1 ? " registrado" : " registrados");

    tabla.innerHTML = lista.length
      ? lista.map((g, i) => {
          const ya = respondieron(g.clave);
          const pct = g.alumnos ? Math.min(100, Math.round(ya / g.alumnos * 100)) : null;
          return `
          <tr>
            <td><span class="chip clave">${esc(g.clave)}</span></td>
            <td>${esc(g.carrera)}</td>
            <td><span class="chip">${esc(g.cuatrimestre)}°</span></td>
            <td>${g.alumnos ?? "—"}</td>
            <td>${g.alumnos ? `${ya} / ${g.alumnos}` : ya}</td>
            <td style="min-width:8rem">
              ${pct === null
                ? `<span style="color:var(--mut);font-size:.85rem">Edita el grupo</span>`
                : `<div class="prog"><i style="width:${pct}%"></i></div><small>${pct}%</small>`}
            </td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="7" class="vacio">Todavía no hay grupos. Toca "+ Nuevo grupo".</td></tr>`;
  }
}