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

  if (!btnNuevo || !form || !btnCancelar || !tabla || !selectDocente) {
    console.error("Faltan elementos en el HTML de grupos");
    return;
  }

  // Función para llenar el select de docentes
  function cargarDocentes() {
    const docentes = getDocentes();
    selectDocente.innerHTML = `<option value="">Selecciona un docente</option>` +
      docentes.map(d => `<option value="${d.nombre}">${d.nombre}</option>`).join("");
  }
  cargarDocentes(); // Llenamos el select al abrir la pantalla

  btnNuevo.onclick = () => abrirForm(-1);
  btnCancelar.onclick = () => { form.hidden = true; };

  form.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const lista = getGrupos();
    
    const item = {
      clave: d.clave.trim().toUpperCase(),
      carrera: d.carrera,
      cuatrimestre: Number(d.cuatrimestre),
      docente: d.docente // <-- Guardamos el docente
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
      form.docente.value = g.docente || ""; // Selecciona el docente actual
    } else {
      form.reset();
    }
    form.clave.focus();
  }

  function dibujar() {
    const lista = getGrupos();
    tabla.innerHTML = lista.length
      ? lista.map((g, i) => `
          <tr>
            <td>${g.clave}</td>
            <td>${g.carrera}</td>
            <td>${g.cuatrimestre}°</td>
            <td>${g.docente || "—"}</td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="5" class="vacio">Todavía no hay grupos. Toca "+ Nuevo grupo".</td></tr>`;
  }
}