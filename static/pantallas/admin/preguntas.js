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
    
    // Limpiamos el texto y nos aseguramos de que la primera letra sea mayúscula
    let textoLimpio = datos.texto.trim();
    if (textoLimpio.length > 0) {
      textoLimpio = textoLimpio.charAt(0).toUpperCase() + textoLimpio.slice(1);
    }

    if (editando >= 0) {
      // Si estamos editando, conservamos el número que ya tenía
      preguntas[editando].texto = textoLimpio;
    } else {
      // Si es nueva, le asignamos el siguiente número disponible
      // (buscamos el número más alto actual y le sumamos 1)
      const numMax = preguntas.reduce((max, p) => Math.max(max, p.num), 0);
      preguntas.push({ 
        num: numMax + 1, 
        texto: textoLimpio 
      });
    }

    // Ordenar por número por seguridad
    preguntas.sort((a, b) => a.num - b.num);
    
    // Reasignar números secuenciales (1, 2, 3...) para evitar huecos
    preguntas.forEach((p, i) => p.num = i + 1);

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
      
      // Reajustar los números después de eliminar (1, 2, 3...)
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