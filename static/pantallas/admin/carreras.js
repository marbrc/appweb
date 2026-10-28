// /static/pantallas/admin/carreras.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getCarreras, setCarreras } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

// por si alguien escribe < o & en el nombre, que no rompa la tabla
const limpiar = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);
  editando = -1;

  const btnNuevo = buscar("#c-nuevo", cont);
  const form = buscar("#c-form", cont);
  const btnCancelar = buscar("#c-cancelar", cont);
  const tabla = buscar("#c-tabla", cont);
  const titulo = buscar("#c-titulo", cont);

  // Si falta algo en el HTML, lo avisamos en consola
  if (!btnNuevo || !form || !btnCancelar || !tabla) {
    console.error("Faltan elementos en el HTML de carreras. Revisa los IDs.");
    return;
  }

  btnNuevo.onclick = () => abrirForm(-1);
  btnCancelar.onclick = () => { form.reset(); form.hidden = true; editando = -1; };

  form.onsubmit = e => {
    e.preventDefault();
    const nombre = form.nombre.value.trim();
    if (!nombre) return;

    const lista = getCarreras() || [];

    // Validar que no exista otra carrera igual (sin importar mayúsculas)
    const existe = lista.some((c, i) => i !== editando && c.toLowerCase() === nombre.toLowerCase());
    if (existe) {
      alert(`Error: La carrera "${nombre}" ya está registrada.`);
      return;
    }

    if (editando >= 0) lista[editando] = nombre;
    else lista.push(nombre);

    setCarreras(lista);
    form.reset();
    form.hidden = true;
    editando = -1;
    dibujar();
  };

  tabla.onclick = e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");

    if (ed) abrirForm(+ed.dataset.ed);

    if (del) {
      const lista = getCarreras();
      if (!confirm(`¿Eliminar la carrera "${lista[+del.dataset.del]}"?`)) return;
      lista.splice(+del.dataset.del, 1);
      setCarreras(lista);
      dibujar();
    }
  };

  dibujar();

  function abrirForm(i) {
    editando = i;
    form.hidden = false;
    form.reset();
    titulo.textContent = i >= 0 ? "Editar carrera" : "Datos de la carrera";
    if (i >= 0) form.nombre.value = getCarreras()[i];
    form.nombre.focus();
  }

  function dibujar() {
    const lista = getCarreras() || [];
    // la pastillita de arriba que dice cuantas carreras hay
    const total = buscar("#c-total", cont);
    if (total) total.textContent = lista.length + (lista.length === 1 ? " registrada" : " registradas");

    tabla.innerHTML = lista.length
      ? lista.map((c, i) => `
          <tr>
            <td><span class="chip">${i + 1}</span></td>
            <td>${limpiar(c)}</td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="3" class="vacio">Todavía no hay carreras. Toca "+ Nueva carrera".</td></tr>`;
  }
}