// /static/pantallas/admin/clases.js
import { buscar, esc, avisar, confirmar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  getGrupos, getGrupo, getDocentes, getClases, getAsignaturas, getAsignaturasDeGrupo, getCarreras,
  addClase, setClases, alCambiarDatos
} from "/static/js/nucleo/datos.js";

let cont = null;
let desuscribir = [];

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
  const infoGrupo = buscar("#cl-info-grupo", cont);
  const cajaTodas = buscar("#cl-todas-caja", cont);
  const chkTodas = buscar("#cl-todas", cont);

  // filtros de la tabla
  const fBuscar = buscar("#cl-buscar", cont), fCarrera = buscar("#cl-f-carrera", cont),
        fCuatri = buscar("#cl-f-cuatri", cont), fGrupo = buscar("#cl-f-grupo", cont),
        fDocente = buscar("#cl-f-docente", cont);

  if (!btnNuevo || !form || !tabla) return;

  const claveDoc = d => d.correo || d.nombre;
  const infoDe = c => (getDocentes() || []).find(d => d.correo === c.docenteId || d.nombre === c.docenteId);

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
    infoGrupo.hidden = true;
    cajaTodas.hidden = true;
    chkTodas.checked = false;
    vaciarAsignatura();
  }

  // --- GRUPO -> sale su carrera y cuatrimestre y se activan los docentes ---
  selGrupo.onchange = () => {
    vaciarAsignatura();
    chkTodas.checked = false;
    const g = getGrupo(selGrupo.value);

    if (g) {
      const delPlan = getAsignaturasDeGrupo(g.clave).length;
      infoGrupo.hidden = false;
      infoGrupo.textContent = `${g.carrera} · ${g.cuatrimestre}° cuatrimestre` +
        (delPlan ? ` — le tocan ${delPlan} asignaturas.` : " — todavía no hay asignaturas registradas para este cuatrimestre; usa «Mostrar todas».");
      cajaTodas.hidden = false;
      const docentes = getDocentes() || [];
      selDocente.innerHTML = '<option value="">Selecciona un docente...</option>' +
        docentes.map(d => `<option value="${esc(claveDoc(d))}">${esc(d.nombre)}</option>`).join("");
      selDocente.disabled = false;
    } else {
      infoGrupo.hidden = true;
      cajaTodas.hidden = true;
      selDocente.innerHTML = '<option value="">Elige grupo primero...</option>';
      selDocente.disabled = true;
    }
  };

  // --- DOCENTE -> LAS MATERIAS DEL GRUPO QUE TODAVIA NO TIENEN MAESTRO ---
  // ANTES salian TODAS las asignaturas del catálogo aunque no fueran de ese cuatrimestre. Ahora el grupo ya
  // trae su carrera y su cuatrimestre y solo salen las que le tocan (plan de estudios); el cuadrito de abajo
  // permite ver todas por si hay una materia fuera de plan (optativas, etc.)
  function llenarAsignaturas() {
    const grupo = selGrupo.value, valor = selDocente.value;
    if (!(grupo && valor)) return vaciarAsignatura();

    const doc = (getDocentes() || []).find(d => claveDoc(d) === valor);
    const suyas = doc?.materias || [];
    const base = chkTodas.checked ? (getAsignaturas() || []) : getAsignaturasDeGrupo(grupo);
    const nombres = [...new Set(base.map(a => a.nombre))];
    const ocupadas = (getClases() || []).filter(c => c.grupoId === grupo).map(c => c.asignaturaId);
    const disponibles = nombres.filter(m => !ocupadas.includes(m))
      .sort((a, b) => suyas.includes(b) - suyas.includes(a) || a.localeCompare(b, "es"));

    if (nombres.length === 0) {
      selAsignatura.innerHTML = '<option value="">No hay asignaturas para este grupo (usa «Mostrar todas»)</option>';
      selAsignatura.disabled = true;
    } else if (disponibles.length === 0) {
      selAsignatura.innerHTML = '<option value="">Todas las materias de este grupo ya tienen docente</option>';
      selAsignatura.disabled = true;
    } else {
      selAsignatura.innerHTML = '<option value="">Selecciona la materia...</option>' +
        disponibles.map(m => `<option value="${esc(m)}">${esc(m)}${suyas.includes(m) ? " ★" : ""}</option>`).join("");
      selAsignatura.disabled = false;
    }
  }
  selDocente.onchange = llenarAsignaturas;
  chkTodas.onchange = llenarAsignaturas;

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

    addClase({ grupoId: d.grupo, asignaturaId: d.asignatura, docenteId: d.docente, id: Date.now() });

    avisar("Asignación guardada. Ya le puedes generar su código de acceso.");
    form.reset();
    form.hidden = true;
    dibujar();
  };

  // --- ELIMINAR (el indice es el de la lista completa, no el de la fila filtrada) ---
  tabla.onclick = async e => {
    const del = e.target.closest("[data-del]");
    if (!del) return;
    if (!await confirmar("Su código de acceso también deja de servir. Si ya tiene evaluaciones no se podrá eliminar.",
      { titulo: "¿Eliminar esta asignación?", si: "Eliminar", peligro: true })) return;
    const lista = getClases();
    lista.splice(+del.dataset.del, 1);
    setClases(lista);
    dibujar();
  };

  // --- FILTROS ---
  function llenarFiltros() {
    const sel = (el, vacio, opciones) => {
      const previa = el.value;
      el.innerHTML = `<option value="">${vacio}</option>` + opciones.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("");
      el.value = opciones.some(([v]) => String(v) === previa) ? previa : "";
    };
    const c = fCarrera.value, ct = fCuatri.value;
    sel(fCarrera, "Todas las carreras", (getCarreras() || []).map(x => [x, x]));
    sel(fCuatri, "Todos los cuatrimestres", Array.from({ length: 11 }, (_, i) => [String(i + 1), `${i + 1}°`]));
    fCarrera.value = c; fCuatri.value = ct;
    // los grupos del filtro dependen de la carrera y del cuatrimestre elegidos
    sel(fGrupo, "Todos los grupos", (getGrupos() || [])
      .filter(g => (!fCarrera.value || g.carrera === fCarrera.value) && (!fCuatri.value || String(g.cuatrimestre) === fCuatri.value))
      .map(g => [g.clave, g.clave]));
    // solo los docentes que ya tienen alguna asignación
    const conClase = new Set((getClases() || []).map(x => x.docenteId));
    sel(fDocente, "Todos los docentes", (getDocentes() || []).filter(d => conClase.has(d.correo) || conClase.has(d.nombre)).map(d => [claveDoc(d), d.nombre]));
  }
  [fCarrera, fCuatri].forEach(el => el.addEventListener("change", () => { llenarFiltros(); dibujar(); }));
  [fGrupo, fDocente].forEach(el => el.addEventListener("change", dibujar));
  fBuscar.addEventListener("input", dibujar);

  // --- DIBUJAR TABLA ---
  function dibujar() {
    const clases = getClases() || [];
    const q = fBuscar.value.trim().toLowerCase();
    const filas = clases.map((c, i) => {
      const g = getGrupo(c.grupoId), d = infoDe(c);
      return { c, i, g, nombre: d ? d.nombre : c.docenteId };
    }).filter(({ c, g, nombre }) =>
      (!fCarrera.value || g?.carrera === fCarrera.value) &&
      (!fCuatri.value || String(g?.cuatrimestre) === fCuatri.value) &&
      (!fGrupo.value || c.grupoId === fGrupo.value) &&
      (!fDocente.value || c.docenteId === fDocente.value) &&
      (!q || `${c.grupoId} ${c.asignaturaId} ${nombre}`.toLowerCase().includes(q)));

    const total = buscar("#cl-total", cont);
    if (total) total.textContent = filas.length === clases.length
      ? clases.length + (clases.length === 1 ? " asignación" : " asignaciones")
      : `${filas.length} de ${clases.length}`;

    tabla.innerHTML = filas.length
      ? filas.map(({ c, i, g, nombre }) => `
          <tr>
            <td><span class="chip clave">${esc(c.grupoId)}</span></td>
            <td>${g ? `${esc(g.carrera)} <small class="sub">· ${esc(g.cuatrimestre)}°</small>` : "—"}</td>
            <td><div class="persona"><span class="avatar-mini">${esc(nombre.charAt(0).toUpperCase())}</span>${esc(nombre)}</div></td>
            <td>${esc(c.asignaturaId)}</td>
            <td class="acciones-fila">
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="5" class="vacio">${clases.length ? "Ninguna asignación coincide con los filtros." : 'No hay asignaciones registradas. Toca "+ Nueva asignación".'}</td></tr>`;
  }

  desuscribir.forEach(f => f());
  desuscribir = [
    alCambiarDatos("admin_grupos", () => { cargarGruposYDocentes(); llenarFiltros(); dibujar(); }),
    alCambiarDatos("admin_docentes", cargarGruposYDocentes),
    alCambiarDatos("admin_asignaturas", () => { if (selDocente.value) llenarAsignaturas(); }),
    alCambiarDatos("admin_clases", () => { llenarFiltros(); dibujar(); })
  ];

  llenarFiltros();
  dibujar();
}
