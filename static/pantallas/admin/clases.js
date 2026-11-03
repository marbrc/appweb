// /static/pantallas/admin/clases.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getGrupos, getAsignaturas, getDocentes, getClases, addClase, setClases, alCambiarDatos } from "/static/js/nucleo/datos.js";

let cont = null;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  const btnNuevo = buscar("#cl-nuevo", cont);
  const form = buscar("#cl-form", cont);
  const btnCancelar = buscar("#cl-cancelar", cont);
  const tabla = buscar("#cl-tabla", cont);

  const selGrupo = buscar("#cl-sel-grupo", cont);
  const selAsignatura = buscar("#cl-sel-asignatura", cont);
  const selDocente = buscar("#cl-sel-docente", cont);

  if (!btnNuevo || !form || !tabla) {
    console.error("Faltan elementos en el HTML de clases. Revisa los IDs.");
    return;
  }

  btnNuevo.onclick = () => {
    form.hidden = false;
    form.reset();
    cargarSelects(); // Jalamos los datos frescos de LocalStorage
  };
  
  btnCancelar.onclick = () => { form.hidden = true; };

  // --- LÓGICA PARA LLENAR LOS SELECTS DINÁMICAMENTE ---
  function cargarSelects() {
    const grupos = getGrupos() || [];
    const asignaturas = getAsignaturas() || [];
    const docentes = getDocentes() || [];

    // Llenar Grupos
    selGrupo.innerHTML = '<option value="">Selecciona un grupo...</option>';
    grupos.forEach(g => {
      selGrupo.innerHTML += `<option value="${g.clave}">${g.clave} (${g.carrera} - C${g.cuatrimestre})</option>`;
    });

    // Llenar Asignaturas
    selAsignatura.innerHTML = '<option value="">Selecciona una materia...</option>';
    asignaturas.forEach(a => {
      selAsignatura.innerHTML += `<option value="${a.nombre}">${a.nombre}</option>`;
    });

    // Llenar Docentes (Usamos el correo o nombre como ID único)
    selDocente.innerHTML = '<option value="">Selecciona un docente...</option>';
    docentes.forEach(d => {
      const valor = d.correo || d.nombre;
      selDocente.innerHTML += `<option value="${valor}">${d.nombre}</option>`;
    });
  }

  // --- GUARDAR ---
  form.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));

    if (!d.grupo || !d.asignatura || !d.docente) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    // Validar que no se asigne la misma materia al mismo grupo dos veces
    const clases = getClases() || [];
    const existe = clases.some(c => 
      c.grupoId === d.grupo && 
      c.asignaturaId === d.asignatura
    );

    if (existe) {
      alert("Esta asignatura ya está asignada a este grupo.");
      return;
    }

    const nuevaClase = {
      grupoId: d.grupo,
      asignaturaId: d.asignatura,
      docenteId: d.docente,
      id: Date.now()
    };

    addClase(nuevaClase);
    form.reset();
    form.hidden = true;
    dibujar();
  };

  // --- ELIMINAR ---
  tabla.onclick = e => {
    const del = e.target.closest("[data-del]");
    if (del) {
      if (!confirm("¿Eliminar esta asignación?")) return;
      const lista = getClases();
      lista.splice(+del.dataset.del, 1);
      setClases(lista);
      dibujar();
    }
  };

  // --- DIBUJAR TABLA ---
  function dibujar() {
    const clases = getClases() || [];
    
    tabla.innerHTML = clases.length
      ? clases.map((c, i) => `
          <tr>
            <td><b>${c.grupoId}</b></td>
            <td>${c.asignaturaId}</td>
            <td>${c.docenteId}</td>
            <td class="acciones-fila">
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="4" class="vacio">No hay asignaciones registradas. Toca "+ Nueva asignación".</td></tr>`;
  }

  // Actualizar si algo cambia en otra pestaña o pantalla
  alCambiarDatos("admin_grupos", cargarSelects);
  alCambiarDatos("admin_asignaturas", cargarSelects);
  alCambiarDatos("admin_docentes", cargarSelects);
  alCambiarDatos("admin_clases", dibujar);

  dibujar();
}