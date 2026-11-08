// /static/pantallas/admin/accesos.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { getGrupos, getClases, getDocentes } from "/static/js/nucleo/datos.js";

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function iniciar(cont) {
  const cuerpo = buscar("#tabla-accesos", cont);
  const msg = buscar("#msg", cont);
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
        docente: c.docenteId,                       // mismo valor que usa evaluar.js
        docenteNombre: d ? d.nombre : c.docenteId,
        materia: c.asignaturaId
      };
    }).filter(Boolean);
  }

  const lista = filas();

  buscar("#nota-enlace", cont).textContent =
    "Los enlaces se arman con esta dirección: " + location.origin;

  const enlace = c => `${location.origin}/alumno?c=${c}`;
  const avisar = (t, ok) => {
    msg.textContent = t;
    msg.className = ok ? "ok" : "err";
    msg.hidden = false;
  };

  const buscarCodigo = f => codigos.find(x =>
    x.grupo === f.grupo && x.carrera === f.carrera &&
    x.docente === f.docente && x.materia === f.materia);

  function dibujar() {
    if (!lista.length) {
      cuerpo.innerHTML = `<tr><td colspan="6" class="vacio">No hay asignaciones. Crea una en Carga Académica.</td></tr>`;
      return;
    }
    cuerpo.innerHTML = lista.map((f, i) => {
      const c = buscarCodigo(f);
      return `<tr>
        <td>${esc(f.grupo)}</td>
        <td>${esc(f.carrera)}</td>
        <td>${esc(f.cuatri)}°</td>
        <td>${esc(f.docenteNombre)}<br><small style="color:var(--mut)">${esc(f.materia)}</small></td>` +
        (c
          ? `<td><b class="codigo">${esc(c.codigo)}</b></td>
             <td class="acciones-fila">
               <button class="mini" data-acc="copiar" data-i="${i}">Copiar enlace</button>
               <button class="mini" data-acc="generar" data-i="${i}">Regenerar</button>
               <button class="mini rojo" data-acc="revocar" data-i="${i}">Revocar</button>
             </td>`
          : `<td class="sub">Sin código</td>
             <td class="acciones-fila">
               <button class="mini" data-acc="generar" data-i="${i}">Generar código</button>
             </td>`) +
        "</tr>";
    }).join("");
  }

  async function cargar() {
    try {
      const r = await fetch("/api/codigos");
      if (!r.ok) throw new Error("servidor");
      codigos = await r.json();
    } catch {
      codigos = [];
      avisar("No se pudo conectar con el servidor.", false);
    }
    dibujar();
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      avisar("Enlace copiado.", true);
    } catch {
      prompt("Copia este enlace:", texto);
    }
  }

  cuerpo.addEventListener("click", async e => {
    const b = e.target.closest("[data-acc]");
    if (!b) return;
    const f = lista[+b.dataset.i];
    const c = buscarCodigo(f);
    try {
      if (b.dataset.acc === "copiar") return copiar(enlace(c.codigo));

      if (b.dataset.acc === "generar") {
        if (c && !confirm(`¿Regenerar el código de ${f.grupo} (${f.docenteNombre})? El anterior dejará de funcionar.`)) return;
        const r = await fetch("/api/codigos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(f)
        });
        if (!r.ok) throw new Error("servidor");
        avisar(`Código de ${f.grupo} · ${f.materia} listo.`, true);
      }

      if (b.dataset.acc === "revocar") {
        if (!confirm(`¿Revocar este código? Ya nadie podrá entrar con él.`)) return;
        const r = await fetch("/api/codigos/" + c.codigo, { method: "DELETE" });
        if (!r.ok) throw new Error("servidor");
        avisar("Código revocado.", true);
      }

      await cargar();
    } catch {
      avisar("No se pudo conectar con el servidor.", false);
    }
  });

  await cargar();
}