import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getAsignaturas, setAsignaturas } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

// Solo letras (con tildes y ñ/ü), primera letra mayúscula,
// y opcionalmente un número romano en mayúscula al final.
const REGEX_NOMBRE = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñü\s]*(?:\s+[IVXLCDM]+)?$/;
const MSG_NOMBRE =
  "El nombre solo debe contener letras, empezar con mayúscula y puede terminar con número romano en mayúscula (ej. Inglés IV).";

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  const btnNuevo = buscar("#s-nuevo", cont);
  const form = buscar("#s-form", cont);
  const btnCancelar = buscar("#s-cancelar", cont);
  const tabla = buscar("#s-tabla", cont);

  if (!btnNuevo || !form || !btnCancelar || !tabla) {
    console.error("Faltan elementos en el HTML de asignaturas");
    return;
  }

  btnNuevo.onclick = () => abrirForm(-1);
  btnCancelar.onclick = () => { form.hidden = true; };

  form.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));

    let nombre = (d.nombre || "").trim();
    const carrera = (d.carrera || "").trim();
    const cuatrimestre = Number(d.cuatrimestre);

    // Validar nombre obligatorio
    if (!nombre) {
      alert("El nombre de la asignatura es obligatorio.");
      form.nombre.focus();
      return;
    }

    // Forzar primera letra mayúscula (por si acaso)
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    // VALIDAR FORMATO: solo letras, primera mayúscula, romano opcional al final
    if (!REGEX_NOMBRE.test(nombre)) {
      alert(MSG_NOMBRE);
      form.nombre.focus();
      return;
    }

    // VALIDACIÓN DE DUPLICADOS (ignorando mayúsculas/minúsculas)
    const lista = getAsignaturas();
    const existe = lista.some((a, index) => {
      if (editando >= 0 && index === editando) return false; // Si es la misma que estamos editando, no cuenta
      return a.nombre.toLowerCase() === nombre.toLowerCase();
    });

    if (existe) {
      alert(`Error: La asignatura "${nombre}" ya está registrada.`);
      form.nombre.focus();
      return;
    }

    const item = {
      nombre,
      carrera,
      cuatrimestre
    };

    if (editando >= 0) {
      lista[editando] = item;
    } else {
      lista.push(item);
    }

    setAsignaturas(lista); // Guardar en datos.js

    e.target.reset();
    form.hidden = true;
    dibujar();
  };

  tabla.onclick = e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");

    if (ed) abrirForm(+ed.dataset.ed);

    if (del && confirm("¿Eliminar esta asignatura?")) {
      const lista = getAsignaturas();
      lista.splice(+del.dataset.del, 1);
      setAsignaturas(lista);
      dibujar();
    }
  };

  dibujar();

  function abrirForm(i) {
    editando = i;
    form.hidden = false;

    if (i >= 0) {
      const a = getAsignaturas()[i];
      form.nombre.value = a.nombre;
      form.carrera.value = a.carrera;
      form.cuatrimestre.value = a.cuatrimestre;
    } else {
      form.reset();
    }
    form.nombre.focus();
  }

  function dibujar() {
    const lista = getAsignaturas();
    // la pastillita de arriba que dice cuantas asignaturas hay (el if es por si el html no la trae)
    const total = buscar("#s-total", cont);
    if (total) total.textContent = lista.length + (lista.length === 1 ? " registrada" : " registradas");
    tabla.innerHTML = lista.length
      ? lista.map((a, i) => `
          <tr>
            <td><b>${a.nombre}</b></td>
            <td>${a.carrera}</td>
            <td><span class="chip">${a.cuatrimestre}°</span></td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="4" class="vacio">Todavía no hay asignaturas.</td></tr>`;
  }
}