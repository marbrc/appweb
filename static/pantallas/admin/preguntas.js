// /static/pantallas/admin/preguntas.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getPreguntas, setPreguntas } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  const btnNuevo = buscar("#p-nuevo", cont);
  const form = buscar("#p-form", cont);
  const btnCancelar = buscar("#p-cancelar", cont);
  const lista = buscar("#p-lista", cont);
  const texto = buscar("#p-texto", cont);
  const contador = buscar("#p-cont", cont);
  const titulo = buscar("#p-titulo", cont);

  if (!btnNuevo || !form || !btnCancelar || !lista || !texto) {
    console.error("Faltan elementos del HTML de preguntas");
    return;
  }

  const numerar = arr => arr.forEach((p, i) => p.num = i + 1);
  const actualizarContador = () => { contador.textContent = `${texto.value.length}/250`; };
  texto.addEventListener("input", actualizarContador);

  const cerrar = () => { form.reset(); form.hidden = true; editando = -1; actualizarContador(); };

  btnNuevo.onclick = () => abrirForm(-1);
  btnCancelar.onclick = cerrar;

  // --- GUARDAR ---
  form.onsubmit = e => {
    e.preventDefault();
    const preguntas = getPreguntas() || [];

    let t = texto.value.trim().replace(/\s+/g, " ");
    if (t.length < 10) return alert("La pregunta debe tener al menos 10 caracteres.");
    if (t.length > 250) return alert("La pregunta no puede tener más de 250 caracteres.");

    t = t.charAt(0).toUpperCase() + t.slice(1);

    const repetida = preguntas.some((p, i) => i !== editando && p.texto.toLowerCase() === t.toLowerCase());
    if (repetida) return alert("Esa pregunta ya existe.");

    if (editando >= 0) preguntas[editando].texto = t;
    else preguntas.push({ num: preguntas.length + 1, texto: t });

    numerar(preguntas);
    setPreguntas(preguntas);
    cerrar();
    dibujar();
  };

  // --- EDITAR / ELIMINAR / MOVER ---
  lista.onclick = e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");
    const mv = e.target.closest("[data-mv]");

    if (ed) abrirForm(+ed.dataset.ed);

    if (del) {
      const preguntas = getPreguntas() || [];
      const i = +del.dataset.del;
      if (!confirm(`¿Eliminar la pregunta ${preguntas[i].num}?`)) return;
      preguntas.splice(i, 1);
      numerar(preguntas);
      setPreguntas(preguntas);
      if (editando === i) cerrar();
      dibujar();
    }

    if (mv) {
      const preguntas = getPreguntas() || [];
      const i = +mv.dataset.i;
      const j = i + (+mv.dataset.mv);
      if (j < 0 || j >= preguntas.length) return;
      [preguntas[i], preguntas[j]] = [preguntas[j], preguntas[i]];
      numerar(preguntas);
      setPreguntas(preguntas);
      editando = -1;
      form.hidden = true;
      dibujar();
    }
  };

  function abrirForm(i) {
    editando = i;
    form.hidden = false;
    if (i >= 0) {
      texto.value = (getPreguntas() || [])[i].texto;
      titulo.textContent = `Editar pregunta ${i + 1}`;
    } else {
      form.reset();
      titulo.textContent = "Nueva pregunta";
    }
    actualizarContador();
    texto.focus();
  }

  function dibujar() {
    const preguntas = getPreguntas() || [];
    const total = buscar("#p-total", cont);
    if (total) total.textContent = preguntas.length + (preguntas.length === 1 ? " pregunta" : " preguntas");

    lista.innerHTML = preguntas.length
      ? preguntas.map((p, i) => `
          <li class="pregunta-item">
            <span class="num">${p.num}</span>
            <p>${esc(p.texto)}</p>
            <div class="acciones-fila">
              <button class="mini" type="button" data-mv="-1" data-i="${i}" title="Subir" ${i === 0 ? "disabled" : ""}>↑</button>
              <button class="mini" type="button" data-mv="1" data-i="${i}" title="Bajar" ${i === preguntas.length - 1 ? "disabled" : ""}>↓</button>
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </div>
          </li>`).join("")
      : `<li class="vacio">Todavía no hay preguntas. Toca "+ Nueva pregunta".</li>`;
  }

  dibujar();
}