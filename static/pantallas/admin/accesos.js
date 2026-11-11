// /static/pantallas/admin/accesos.js
import { buscar, esc, api, avisar, confirmar, cargando } from "/static/js/nucleo/utiles.js";
import { getGrupos, getClases, getDocentes } from "/static/js/nucleo/datos.js";

export async function iniciar(cont) {
  const cuerpo = buscar("#tabla-accesos", cont);
  const campoBuscar = buscar("#a-buscar", cont);
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
    const q = campoBuscar.value.trim().toLowerCase();
    const con = lista.filter(f => buscarCodigo(f)).length;
    buscar("#a-total", cont).textContent = `${con} de ${lista.length} con código`;
    buscar("#a-todos", cont).hidden = !lista.length || con === lista.length;

    if (!lista.length) {
      cuerpo.innerHTML = `<tr><td colspan="4" class="vacio">No hay asignaciones. Crea una en Carga Académica.</td></tr>`;
      return;
    }
    const visibles = lista.map((f, i) => [f, i]).filter(([f]) => !q || `${f.grupo} ${f.materia} ${f.docenteNombre}`.toLowerCase().includes(q));
    cuerpo.innerHTML = visibles.length ? visibles.map(([f, i]) => {
      const c = buscarCodigo(f);
      return `<tr>
        <td><span class="chip clave">${esc(f.grupo)}</span> <small class="sub">${esc(f.cuatri)}°</small></td>
        <td><b>${esc(f.materia)}</b><br><small class="sub">${esc(f.docenteNombre)}</small></td>` +
        (c
          ? `<td><span class="codigo">${esc(c.codigo)}</span><br><small class="sub" style="white-space:nowrap">Creado ${esc(c.creado)}</small></td>
             <td class="acciones-fila">
               <button class="mini azul" type="button" data-acc="copiar" data-i="${i}">Copiar enlace</button>
               <button class="mini" type="button" data-acc="generar" data-i="${i}">Regenerar</button>
               <button class="mini rojo" type="button" data-acc="revocar" data-i="${i}">Revocar</button>
             </td>`
          : `<td><span class="badge gris">Sin código</span></td>
             <td class="acciones-fila">
               <button class="mini azul" type="button" data-acc="generar" data-i="${i}">Generar código</button>
             </td>`) +
        "</tr>";
    }).join("") : `<tr><td colspan="4" class="vacio">Nada coincide con "${esc(q)}".</td></tr>`;
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

  campoBuscar.addEventListener("input", dibujar);

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

      if (b.dataset.acc === "revocar") {
        if (!await confirmar(`Ya nadie podrá entrar con el código ${c.codigo}. Las respuestas que ya llegaron no se borran.`,
          { titulo: "¿Revocar el código?", si: "Revocar", peligro: true })) return;
        await api("/api/codigos/" + c.codigo, { metodo: "DELETE" });
        avisar("Código revocado.");
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
