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
  const selDocente = buscar("#cl-sel-docente", cont);
  const selAsignatura = buscar("#cl-sel-asignatura", cont);

  if (!btnNuevo || !form || !tabla) return;

  // --- CARGAR DATOS INICIALES ---
  function cargarGruposYDocentes() {
    const grupos = getGrupos() || [];
    const docentes = getDocentes() || [];

    selGrupo.innerHTML = '<option value="">Selecciona un grupo...</option>';
    grupos.forEach(g => {
      selGrupo.innerHTML += `<option value="${g.clave}">${g.clave} (${g.carrera})</option>`;
    });

    selDocente.innerHTML = '<option value="">Elige grupo primero...</option>';
    selDocente.disabled = true;

    selAsignatura.innerHTML = '<option value="">Elige grupo y docente primero...</option>';
    selAsignatura.disabled = true;
  }

  // --- EVENTOS EN CASCADA ---
  selGrupo.onchange = () => {
    const grupo = selGrupo.value;
    selAsignatura.innerHTML = '<option value="">Elige grupo y docente primero...</option>';
    selAsignatura.disabled = true;

    if (grupo) {
      const docentes = getDocentes() || [];
      selDocente.innerHTML = '<option value="">Selecciona un docente...</option>';
      docentes.forEach(d => {
        const valor = d.correo || d.nombre;
        selDocente.innerHTML += `<option value="${valor}">${d.nombre}</option>`;
      });
      selDocente.disabled = false;
    } else {
      selDocente.innerHTML = '<option value="">Elige grupo primero...</option>';
      selDocente.disabled = true;
    }
  };

  selDocente.onchange = () => {
    const grupo = selGrupo.value;
    const docente = selDocente.value;
    
    if (grupo && docente) {
      const asignaturas = getAsignaturas() || [];
      const clases = getClases() || [];
      
      // Buscamos qué materias YA TIENEN MAESTRO en este grupo
      const materiasOcupadas = clases.filter(c => c.grupoId === grupo).map(c => c.asignaturaId);
      
      // Filtramos el catálogo para dejar SOLO las que no tienen maestro
      const materiasDisponibles = asignaturas.filter(a => !materiasOcupadas.includes(a.nombre));

      if (materiasDisponibles.length === 0) {
        selAsignatura.innerHTML = '<option value="">Este grupo ya tiene todas las materias asignadas</option>';
        selAsignatura.disabled = true;
      } else {
        selAsignatura.innerHTML = '<option value="">Selecciona la materia que imparte...</option>';
        materiasDisponibles.forEach(a => {
          selAsignatura.innerHTML += `<option value="${a.nombre}">${a.nombre}</option>`;
        });
        selAsignatura.disabled = false;
      }
    } else {
      selAsignatura.innerHTML = '<option value="">Elige grupo y docente primero...</option>';
      selAsignatura.disabled = true;
    }
  };

  // --- ABRIR Y CERRAR FORMULARIO ---
  btnNuevo.onclick = () => {
    form.hidden = false;
    form.reset();
    cargarGruposYDocentes();
  };
  
  btnCancelar.onclick = () => { form.hidden = true; };

  // --- GUARDAR ---
  form.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));

    if (!d.grupo || !d.docente || !d.asignatura) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    // DOBLE VALIDACIÓN: Evitar que una materia tenga 2 maestros en el mismo grupo
    const clases = getClases() || [];
    const existe = clases.some(c => c.grupoId === d.grupo && c.asignaturaId === d.asignatura);
    
    if (existe) {
      alert("Error: Esta materia ya tiene un docente asignado en este grupo. Elimina la asignación anterior primero.");
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
    const docentes = getDocentes() || [];
    
    tabla.innerHTML = clases.length
      ? clases.map((c, i) => {
          const docenteInfo = docentes.find(d => d.correo === c.docenteId || d.nombre === c.docenteId);
          const nombreDocente = docenteInfo ? docenteInfo.nombre : c.docenteId;

          return `
          <tr>
            <td><b>${c.grupoId}</b></td>
            <td>${nombreDocente}</td>
            <td>${c.asignaturaId}</td>
            <td class="acciones-fila">
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="4" class="vacio">No hay asignaciones registradas. Toca "+ Nueva asignación".</td></tr>`;
  }

  alCambiarDatos("admin_grupos", cargarGruposYDocentes);
  alCambiarDatos("admin_docentes", cargarGruposYDocentes);
  alCambiarDatos("admin_clases", dibujar);

  dibujar();
}