// /static/pantallas/admin/docentes.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getDocentes, setDocentes } from "/static/js/nucleo/datos.js";

const CLAVE = "admin_docentes";
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch { return []; } };
const guardar = v => localStorage.setItem(CLAVE, JSON.stringify(v));

let cont = null;
let editando = -1;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  buscar("#d-nuevo", cont).onclick = () => abrirForm(-1);
  buscar("#d-cancelar", cont).onclick = () => { buscar("#d-form", cont).hidden = true; };

  buscar("#d-form", cont).onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const lista = leer();
    const item = { nombre: d.nombre.trim(), correo: d.correo.trim() };
    if (editando >= 0) lista[editando] = item;
    else lista.push(item);
    guardar(lista);
    e.target.reset();
    buscar("#d-form", cont).hidden = true;
    dibujar();
  };

  buscar("#d-tabla", cont).onclick = e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");
    if (ed) abrirForm(+ed.dataset.ed);
    if (del && confirm("¿Eliminar este docente?")) {
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
  const f = buscar("#d-form", cont);
  f.hidden = false;
  if (i >= 0) {
    const d = leer()[i];
    f.nombre.value = d.nombre;
    f.correo.value = d.correo;
  } else f.reset();
  f.nombre.focus();
}

function dibujar() {
  const lista = leer();
  buscar("#d-tabla", cont).innerHTML = lista.length
    ? lista.map((d, i) => `
        <tr>
          <td>${d.nombre}</td>
          <td>${d.correo}</td>
          <td class="acciones-fila">
            <button class="mini" type="button" data-ed="${i}">Editar</button>
            <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="3" class="vacio">Todavía no hay docentes.</td></tr>`;
}