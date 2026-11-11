// /static/pantallas/admin/clases.js
import { buscar, esc, avisar, confirmar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getGrupos, getDocentes, getClases, getAsignaturas, addClase, setClases, alCambiarDatos } from "/static/js/nucleo/datos.js";

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
      grupos.map(g => `<option value="${esc(g.clave)}">${esc(g.clave)} · ${esc(g.cuatrimestre)}° ${esc(g.carrera)}</option>`).join("");

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
        docentes.map(d => `<option value="${esc(d.correo || d.nombre)}">${esc(d.nombre)}</option>`).join("");
      selDocente.disabled = false;
    } else {
      selDocente.innerHTML = '<option value="">Elige grupo primero...</option>';
      selDocente.disabled = true;
    }
  };

  // --- DOCENTE -> LAS MATERIAS DEL GRUPO QUE TODAVIA NO TIENEN MAESTRO ---
  // ANTES solo salian las materias que el docente tenia marcadas en Docentes y como los docentes reales
  // todavia no tienen ninguna, no se podia asignar nada. Ahora salen todas las del grupo y arriba las suyas
  selDocente.onchange = () => {
    const grupo = selGrupo.value;
    const valor = selDocente.value;

    if (!(grupo && valor)) return vaciarAsignatura();

    const g = (getGrupos() || []).find(x => x.clave === grupo);
    const doc = (getDocentes() || []).find(d => (d.correo || d.nombre) === valor);
    const suyas = doc?.materias || [];
    const delGrupo = [...new Set((getAsignaturas() || [])
      .filter(a => a.carrera === g?.carrera && Number(a.cuatrimestre) === Number(g?.cuatrimestre)).map(a => a.nombre))];
    const ocupadas = (getClases() || []).filter(c => c.grupoId === grupo).map(c => c.asignaturaId);
    const disponibles = delGrupo.filter(m => !ocupadas.includes(m))
      .sort((a, b) => suyas.includes(b) - suyas.includes(a) || a.localeCompare(b));

    if (delGrupo.length === 0) {
      selAsignatura.innerHTML = '<option value="">Este grupo no tiene materias (agrégalas en Asignaturas)</option>';
      selAsignatura.disabled = true;
    } else if (disponibles.length === 0) {
      selAsignatura.innerHTML = '<option value="">Todas las materias de este grupo ya tienen docente</option>';
      selAsignatura.disabled = true;
    } else {
      selAsignatura.innerHTML = '<option value="">Selecciona la materia...</option>' +
        disponibles.map(m => `<option value="${esc(m)}">${esc(m)}${suyas.includes(m) ? " ★" : ""}</option>`).join("");
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
      return avisar("Elige el grupo, el docente y la materia.", "err");
    }

    const existe = (getClases() || []).some(c => c.grupoId === d.grupo && c.asignaturaId === d.asignatura);
    if (existe) {
      return avisar("Esta materia ya tiene un docente en este grupo. Elimina la asignación anterior primero.", "err");
    }

    addClase({
      grupoId: d.grupo,
      asignaturaId: d.asignatura,
      docenteId: d.docente,
      id: Date.now()
    });

    avisar("Asignación guardada. Ya le puedes generar su código de acceso.");
    form.reset();
    form.hidden = true;
    dibujar();
  };

  // --- ELIMINAR ---
  tabla.onclick = async e => {
    const del = e.target.closest("[data-del]");
    if (del) {
      if (!await confirmar("Su código de acceso también deja de servir. Si ya tiene evaluaciones no se podrá eliminar.",
        { titulo: "¿Eliminar esta asignación?", si: "Eliminar", peligro: true })) return;
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
    const total = buscar("#cl-total", cont);
    if (total) total.textContent = clases.length + (clases.length === 1 ? " asignación" : " asignaciones");

    tabla.innerHTML = clases.length
      ? clases.map((c, i) => {
          const info = docentes.find(d => d.correo === c.docenteId || d.nombre === c.docenteId);
          return `
          <tr>
            <td><span class="chip clave">${esc(c.grupoId)}</span></td>
            <td><div class="persona"><span class="avatar-mini">${esc((info ? info.nombre : c.docenteId).charAt(0).toUpperCase())}</span>${esc(info ? info.nombre : c.docenteId)}</div></td>
            <td>${esc(c.asignaturaId)}</td>
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