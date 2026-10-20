// /static/pantallas/admin/grupos.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";

// ---------- almacenamiento local ----------
const CLAVE = "admin_grupos";
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch { return []; } };
const guardar = v => localStorage.setItem(CLAVE, JSON.stringify(v));

let cont = null;
let editando = -1;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  // conecta botones y formulario
  buscar("#g-nuevo", cont).onclick = () => abrirForm(-1);
  buscar("#g-cancelar", cont).onclick = () => { buscar("#g-form", cont).hidden = true; };

  buscar("#g-form", cont).onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const lista = leer();
    const item = {
      clave: d.clave.trim(),
      carrera: d.carrera,
      cuatrimestre: Number(d.cuatrimestre)
    };
    if (editando >= 0) lista[editando] = item;
    else lista.push(item);
    guardar(lista);
    e.target.reset();
    buscar("#g-form", cont).hidden = true;
    dibujar();
  };

  // delegación de clics en la tabla
  buscar("#g-tabla", cont).onclick = e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");
    if (ed) abrirForm(+ed.dataset.ed);
    if (del) {
      if (!confirm("¿Eliminar este grupo?")) return;
      const lista = leer();
      lista.splice(+del.dataset.del, 1);
      guardar(lista);
      dibujar();
    }
  };

  dibujar();
}

function abrirForm(i) {
  editando = i;
  const f = buscar("#g-form", cont);
  f.hidden = false;
  if (i >= 0) {
    const g = leer()[i];
    f.clave.value = g.clave;
    f.carrera.value = g.carrera;
    f.cuatrimestre.value = g.cuatrimestre;
  } else {
    f.reset();
  }
  f.clave.focus();
}

function dibujar() {
  const lista = leer();
  buscar("#g-tabla", cont).innerHTML = lista.length
    ? lista.map((g, i) => `
        <tr>
          <td>${g.clave}</td>
          <td>${g.carrera}</td>
          <td>${g.cuatrimestre}°</td>
          <td class="acciones-fila">
            <button class="mini" type="button" data-ed="${i}">Editar</button>
            <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="4" class="vacio">Todavía no hay grupos. Toca "+ Nuevo grupo".</td></tr>`;
}