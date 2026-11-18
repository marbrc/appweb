// /static/pantallas/admin/accesos.js
import { buscar, esc, api, avisar, confirmar, cargando } from "/static/js/nucleo/utiles.js";
<<<<<<< HEAD
import { getGrupos, getClases, getDocentes, encuestasDeClase } from "/static/js/nucleo/datos.js";
import { normalizar } from "/static/js/nucleo/filtro.js";
=======
import { getGrupos, getClases, getDocentes, getCarreras } from "/static/js/nucleo/datos.js";
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36

export async function iniciar(cont) {
  const cuerpo = buscar("#tabla-accesos", cont);
  const campoBuscar = buscar("#a-buscar", cont);
<<<<<<< HEAD
  const selEstado = buscar("#a-estado", cont);
=======
  const fCarrera = buscar("#a-f-carrera", cont), fCuatri = buscar("#a-f-cuatri", cont),
        fGrupo = buscar("#a-f-grupo", cont), fEstado = buscar("#a-f-estado", cont);
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
  let codigos = [];

  // una fila por asignación de Carga Académica: grupo + docente + materia
  function filas() {
    const grupos = getGrupos() || [];
    const docentes = getDocentes() || [];
    return (getClases() || []).map(c => {
      const g = grupos.find(x => x.clave === c.grupoId);
      if (!g) return null;
      const d = docentes.find(x => x.correo === c.docenteId || x.nombre === c.docenteId);
      return {
        grupo: g.clave,
        carrera: g.carrera,
        cuatri: g.cuatrimestre,
<<<<<<< HEAD
        alumnos: Number(g.alumnos) || 0,
=======
        alumnos: g.alumnos,
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
        docente: c.docenteId,                       // mismo valor que espera el servidor
        docenteNombre: d ? d.nombre : c.docenteId,
        materia: c.asignaturaId
      };
    }).filter(Boolean);
  }
  const lista = filas();

  buscar("#nota-enlace", cont).textContent = "Los enlaces se arman con esta dirección: " + location.origin + "/alumno";

  const enlace = c => `${location.origin}/alumno?c=${c}`;
  const buscarCodigo = f => codigos.find(x => x.grupo === f.grupo && x.docente === f.docente && x.materia === f.materia);
  const estadoDe = f => { const c = buscarCodigo(f); return !c ? "sin" : c.activo ? "activo" : "desactivado"; };

  // ---- filtros (carrera -> cuatrimestre -> grupo, como en Reportes) ----
  fCarrera.innerHTML = '<option value="">Todas las carreras</option>' +
    (getCarreras() || []).map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  fCuatri.innerHTML = '<option value="">Todos los cuatrimestres</option>' +
    Array.from({ length: 11 }, (_, i) => `<option value="${i + 1}">${i + 1}°</option>`).join("");
  function llenarGrupos() {
    const previo = fGrupo.value;
    const claves = [...new Set(lista
      .filter(f => (!fCarrera.value || f.carrera === fCarrera.value) && (!fCuatri.value || String(f.cuatri) === fCuatri.value))
      .map(f => f.grupo))].sort();
    fGrupo.innerHTML = '<option value="">Todos los grupos</option>' + claves.map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join("");
    fGrupo.value = claves.includes(previo) ? previo : "";
  }
  llenarGrupos();
  [fCarrera, fCuatri].forEach(el => el.addEventListener("change", () => { llenarGrupos(); dibujar(); }));
  [fGrupo, fEstado].forEach(el => el.addEventListener("change", dibujar));
  campoBuscar.addEventListener("input", dibujar);

  function dibujar() {
    const q = normalizar(campoBuscar.value).trim();
    const estado = selEstado ? selEstado.value : "";
    const con = lista.filter(f => buscarCodigo(f)).length;
<<<<<<< HEAD
    const inactivos = lista.filter(f => buscarCodigo(f) && !buscarCodigo(f).activo).length;

    buscar("#a-total", cont).textContent = `${con} de ${lista.length} con código` +
      (inactivos ? ` · ${inactivos} desactivado${inactivos === 1 ? "" : "s"}` : "");
=======
    const off = lista.filter(f => estadoDe(f) === "desactivado").length;
    buscar("#a-total", cont).textContent = `${con} de ${lista.length} con código` + (off ? ` · ${off} desactivado${off === 1 ? "" : "s"}` : "");
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
    buscar("#a-todos", cont).hidden = !lista.length || con === lista.length;

    if (!lista.length) {
      cuerpo.innerHTML = `<tr><td colspan="5" class="vacio">No hay asignaciones. Crea una en Carga Académica.</td></tr>`;
      return;
    }
<<<<<<< HEAD

    const visibles = lista.map((f, i) => [f, i]).filter(([f]) => {
      const c = buscarCodigo(f);
      if (estado === "activos" && !(c && c.activo)) return false;
      if (estado === "desactivados" && !(c && !c.activo)) return false;
      if (estado === "sincodigo" && c) return false;
      return !q || normalizar(`${f.grupo} ${f.materia} ${f.docenteNombre} ${f.carrera}`).includes(q);
    });

    cuerpo.innerHTML = visibles.length ? visibles.map(([f, i]) => {
      const c = buscarCodigo(f);
      const contestaron = encuestasDeClase(f.grupo, f.docente, f.materia);
      const avance = f.alumnos ? `${contestaron} de ${f.alumnos}` : `${contestaron} (falta # alumnos)`;

      const acciones = !c
        ? `<button class="mini azul" type="button" data-acc="generar" data-i="${i}">Generar código</button>`
        : c.activo
          ? `<button class="mini azul" type="button" data-acc="copiar" data-i="${i}">Copiar enlace</button>
             <button class="mini" type="button" data-acc="generar" data-i="${i}">Regenerar</button>
             <button class="mini rojo" type="button" data-acc="desactivar" data-i="${i}">Desactivar</button>`
          : `<button class="mini" type="button" data-acc="activar" data-i="${i}">Reactivar</button>
             <button class="mini" type="button" data-acc="generar" data-i="${i}">Regenerar</button>`;

      return `<tr>
        <td><span class="chip clave">${esc(f.grupo)}</span> <small class="sub">${esc(f.cuatri)}°</small></td>
        <td><b>${esc(f.materia)}</b><br><small class="sub">${esc(f.docenteNombre)}</small></td>
        <td><small class="sub">${avance}</small></td>` +
        (c
          ? `<td><span class="codigo">${esc(c.codigo)}</span>
               ${c.activo ? '<span class="chip">Activo</span>' : '<span class="badge warn">Desactivado</span>'}
               <br><small class="sub" style="white-space:nowrap">Creado ${esc(c.creado)}</small></td>`
          : `<td><span class="badge gris">Sin código</span></td>`) +
        `<td class="acciones-fila">${acciones}</td>
      </tr>`;
    }).join("") : `<tr><td colspan="5" class="vacio">Nada coincide con el filtro.</td></tr>`;
=======
    const visibles = lista.map((f, i) => [f, i]).filter(([f]) =>
      (!q || `${f.grupo} ${f.materia} ${f.docenteNombre}`.toLowerCase().includes(q)) &&
      (!fCarrera.value || f.carrera === fCarrera.value) &&
      (!fCuatri.value || String(f.cuatri) === fCuatri.value) &&
      (!fGrupo.value || f.grupo === fGrupo.value) &&
      (!fEstado.value || estadoDe(f) === fEstado.value));

    cuerpo.innerHTML = visibles.length ? visibles.map(([f, i]) => {
      const c = buscarCodigo(f);
      const base = `<tr>
        <td><span class="chip clave">${esc(f.grupo)}</span> <small class="sub">${esc(f.cuatri)}°</small></td>
        <td><b>${esc(f.materia)}</b><br><small class="sub">${esc(f.docenteNombre)}</small></td>`;
      if (!c) {
        return base + `<td><span class="badge gris">Sin código</span></td>
          <td><span class="sub">—</span></td>
          <td class="acciones-fila">
            <button class="mini azul" type="button" data-acc="generar" data-i="${i}">Generar código</button>
          </td></tr>`;
      }
      // participacion de esta clase: cuantos contestaron con este codigo de cuantos alumnos tiene el grupo
      const part = c.alumnos ? `${c.contestaron} de ${c.alumnos}` : `${c.contestaron}`;
      return base + `<td><span class="codigo" style="${c.activo ? "" : "opacity:.45;text-decoration:line-through"}">${esc(c.codigo)}</span>
          <span class="badge ${c.activo ? "ok" : "warn"}">${c.activo ? "Activo" : "Desactivado"}</span><br>
          <small class="sub" style="white-space:nowrap">Creado ${esc(c.creado)}</small></td>
        <td>${esc(part)}</td>
        <td class="acciones-fila">
          ${c.activo ? `<button class="mini azul" type="button" data-acc="copiar" data-i="${i}">Copiar enlace</button>` : ""}
          <button class="mini" type="button" data-acc="generar" data-i="${i}">Regenerar</button>
          <button class="mini ${c.activo ? "rojo" : "azul"}" type="button" data-acc="${c.activo ? "desactivar" : "activar"}" data-i="${i}">${c.activo ? "Desactivar" : "Activar"}</button>
        </td></tr>`;
    }).join("") : `<tr><td colspan="5" class="vacio">Ninguna asignación coincide con los filtros.</td></tr>`;
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
  }

  async function cargar() {
    try { codigos = await api("/api/codigos"); }
    catch (e) { codigos = []; avisar(e.message, "err"); }
    dibujar();
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      avisar("Enlace copiado, ya lo puedes pegar en el grupo.");
    } catch {
      prompt("Copia este enlace:", texto);
    }
  }

