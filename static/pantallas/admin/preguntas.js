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
    
    // 1. Limpiamos el texto
    let textoLimpio = datos.texto.trim();

    // 2. VALIDACIÓN: Longitud mínima y máxima
    if (textoLimpio.length < 10) {
      alert("Error: La pregunta debe tener al menos 10 caracteres.");
      form.texto.focus();
      return;
    }
    if (textoLimpio.length > 250) {
      alert("Error: La pregunta no puede tener más de 250 caracteres.");
      form.texto.focus();
      return;
    }

    // 3. Forzar mayúscula inicial
    textoLimpio = textoLimpio.charAt(0).toUpperCase() + textoLimpio.slice(1);

    if (editando >= 0) {
      // Si estamos editando, conservamos el número que ya tenía
      preguntas[editando].texto = textoLimpio;
    } else {
      // Si es nueva, le asignamos el siguiente número disponible
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
    // la pastillita de arriba que dice cuantas preguntas hay (el if es por si el html no la trae)
    const total = buscar("#p-total", cont);
    if (total) total.textContent = preguntas.length + (preguntas.length === 1 ? " pregunta" : " preguntas");
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