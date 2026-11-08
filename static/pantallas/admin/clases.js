// /static/pantallas/admin/clases.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getGrupos, getDocentes, getClases, addClase, setClases, alCambiarDatos } from "/static/js/nucleo/datos.js";

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

  const vaciarAsignatura = () => {
    selAsignatura.innerHTML = '<option value="">Elige grupo y docente primero...</option>';
    selAsignatura.disabled = true;
  };

  // --- CARGAR GRUPOS ---
  function cargarGruposYDocentes() {
    const grupos = getGrupos() || [];

    selGrupo.innerHTML = '<option value="">Selecciona un grupo...</option>' +
      grupos.map(g => `<option value="${g.clave}">${g.clave} (${g.carrera})</option>`).join("");

    selDocente.innerHTML = '<option value="">Elige grupo primero...</option>';
    selDocente.disabled = true;
    vaciarAsignatura();
  }

  // --- GRUPO -> DOCENTES ---
  selGrupo.onchange = () => {
    vaciarAsignatura();

    if (selGrupo.value) {
      const docentes = getDocentes() || [];
      selDocente.innerHTML = '<option value="">Selecciona un docente...</option>' +
        docentes.map(d => `<option value="${d.correo || d.nombre}">${d.nombre}</option>`).join("");
      selDocente.disabled = false;
    } else {
      selDocente.innerHTML = '<option value="">Elige grupo primero...</option>';
      selDocente.disabled = true;
    }
  };

  // --- DOCENTE -> SOLO SUS MATERIAS NO CUBIERTAS EN ESE GRUPO ---
  selDocente.onchange = () => {
    const grupo = selGrupo.value;
    const valor = selDocente.value;

    if (!(grupo && valor)) return vaciarAsignatura();

    const doc = (getDocentes() || []).find(d => (d.correo || d.nombre) === valor);
    const suyas = doc?.materias || [];
    const ocupadas = (getClases() || []).filter(c => c.grupoId === grupo).map(c => c.asignaturaId);
    const disponibles = suyas.filter(m => !ocupadas.includes(m));

    if (suyas.length === 0) {
      selAsignatura.innerHTML = '<option value="">Este docente no tiene materias (asígnalas en Docentes)</option>';
      selAsignatura.disabled = true;
    } else if (disponibles.length === 0) {
      selAsignatura.innerHTML = '<option value="">Ya cubriste sus materias en este grupo</option>';
      selAsignatura.disabled = true;
    } else {
      selAsignatura.innerHTML = '<option value="">Selecciona la materia...</option>' +
        disponibles.map(m => `<option value="${m}">${m}</option>`).join("");
      selAsignatura.disabled = false;
    }
  };

  // --- ABRIR / CERRAR ---
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

    const existe = (getClases() || []).some(c => c.grupoId === d.grupo && c.asignaturaId === d.asignatura);
    if (existe) {
      alert("Error: Esta materia ya tiene un docente asignado en este grupo. Elimina la asignación anterior primero.");
      return;
    }

    addClase({
      grupoId: d.grupo,
      asignaturaId: d.asignatura,
      docenteId: d.docente,
      id: Date.now()
    });

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
          const info = docentes.find(d => d.correo === c.docenteId || d.nombre === c.docenteId);
          return `
          <tr>
            <td><b>${c.grupoId}</b></td>
            <td>${info ? info.nombre : c.docenteId}</td>
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