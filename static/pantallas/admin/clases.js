// /static/pantallas/admin/clases.js
import { buscar, esc, avisar, confirmar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getGrupos, getDocentes, getClases, getAsignaturas, getPlanDe, addClase, setClases, alCambiarDatos, refrescarDatos } from "/static/js/nucleo/datos.js";
import { abrirPapelera } from "/static/js/nucleo/papelera.js";
import { filtrar, conectar, cuenta } from "/static/js/nucleo/filtro.js";

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
  const selCarrera = buscar("#cl-carrera", cont);
  const selCuatri = buscar("#cl-cuatri", cont);
  const chkTodas = buscar("#cl-todas", cont);

  if (!btnNuevo || !form || !tabla) return;

  const grupoActual = () => (getGrupos() || []).find(x => x.clave === selGrupo.value);

  const vaciarAsignatura = (texto = "Elige grupo y docente primero...") => {
    selAsignatura.innerHTML = `<option value="">${texto}</option>`;
    selAsignatura.disabled = true;
  };

  // la carrera y el cuatrimestre salen del grupo, ya no se capturan a mano
  function llenarCarrera() {
    const g = grupoActual();
    if (selCarrera) selCarrera.value = g ? g.carrera : "";
    if (selCuatri) selCuatri.value = g ? `${g.cuatrimestre}°` : "";
  }

  // --- CARGAR GRUPOS ---
  function cargarGruposYDocentes() {
    const grupos = getGrupos() || [];

    selGrupo.innerHTML = '<option value="">Selecciona un grupo...</option>' +
      grupos.map(g => `<option value="${esc(g.clave)}">${esc(g.clave)} · ${esc(g.cuatrimestre)}° ${esc(g.carrera)}</option>`).join("");

    selDocente.innerHTML = '<option value="">Elige grupo primero...</option>';
    selDocente.disabled = true;
    llenarCarrera();
    vaciarAsignatura();
  }

  // --- GRUPO -> CARRERA/CUATRIMESTRE Y DOCENTES ---
  selGrupo.onchange = () => {
    llenarCarrera();
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

  // --- DOCENTE -> LAS MATERIAS DEL PLAN DE ESA CARRERA Y CUATRIMESTRE ---
  // Antes salían todas las materias del catálogo. Ahora salen las del plan de estudios del grupo
  // (con ★ las que el docente tiene marcadas). Con "Mostrar todas" también se ven las demás y,
  // si se elige una fuera del plan, el servidor la agrega sola a ese plan.
  function llenarMaterias() {
    const grupo = selGrupo.value;
    const valor = selDocente.value;

    if (!(grupo && valor)) return vaciarAsignatura();

    const g = grupoActual();
    if (!g) return vaciarAsignatura("Ese grupo ya no está disponible.");

    const delPlan = getPlanDe(g.carrera, Number(g.cuatrimestre));
    const todas = [...new Set((getAsignaturas() || []).map(a => a.nombre))];
    const base = chkTodas?.checked ? [...new Set([...delPlan, ...todas])] : delPlan;

    const doc = (getDocentes() || []).find(d => (d.correo || d.nombre) === valor);
    const suyas = doc?.materias || [];
    const ocupadas = (getClases() || []).filter(c => c.grupoId === grupo).map(c => c.asignaturaId);
    const disponibles = base.filter(m => !ocupadas.includes(m))
      .sort((a, b) => suyas.includes(b) - suyas.includes(a) || a.localeCompare(b));

    if (base.length === 0) {
      selAsignatura.innerHTML = '<option value="">Esta carrera y cuatrimestre no tienen materias en el plan. Revisa Asignaturas o marca "Mostrar todas".</option>';
      selAsignatura.disabled = true;
    } else if (disponibles.length === 0) {
      selAsignatura.innerHTML = '<option value="">Todas las materias disponibles de este grupo ya tienen docente</option>';
      selAsignatura.disabled = true;
    } else {
      selAsignatura.innerHTML = '<option value="">Selecciona la materia...</option>' +
        disponibles.map(m => `<option value="${esc(m)}">${esc(m)}${suyas.includes(m) ? " ★" : ""}</option>`).join("");
      selAsignatura.disabled = false;
    }
  }

  selDocente.onchange = llenarMaterias;
  if (chkTodas) chkTodas.onchange = llenarMaterias;

  // --- ABRIR / CERRAR ---
  btnNuevo.onclick = () => {
    form.hidden = false;
    form.reset();
    cargarGruposYDocentes();
  };

  btnCancelar.onclick = () => { form.hidden = true; };

  buscar("#cl-papelera", cont).onclick = () => abrirPapelera("clases", dibujar);

  // buscador: filtra por grupo, materia o docente
  const campoBuscar = buscar("#cl-buscar", cont);
  conectar(campoBuscar, () => dibujar());

  // --- GUARDAR ---
  form.onsubmit = async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));

    if (!d.grupo || !d.docente || !d.asignatura) {
      return avisar("Elige el grupo, el docente y la materia.", "err");
    }

    const existe = (getClases() || []).some(c => c.grupoId === d.grupo && c.asignaturaId === d.asignatura);
    if (existe) {
      return avisar("Esta materia ya tiene un docente en este grupo. Elimina la asignación anterior primero.", "err");
    }

    await addClase({
      grupoId: d.grupo,
      asignaturaId: d.asignatura,
      docenteId: d.docente,
      id: Date.now()
    });

    avisar("Asignación guardada. Ya le puedes generar su código de acceso.");
    form.reset();
    form.hidden = true;
    await refrescarDatos();
    dibujar();
  };

  // --- ELIMINAR (en realidad solo se desactiva) ---
  tabla.onclick = async e => {
    const del = e.target.closest("[data-del]");
    if (del) {
      if (!await confirmar('No se borra: la asignación queda desactivada y la puedes recuperar en "Ver eliminados". ' +
        "Su código de acceso deja de servir.",
        { titulo: "¿Desactivar esta asignación?", si: "Desactivar", peligro: true })) return;
      const lista = getClases();
      lista.splice(+del.dataset.del, 1);
      await setClases(lista);
      await refrescarDatos();
      dibujar();
    }
  };

  // --- DIBUJAR TABLA ---
  function dibujar() {
    const clases = getClases() || [];
    const docentes = getDocentes() || [];
    const nombreDocente = c => {
      const info = docentes.find(d => d.correo === c.docenteId || d.nombre === c.docenteId);
      return info ? info.nombre : c.docenteId;
    };
    const q = campoBuscar ? campoBuscar.value : "";
    const visibles = filtrar(clases, q,
      c => `${c.grupoId} ${c.asignaturaId} ${nombreDocente(c)}`);

    const total = buscar("#cl-total", cont);
    if (total) total.textContent = cuenta(visibles.length, clases.length, "asignación", "asignaciones");

    tabla.innerHTML = visibles.length
      ? visibles.map(([c, i]) => {
          const nombre = nombreDocente(c);
          return `
          <tr>
            <td><span class="chip clave">${esc(c.grupoId)}</span></td>
            <td><div class="persona"><span class="avatar-mini">${esc(nombre.charAt(0).toUpperCase())}</span>${esc(nombre)}</div></td>
            <td>${esc(c.asignaturaId)}</td>
            <td class="acciones-fila">
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`;
        }).join("")
      : q.trim()
        ? `<tr><td colspan="4" class="vacio">Nada coincide con "${esc(q.trim())}".</td></tr>`
        : `<tr><td colspan="4" class="vacio">No hay asignaciones registradas. Toca "+ Nueva asignación".</td></tr>`;
  }

  alCambiarDatos("admin_grupos", cargarGruposYDocentes);
  alCambiarDatos("admin_docentes", cargarGruposYDocentes);
  alCambiarDatos("admin_clases", dibujar);

  dibujar();
}