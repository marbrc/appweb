// /static/pantallas/admin/accesos.js
import { buscar, esc, api, avisar, confirmar, cargando } from "/static/js/nucleo/utiles.js";
import { getGrupos, getClases, getDocentes, encuestasDeClase } from "/static/js/nucleo/datos.js";
import { normalizar } from "/static/js/nucleo/filtro.js";

export async function iniciar(cont) {
  const cuerpo = buscar("#tabla-accesos", cont);
  const campoBuscar = buscar("#a-buscar", cont);
  const selEstado = buscar("#a-estado", cont);
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
        alumnos: Number(g.alumnos) || 0,
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

  function dibujar() {
    const q = normalizar(campoBuscar.value).trim();
    const estado = selEstado ? selEstado.value : "";
    const con = lista.filter(f => buscarCodigo(f)).length;
    const inactivos = lista.filter(f => buscarCodigo(f) && !buscarCodigo(f).activo).length;

    buscar("#a-total", cont).textContent = `${con} de ${lista.length} con código` +
      (inactivos ? ` · ${inactivos} desactivado${inactivos === 1 ? "" : "s"}` : "");
    buscar("#a-todos", cont).hidden = !lista.length || con === lista.length;

    if (!lista.length) {
      cuerpo.innerHTML = `<tr><td colspan="5" class="vacio">No hay asignaciones. Crea una en Carga Académica.</td></tr>`;
      return;
    }

    const visibles = lista.map((f, i) => [f, i]).filter(([f]) => {
      const c = buscarCodigo(f);
      if (estado === "activos" && !(c && c.activo)) return false;
      if (estado === "desactivados" && !(c && !c.activo)) return false;
      if (estado === "sincodigo" && c) return false;
      return !q || normalizar(`${f.grupo} ${f.materia} ${f.docenteNombre} ${f.carrera}`).includes(q);
    });

    cuerpo.innerHTML = visibles.length ? visibles.map(([f, i]) => {
      const c = buscarCodigo(f);
      const contestaron = encuestasDeClase(f.grupo, f.docenteNombre, f.materia);
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

  const generar = f => api("/api/codigos", { metodo: "POST", datos: f });
  const cambiarActivo = (codigo, activo) =>
    api("/api/codigos/" + codigo, { metodo: "PUT", datos: { activo } });

  campoBuscar.addEventListener("input", dibujar);
  if (selEstado) selEstado.addEventListener("change", dibujar);

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
        if (c && !await confirmar(`El código ${c.codigo} de ${f.grupo} (${f.materia}) dejará de funcionar.`,
          { titulo: "¿Regenerar el código?", si: "Regenerar" })) return;
        cargando(b, true);
        const nuevo = await generar(f);
        avisar(`Código ${nuevo.codigo} listo para ${f.grupo} · ${f.materia}.`);
      }

      if (b.dataset.acc === "desactivar") {
        if (!await confirmar(`El código ${c.codigo} se queda guardado, solo queda desactivado. ` +
          "El alumno verá que está desactivado y lo puedes reactivar cuando quieras. Las respuestas que ya llegaron no se borran.",
          { titulo: "¿Desactivar el código de acceso?", si: "Desactivar", peligro: true })) return;
        await cambiarActivo(c.codigo, false);
        avisar("Código desactivado. Ya no se puede usar hasta que lo reactives.");
      }

      if (b.dataset.acc === "activar") {
        await cambiarActivo(c.codigo, true);
        avisar("Código reactivado. Los alumnos ya pueden volver a entrar.");
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