<<<<<<< HEAD
  const generar = f => api("/api/codigos", { metodo: "POST", datos: f });
  const cambiarActivo = (codigo, activo) =>
    api("/api/codigos/" + codigo, { metodo: "PUT", datos: { activo } });

  campoBuscar.addEventListener("input", dibujar);
  if (selEstado) selEstado.addEventListener("change", dibujar);
=======
  const generar = f => api("/api/codigos", { metodo: "POST", datos: { grupo: f.grupo, docente: f.docente, materia: f.materia } });
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36

  cuerpo.addEventListener("click", async e => {
    const b = e.target.closest("[data-acc]");
    if (!b) return;
    const f = lista[+b.dataset.i];
    const c = buscarCodigo(f);
    try {
      if (b.dataset.acc === "copiar") {
        if (!await confirmar(enlace(c.codigo), { titulo: "¿Copiar el enlace?", si: "Copiar" })) return;
        return copiar(enlace(c.codigo));
      }

      if (b.dataset.acc === "generar") {
        if (c && !await confirmar(`El código ${c.codigo} de ${f.grupo} (${f.materia}) dejará de funcionar y se creará uno nuevo.`,
          { titulo: "¿Regenerar el código?", si: "Regenerar" })) return;
        cargando(b, true);
        const nuevo = await generar(f);
        avisar(`Código ${nuevo.codigo} listo para ${f.grupo} · ${f.materia}.`);
      }

      if (b.dataset.acc === "desactivar") {
<<<<<<< HEAD
        if (!await confirmar(`El código ${c.codigo} se queda guardado, solo queda desactivado. ` +
          "El alumno verá que está desactivado y lo puedes reactivar cuando quieras. Las respuestas que ya llegaron no se borran.",
          { titulo: "¿Desactivar el código de acceso?", si: "Desactivar", peligro: true })) return;
        await cambiarActivo(c.codigo, false);
        avisar("Código desactivado. Ya no se puede usar hasta que lo reactives.");
      }

      if (b.dataset.acc === "activar") {
        await cambiarActivo(c.codigo, true);
        avisar("Código reactivado. Los alumnos ya pueden volver a entrar.");
=======
        if (!await confirmar(`Nadie podrá entrar con el código ${c.codigo} hasta que lo actives otra vez. Las respuestas que ya llegaron no se borran.`,
          { titulo: "¿Desactivar el código?", si: "Desactivar", peligro: true })) return;
        cargando(b, true);
        await api("/api/codigos/" + c.codigo, { metodo: "PUT", datos: { activo: false } });
        avisar("Código desactivado.");
      }

      if (b.dataset.acc === "activar") {
        cargando(b, true);
        await api("/api/codigos/" + c.codigo, { metodo: "PUT", datos: { activo: true } });
        avisar("Código activado, ya se puede evaluar con él.");
>>>>>>> 0611d46e8103fa63312fb97be4b26444c8cc1e36
      }
      await cargar();
    } catch (err) {
      avisar(err.message, "err");
      cargando(b, false);
    }
  });

  // generar los que faltan de un jalon
  buscar("#a-todos", cont).onclick = async e => {
    const faltan = lista.filter(f => !buscarCodigo(f));
    if (!faltan.length) return;
    if (!await confirmar(`Se van a crear ${faltan.length} códigos nuevos.`, { titulo: "¿Generar los que faltan?", si: "Generar" })) return;
    cargando(e.currentTarget, true);
    let bien = 0;
    for (const f of faltan) { try { await generar(f); bien++; } catch { /* sigo con los demas */ } }
    avisar(`${bien} ${bien === 1 ? "código generado" : "códigos generados"}.`, bien === faltan.length ? "ok" : "err");
    cargando(buscar("#a-todos", cont), false);
    await cargar();
  };

  await cargar();
}
