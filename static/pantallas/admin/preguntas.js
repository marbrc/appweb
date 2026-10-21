// /static/pantallas/admin/preguntas.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getPreguntas, setPreguntas } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  const btnNuevo = buscar("#p-nuevo", cont);
  const form = buscar("#p-form", cont);
  const btnCancelar = buscar("#p-cancelar", cont);
  const lista = buscar("#p-lista", cont);

  if (!btnNuevo || !form || !btnCancelar || !lista) {
    console.error("Faltan elementos del HTML de preguntas");
    return;
  }

  btnNuevo.onclick = () => abrirForm(-1);
  btnCancelar.onclick = () => { form.hidden = true; };

  form.onsubmit = e => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.target));
    const preguntas = getPreguntas();
    
    const item = { 
      num: Number(datos.num), 
      texto: datos.texto.trim() 
    };

    if (editando >= 0) {
      preguntas[editando] = item;
    } else {
      preguntas.push(item);
    }

    // Ordenar por número para que siempre salgan en orden en la encuesta
    preguntas.sort((a, b) => a.num - b.num);

    setPreguntas(preguntas);
    e.target.reset();
    form.hidden = true;
    dibujar();
  };

  lista.onclick = e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");
    
    if (ed) {
      abrirForm(+ed.dataset.ed);
    }
    
    if (del && confirm("¿Eliminar esta pregunta?")) {
      const preguntas = getPreguntas();
      preguntas.splice(+del.dataset.del, 1);
      
      // Reajustar los números después de eliminar
      preguntas.forEach((p, i) => p.num = i + 1);
      
      setPreguntas(preguntas);
      dibujar();
    }
  };

  dibujar();

  function abrirForm(i) {
    editando = i;
    form.hidden = false;
    if (i >= 0) {
      const p = getPreguntas()[i];
      form.num.value = p.num;
      form.texto.value = p.texto;
    } else {
      form.reset();
      // Sugerir el siguiente número
      form.num.value = getPreguntas().length + 1;
    }
    form.texto.focus();
  }

  function dibujar() {
    const preguntas = getPreguntas();
    lista.innerHTML = preguntas.length
      ? preguntas.map((p, i) => `
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
}