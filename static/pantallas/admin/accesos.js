// /static/pantallas/admin/accesos.js
// El administrador genera, copia y revoca los códigos de acceso de cada grupo.
// Los códigos viven en Flask, pero los grupos se toman de:
//   1) Flask (todosLosGrupos)
//   2) localStorage (admin_grupos) — los que agregó el admin en /admin/grupos
// Así, si el admin agrega un grupo nuevo, aquí aparece y puede generar su código.
import { buscar } from "/static/js/nucleo/utiles.js";
import { todosLosGrupos } from "/static/js/nucleo/catalogo.js";

export async function iniciar(cont) {
  const cuerpo = buscar("#tabla-accesos", cont);
  const msg = buscar("#msg", cont);
  let codigos = [];

  // ---------- grupos de Flask + grupos del admin (localStorage) ----------
  function gruposLocales() {
    try { return JSON.parse(localStorage.getItem("admin_grupos")) || []; }
    catch { return []; }
  }

  function gruposCombinados() {
    const deFlask = todosLosGrupos().map(g => ({
      grupo: g.grupo ?? g.clave,
      carrera: g.carrera,
      cuatri: g.cuatri ?? g.cuatrimestre
    }));
    const deLocal = gruposLocales().map(g => ({
      grupo: g.clave,
      carrera: g.carrera,
      cuatri: g.cuatrimestre
    }));

    // fusiona sin duplicados por clave de grupo
    const mapa = new Map();
    [...deFlask, ...deLocal].forEach(g => {
      if (g.grupo && !mapa.has(g.grupo)) mapa.set(g.grupo, g);
    });
    return [...mapa.values()];
  }

  const grupos = gruposCombinados();

  buscar("#nota-enlace", cont).textContent =
    "Los enlaces se arman con esta dirección: " + location.origin;

  const enlace = c => `${location.origin}/alumno?c=${c}`;
  const avisar = (t, ok) => {
    msg.textContent = t;
    msg.className = ok ? "ok" : "err";
    msg.hidden = false;
  };

  const buscarCodigo = g =>
    codigos.find(x => x.grupo === g.grupo && x.carrera === g.carrera);

  function dibujar() {
    if (!grupos.length) {
      cuerpo.innerHTML = `<tr><td colspan="5" class="vacio">No hay grupos. Agrega uno en /admin/grupos.</td></tr>`;
      return;
    }
    cuerpo.innerHTML = grupos.map((g, i) => {
      const c = buscarCodigo(g);
      return `<tr>
        <td>${g.grupo}</td>
        <td>${g.carrera}</td>
        <td>${g.cuatri}°</td>` +
        (c
          ? `<td><b class="codigo">${c.codigo}</b></td>
             <td>
               <button class="mini" data-acc="copiar" data-i="${i}">Copiar enlace</button>
               <button class="mini" data-acc="generar" data-i="${i}">Regenerar</button>
               <button class="mini rojo" data-acc="revocar" data-i="${i}">Revocar</button>
             </td>`
          : `<td class="sub">Sin código</td>
             <td>
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
    const g = grupos[+b.dataset.i];
    const c = buscarCodigo(g);
    try {
      if (b.dataset.acc === "copiar") return copiar(enlace(c.codigo));

      if (b.dataset.acc === "generar") {
        if (c && !confirm(`¿Regenerar el código de ${g.grupo}? El anterior dejará de funcionar.`)) return;
        const r = await fetch("/api/codigos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(g)
        });
        if (!r.ok) throw new Error("servidor");
        avisar(`Código de ${g.grupo} listo.`, true);
      }

      if (b.dataset.acc === "revocar") {
        if (!confirm(`¿Revocar el código de ${g.grupo}? Ya nadie podrá entrar con él.`)) return;
        const r = await fetch("/api/codigos/" + c.codigo, { method: "DELETE" });
        if (!r.ok) throw new Error("servidor");
        avisar(`Código de ${g.grupo} revocado.`, true);
      }

      await cargar();
    } catch {
      avisar("No se pudo conectar con el servidor.", false);
    }
  });

  await cargar();
}