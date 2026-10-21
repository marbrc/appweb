// /static/pantallas/admin/accesos.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { getGrupos } from "/static/js/nucleo/datos.js"; // <-- Solo usamos esta

export async function iniciar(cont) {
  const cuerpo = buscar("#tabla-accesos", cont);
  const msg = buscar("#msg", cont);
  let codigos = [];

  // ---------- Solo los grupos creados en el admin ----------
  function gruposDelAdmin() {
    return getGrupos().map(g => ({
      grupo: g.clave,
      carrera: g.carrera,
      cuatri: g.cuatrimestre,
      docente: g.docente || "—"
    }));
  }

  const grupos = gruposDelAdmin();

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
      cuerpo.innerHTML = `<tr><td colspan="6" class="vacio">No hay grupos. Agrega uno en /admin/grupos.</td></tr>`;
      return;
    }
    cuerpo.innerHTML = grupos.map((g, i) => {
      const c = buscarCodigo(g);
      return `<tr>
        <td>${g.grupo}</td>
        <td>${g.carrera}</td>
        <td>${g.cuatri}°</td>
        <td>${g.docente}</td>
        ` +
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