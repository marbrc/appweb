// /static/pantallas/admin/preguntas.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getPreguntas, setPreguntas } from "/static/js/nucleo/datos.js";

const CLAVE = "admin_preguntas";
const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || []; } catch { return []; } };
const guardar = v => localStorage.setItem(CLAVE, JSON.stringify(v));

let cont = null;
let editando = -1;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  buscar("#p-nuevo", cont).onclick = () => abrirForm(-1);
  buscar("#p-cancelar", cont).onclick = () => { buscar("#p-form", cont).hidden = true; };

  buscar("#p-form", cont).onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const lista = leer();
    const item = { num: Number(d.num), texto: d.texto.trim() };
    if (editando >= 0) lista[editando] = item;
    else lista.push(item);
    guardar(lista);
    e.target.reset();
    buscar("#p-form", cont).hidden = true;
    dibujar();
  };

  buscar("#p-lista", cont).onclick = e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");
    if (ed) abrirForm(+ed.dataset.ed);
    if (del && confirm("¿Eliminar esta pregunta?")) {
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
  const f = buscar("#p-form", cont);
  f.hidden = false;
  if (i >= 0) {
    const p = leer()[i];
    f.num.value = p.num;
    f.texto.value = p.texto;
  } else f.reset();
  f.texto.focus();
}

function dibujar() {
  const lista = leer();
  buscar("#p-lista", cont).innerHTML = lista.length
    ? lista.map((p, i) => `
        <li class="pregunta-item">
          <span class="num">${p.num}</span>
          <p>${p.texto}</p>
          <div class="acciones-fila">
            <button class="mini" type="button" data-ed="${i}">Editar</button>
            <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
          </div>
        </li>`).join("")
    : `<li class="vacio">Todavía no hay preguntas.</li>`;
}