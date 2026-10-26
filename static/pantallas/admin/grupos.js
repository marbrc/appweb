// /static/pantallas/admin/grupos.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getGrupos, setGrupos, getDocentes } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  const btnNuevo = buscar("#g-nuevo", cont);
  const form = buscar("#g-form", cont);
  const btnCancelar = buscar("#g-cancelar", cont);
  const tabla = buscar("#g-tabla", cont);
  const selectDocente = buscar("#g-docente", cont);

  // Si falta algo en el HTML, lo avisamos en consola
  if (!btnNuevo || !form || !btnCancelar || !tabla || !selectDocente) {
    console.error("Faltan elementos en el HTML de grupos. Revisa los IDs.");
    return;
  }

  // Llenar el select de docentes (con protección por si getDocentes falla)
  try {
    const docentes = getDocentes() || [];
    if (docentes.length === 0) {
      selectDocente.innerHTML = `<option value="">No hay docentes registrados</option>`;
    } else {
      selectDocente.innerHTML = `<option value="">Selecciona un docente</option>` +
        docentes.map(d => `<option value="${d.nombre}">${d.nombre}</option>`).join("");
    }
  } catch (error) {
    console.error("Error al cargar docentes:", error);
    selectDocente.innerHTML = `<option value="">Error al cargar docentes</option>`;
  }

  // Asignar eventos a los botones
  btnNuevo.onclick = () => abrirForm(-1);
  btnCancelar.onclick = () => { form.hidden = true; };

  form.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const claveLimpia = d.clave.trim().toUpperCase();
    const lista = getGrupos() || [];
    
    // Validar que la clave no exista
    const existe = lista.some((g, index) => {
      if (editando >= 0 && index === editando) return false;
      return g.clave === claveLimpia;
    });

    if (existe) {
      alert(`Error: La clave "${claveLimpia}" ya está registrada en otro grupo.`);
      return;
    }
    
    const item = {
      clave: claveLimpia,
      carrera: d.carrera,
      cuatrimestre: Number(d.cuatrimestre),
      docente: d.docente || "Sin docente"
    };

    if (editando >= 0) {
      lista[editando] = item;
    } else {
      lista.push(item);
    }

    setGrupos(lista);
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
      if (!confirm("¿Eliminar este grupo?")) return;
      const lista = getGrupos();
      lista.splice(+del.dataset.del, 1);
      setGrupos(lista);
      dibujar();
    }
  };

  dibujar();

  function abrirForm(i) {
    editando = i;
    form.hidden = false;
    if (i >= 0) {
      const g = getGrupos()[i];
      form.clave.value = g.clave;
      form.carrera.value = g.carrera;
      form.cuatrimestre.value = g.cuatrimestre;
      form.docente.value = g.docente || "";
    } else {
      form.reset();
    }
    form.clave.focus();
  }

  function dibujar() {
    const lista = getGrupos() || [];
    // la pastillita de arriba que dice cuantos grupos hay (el if es por si el html no la trae)
    const total = buscar("#g-total", cont);
    if (total) total.textContent = lista.length + (lista.length === 1 ? " registrado" : " registrados");
    tabla.innerHTML = lista.length
      ? lista.map((g, i) => `
          <tr>
            <td><span class="chip clave">${g.clave}</span></td>
            <td>${g.carrera}</td>
            <td><span class="chip">${g.cuatrimestre}°</span></td>
            <td>${g.docente || "—"}</td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="5" class="vacio">Todavía no hay grupos. Toca "+ Nuevo grupo".</td></tr>`;
  }
}