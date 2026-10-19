// el administrador genera, copia y revoca los códigos de acceso de cada grupo
// los códigos viven en el servidor Flask, no en el navegador, para que el alumno los pueda validar
import { buscar } from "/static/js/nucleo/utiles.js";
import { todosLosGrupos } from "/static/js/nucleo/catalogo.js";

export async function iniciar(cont) {
  const cuerpo = buscar("#tabla-accesos", cont), msg = buscar("#msg", cont), grupos = todosLosGrupos();
  let codigos = []; // la lista que regresa el servidor

  // los enlaces usan la dirección con la que abre el sistema ej.http:
  buscar("#nota-enlace", cont).textContent = "Los enlaces se arman con esta dirección: " + location.origin;
  const enlace = c => `${location.origin}/alumno?c=${c}`;

  // avisar, mensaje verde ok o rojo error
  const avisar = (t, ok) => { msg.textContent = t; msg.className = ok ? "ok" : "err"; msg.hidden = false; };

  // buscarCodigo, el código que le toca a ese grupo si tiene
  const buscarCodigo = g => codigos.find(x => x.grupo === g.grupo && x.carrera === g.carrera);

  // dibujar, una fila por grupo, si tiene codigo salen Copiar, Regenerar y Revocar; si no Generar
  function dibujar() {
    cuerpo.innerHTML = grupos.map((g, i) => {
      const c = buscarCodigo(g);
      return `<tr><td>${g.grupo}</td><td>${g.carrera}</td><td>${g.cuatri}°</td>` + (c
        ? `<td><b class="codigo">${c.codigo}</b></td><td>
             <button class="mini" data-acc="copiar" data-i="${i}">Copiar enlace</button>
             <button class="mini" data-acc="generar" data-i="${i}">Regenerar</button>
             <button class="mini rojo" data-acc="revocar" data-i="${i}">Revocar</button></td>`
        : `<td class="sub">Sin código</td><td><button class="mini" data-acc="generar" data-i="${i}">Generar código</button></td>`) + "</tr>";
    }).join("");
  }

  // cargar, le pide la lista de codigos al servidor y dibuja la tabla
  async function cargar() {
    try { codigos = await (await fetch("/api/codigos")).json(); }
    catch { codigos = []; avisar("No se pudo conectar con el servidor.", false); }
    dibujar();
  }

  // copiar, al portapapeles si el navegador no deja, lo muestra para copiarlo a mano
  async function copiar(texto) {
    try { await navigator.clipboard.writeText(texto); avisar("Enlace copiado.", true); }
    catch { prompt("Copia este enlace:", texto); }
  }

  // un solo escuchador para todos los botones de la tabla
  cuerpo.addEventListener("click", async e => {
    const b = e.target.closest("[data-acc]");
    if (!b) return;
    const g = grupos[+b.dataset.i], c = buscarCodigo(g);
    try {
      if (b.dataset.acc === "copiar") return copiar(enlace(c.codigo));
      if (b.dataset.acc === "generar") {
        if (c && !confirm(`¿Regenerar el código de ${g.grupo}? El anterior dejará de funcionar.`)) return;
        const r = await fetch("/api/codigos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(g) });
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
    } catch { avisar("No se pudo conectar con el servidor.", false); }
  });

  await cargar();
}