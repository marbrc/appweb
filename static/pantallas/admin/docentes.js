// /static/pantallas/admin/docentes.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getDocentes, setDocentes } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  const btnNuevo = buscar("#d-nuevo", cont);
  const form = buscar("#d-form", cont);
  const btnCancelar = buscar("#d-cancelar", cont);
  const tabla = buscar("#d-tabla", cont);

  if (!btnNuevo || !form || !btnCancelar || !tabla) {
    console.error("Faltan elementos en el HTML de docentes");
    return;
  }

  btnNuevo.onclick = () => abrirForm(-1);
  btnCancelar.onclick = () => { form.hidden = true; };

  form.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    
    // Limpiamos los campos
    const nombres = d.nombres.trim().replace(/\s+/g, ' ');
    const paterno = d.paterno.trim().replace(/\s+/g, ' ');
    const materno = d.materno ? d.materno.trim().replace(/\s+/g, ' ') : "";

    // Validación de cantidad de nombres (máximo 5)
    if (nombres.split(' ').length > 5) {
      alert("Error: El campo de nombres no puede tener más de 5 palabras.");
      return;
    }

    // Unimos para el nombre completo (ignorando materno si está vacío)
    const nombreCompleto = `${nombres} ${paterno}${materno ? ' ' + materno : ''}`;

    const lista = getDocentes();
    
    // Guardamos el nombre completo junto con las partes separadas por si se necesita editar después
    const item = {
      nombre: nombreCompleto,
      nombres: nombres,
      paterno: paterno,
      materno: materno,
      correo: d.correo.trim().toLowerCase()
    };

    if (editando >= 0) {
      lista[editando] = item;
    } else {
      lista.push(item);
    }

    setDocentes(lista);
    
    e.target.reset();
    form.hidden = true;
    dibujar();
  };

  tabla.onclick = e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");
    
    if (ed) {
      abrirForm(+ed.dataset.ed);
    }
    
    if (del) {
      if (!confirm("¿Eliminar este docente?")) return;
      const lista = getDocentes();
      lista.splice(+del.dataset.del, 1);
      setDocentes(lista);
      dibujar();
    }
  };

  dibujar();

  function abrirForm(i) {
    editando = i;
    form.hidden = false;
    if (i >= 0) {
      const doc = getDocentes()[i];
      
      // Si el docente ya existía antes (y no tenía separados los campos), lo separamos
      // asumiendo que las últimas 2 palabras son apellidos.
      if (doc.nombres) {
        form.nombres.value = doc.nombres;
        form.paterno.value = doc.paterno || "";
        form.materno.value = doc.materno || "";
      } else {
        const partes = doc.nombre.split(' ');
        const total = partes.length;
        if (total >= 3) {
          form.materno.value = partes.pop();
          form.paterno.value = partes.pop();
        } else if (total === 2) {
          form.paterno.value = partes.pop();
        }
        form.nombres.value = partes.join(' ');
      }
      
      form.correo.value = doc.correo;
    } else {
      form.reset();
    }
    form.nombres.focus();
  }

  function dibujar() {
    const lista = getDocentes();
    tabla.innerHTML = lista.length
      ? lista.map((doc, i) => `
          <tr>
            <td>${doc.nombre}</td>
            <td>${doc.correo}</td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="3" class="vacio">Todavía no hay docentes. Toca "+ Nuevo docente".</td></tr>`;
  }
}