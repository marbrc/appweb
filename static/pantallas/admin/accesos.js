// /static/pantallas/admin/accesos.js
import { buscar, esc, api, avisar, confirmar, cargando } from "/static/js/nucleo/utiles.js";
import { getGrupos, getClases, getDocentes, getCarreras } from "/static/js/nucleo/datos.js";

export async function iniciar(cont) {
  const cuerpo = buscar("#tabla-accesos", cont);
  const campoBuscar = buscar("#a-buscar", cont);
  const fCarrera = buscar("#a-f-carrera", cont), fCuatri = buscar("#a-f-cuatri", cont),
        fGrupo = buscar("#a-f-grupo", cont), fEstado = buscar("#a-f-estado", cont);
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
        alumnos: g.alumnos,
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
    const q = campoBuscar.value.trim().toLowerCase();
    const con = lista.filter(f => buscarCodigo(f)).length;
    const off = lista.filter(f => estadoDe(f) === "desactivado").length;
    buscar("#a-total", cont).textContent = `${con} de ${lista.length} con código` + (off ? ` · ${off} desactivado${off === 1 ? "" : "s"}` : "");
    buscar("#a-todos", cont).hidden = !lista.length || con === lista.length;

    if (!lista.length) {
      cuerpo.innerHTML = `<tr><td colspan="5" class="vacio">No hay asignaciones. Crea una en Carga Académica.</td></tr>`;
      return;
    }
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

  const generar = f => api("/api/codigos", { metodo: "POST", datos: { grupo: f.grupo, docente: f.docente, materia: f.materia } });

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
