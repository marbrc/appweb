// /static/pantallas/admin/carreras.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getCarreras, setCarreras, alCambiarDatos, getGrupos, setGrupos } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;
let desuscribir = null;

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

  if (!btnNuevo || !form || !btnCancelar || !tabla) {
    console.error("Faltan elementos en el HTML de carreras. Revisa los IDs.");
    return;
  }

  btnNuevo.onclick = () => abrirForm(-1);
  btnCancelar.onclick = () => { form.reset(); form.hidden = true; editando = -1; };

  form.onsubmit = e => {
    e.preventDefault();
    
    let nombre = form.nombre.value.trim();
    if (!nombre) return;
    if (nombre.length > 200) {
      alert("El nombre de la carrera no puede exceder los 200 caracteres.");
      return;
    }

    nombre = nombre.toLowerCase();
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    if (!/^[A-ZÁÉÍÓÚÑ][a-záéíóúñü\s]*$/.test(nombre)) {
      alert("El formato es incorrecto. Solo la primera letra debe ser mayúscula y el resto minúsculas.");
      form.nombre.focus();
      return;
    }

    const lista = getCarreras() || [];

    const existe = lista.some((c, i) => i !== editando && c.toLowerCase() === nombre.toLowerCase());
    if (existe) {
      alert(`Error: La carrera "${nombre}" ya está registrada.`);
      form.nombre.focus();
      return;
    }

    if (editando >= 0) {
      const nombreAnterior = lista[editando];
      lista[editando] = nombre;
      setCarreras(lista);
      
      if (nombreAnterior !== nombre) {
        const grupos = getGrupos();
        let actualizados = false;
        grupos.forEach(g => {
          if (g.carrera === nombreAnterior) {
            g.carrera = nombre;
            actualizados = true;
          }
        });
        if (actualizados) setGrupos(grupos);
      }
    } else {
      lista.push(nombre);
      setCarreras(lista);
    }

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
      const nombreCarrera = lista[+del.dataset.del];
      
      const grupos = getGrupos();
      const gruposConCarrera = grupos.filter(g => g.carrera === nombreCarrera);
      
      // NUEVA LÓGICA DE BORRADO
      let mensaje = `¿Eliminar la carrera "${nombreCarrera}"?`;
      if (gruposConCarrera.length > 0) {
        mensaje += `\n\n¡ADVERTENCIA! Esta carrera tiene ${gruposConCarrera.length} grupo(s) asignado(s). Si la eliminas, también se eliminarán esos grupos.`;
      }

      if (!confirm(mensaje)) return;
      
      // 1. Eliminar la carrera
      lista.splice(+del.dataset.del, 1);
      setCarreras(lista);
      
      // 2. Si había grupos, eliminarlos también
      if (gruposConCarrera.length > 0) {
        const gruposRestantes = grupos.filter(g => g.carrera !== nombreCarrera);
        setGrupos(gruposRestantes);
      }
      
      dibujar();
    }
  };

  if (desuscribir) desuscribir();
  desuscribir = alCambiarDatos("admin_carreras", () => {
    const lista = getCarreras() || [];
    if (editando >= lista.length) {
      form.reset();
      form.hidden = true;
      editando = -1;
    } else if (editando >= 0 && form.hidden === false) {
      form.nombre.value = lista[editando];
    }
    dibujar();
  });

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
    const grupos = getGrupos() || [];
    
    const total = buscar("#c-total", cont);
    if (total) total.textContent = lista.length + (lista.length === 1 ? " registrada" : " registradas");

    tabla.innerHTML = lista.length
      ? lista.map((c, i) => {
          const qtyGrupos = grupos.filter(g => g.carrera === c).length;
          
          return `
          <tr>
            <td><span class="chip">${i + 1}</span></td>
            <td>${limpiar(c)}</td>
            <td><span class="chip">${qtyGrupos} grupo(s)</span></td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="4" class="vacio">Todavía no hay carreras. Toca "+ Nueva carrera".</td></tr>`;
  }
}