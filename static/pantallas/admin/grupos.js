// /static/pantallas/admin/grupos.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getGrupos, setGrupos, getCarreras, alCambiarDatos } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;
let desuscribir = null;

// llena el select de carreras con lo que hay guardado en Carreras
function llenarCarreras(form, seleccionada = "") {
  const lista = getCarreras() || [];
  // si el grupo trae una carrera que ya no existe, la dejamos para no perderla al editar
  if (seleccionada && !lista.includes(seleccionada)) lista.push(seleccionada);
  
  form.carrera.innerHTML = '<option value="">Selecciona una carrera</option>';
  lista.forEach(c => {
    const o = document.createElement("option");
    o.value = c;
    o.textContent = c;
    form.carrera.appendChild(o);
  });
  form.carrera.value = seleccionada;
}

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);
  editando = -1;

  const btnNuevo = buscar("#g-nuevo", cont);
  const form = buscar("#g-form", cont);
  const btnCancelar = buscar("#g-cancelar", cont);
  const tabla = buscar("#g-tabla", cont);

  // Si falta algo en el HTML, lo avisamos en consola
  if (!btnNuevo || !form || !btnCancelar || !tabla) {
    console.error("Faltan elementos en el HTML de grupos. Revisa los IDs.");
    return;
  }

  // Asignar eventos a los botones
  btnNuevo.onclick = () => abrirForm(-1);
  btnCancelar.onclick = () => { form.reset(); form.hidden = true; editando = -1; };

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
      form.clave.focus();
      return;
    }
    
    // Objeto limpio SIN el docente
    const item = {
      clave: claveLimpia,
      carrera: d.carrera,
      cuatrimestre: Number(d.cuatrimestre)
    };

    if (editando >= 0) {
      lista[editando] = item;
    } else {
      lista.push(item);
    }

    setGrupos(lista);
    e.target.reset();
    form.hidden = true;
    editando = -1;
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

  // 🔁 Sincronización: si agregas una carrera nueva, que aparezca en el select al instante
  if (desuscribir) desuscribir();
  desuscribir = alCambiarDatos("admin_carreras", () => {
    // Solo recargamos el select si el formulario está abierto
    if (!form.hidden) llenarCarreras(form, form.carrera.value);
  });

  dibujar();

  function abrirForm(i) {
    editando = i;
    form.hidden = false;
    
    if (i >= 0) {
      const g = getGrupos()[i];
      llenarCarreras(form, g.carrera);
      form.clave.value = g.clave;
      form.cuatrimestre.value = g.cuatrimestre;
    } else {
      form.reset();
      llenarCarreras(form);
    }
    form.clave.focus();
  }

  function dibujar() {
    const lista = getGrupos() || [];
    // la pastillita de arriba que dice cuantos grupos hay
    const total = buscar("#g-total", cont);
    if (total) total.textContent = lista.length + (lista.length === 1 ? " registrado" : " registrados");
    
    tabla.innerHTML = lista.length
      ? lista.map((g, i) => `
          <tr>
            <td><span class="chip clave">${g.clave}</span></td>
            <td>${g.carrera}</td>
            <td><span class="chip">${g.cuatrimestre}°</span></td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="4" class="vacio">Todavía no hay grupos. Toca "+ Nuevo grupo".</td></tr>`;
  }
}