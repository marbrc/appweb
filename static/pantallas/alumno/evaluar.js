// /static/pantallas/alumno/evaluar.js
import { buscar, buscarTodos } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getPreguntas, getGrupos, getEvaluaciones, addEvaluacion, obtenerSesion, cerrarSesion } from "/static/js/nucleo/datos.js";

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function iniciar(cont) {
  const info = buscar("#clase-info", cont);
  const s = obtenerSesion();

  // sin sesión de alumno no hay clase que evaluar
  if (!s || s.rol !== "alumno" || !s.grupo) {
    info.textContent = "No hay clase activa. Vuelve a entrar con tu código.";
    return;
  }

  const docente = s.docenteNombre || s.docente || "";

  // 1. selects precargados y bloqueados
  const poner = (id, texto) => {
    const el = buscar(id, cont);
    el.innerHTML = `<option>${esc(texto)}</option>`;
    el.disabled = true;
  };
  poner("#f-carrera", s.carrera);
  poner("#f-grupo", `${s.cuatri}° ${s.grupo}`);
  poner("#f-clase", `${s.materia} — ${docente}`);
  info.textContent = `Evaluando a ${docente}, materia ${s.materia} (grupo ${s.grupo}, ${s.cuatri}° cuatrimestre)`;

  // 2. preguntas con botones del 5 al 10
  const preguntas = getPreguntas() || [];
  const fs = buscar("#preguntas", cont);
  fs.innerHTML = preguntas.length
    ? preguntas.map((p, i) => `
        <fieldset>
          <legend>${i + 1}. ${esc(p.texto)}</legend>
          <div class="esc">${Array.from({ length: 6 }, (_, k) => `
            <label><input type="radio" name="p${i + 1}" value="${k + 5}" required><span>${k + 5}</span></label>`).join("")}
          </div>
        </fieldset>`).join("")
    : "<p>No hay preguntas configuradas en el sistema.</p>";
  fs.disabled = false;

  // 3. progreso
  const cuenta = () => {
    const n = buscarTodos("#preguntas input:checked", cont).length;
    buscar("#cuenta-eval", cont).textContent = `${n} de ${preguntas.length} respondidas`;
    buscar(".prog i", cont).style.width = preguntas.length ? (n / preguntas.length * 100) + "%" : "0%";
  };
  fs.addEventListener("change", cuenta);
  cuenta();
  pintarIconos(cont);

  // 4. enviar
  const form = buscar("#form-eval", cont);
  form.addEventListener("submit", e => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(form));
    const califs = preguntas.map((_, i) => Number(datos["p" + (i + 1)]));

    addEvaluacion({
      fecha: new Date().toLocaleDateString("es-MX"),
      carrera: s.carrera,
      cuatrimestre: s.cuatri,
      grupo: s.grupo,
      profesor: docente,
      materia: s.materia,
      calificaciones: califs,
      promedio: +(califs.reduce((a, b) => a + b, 0) / califs.length).toFixed(1),
      comentario: (datos.comentario || "").trim()
    });

    // contador: cuántos han evaluado a ese profe en esa materia y grupo (contándote)
    const n = (getEvaluaciones() || []).filter(x =>
      x.grupo === s.grupo && x.profesor === docente && x.materia === s.materia).length;
    const g = (getGrupos() || []).find(x => x.clave === s.grupo);
    buscar("#turno-num", cont).textContent = `Eres el alumno ${n}${g?.alumnos ? " de " + g.alumnos : ""} en evaluar`;

    ["#form-eval", ".filtros", "#clase-info", "#cuenta-eval", ".prog"].forEach(q => { buscar(q, cont).hidden = true; });
    buscar("#gracias", cont).hidden = false;

    cerrarSesion();   // ya contestó
    setTimeout(() => { location.href = "/alumno"; }, 3500);
  });
}