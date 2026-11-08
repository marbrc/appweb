// /static/js/acceso.js
import { buscar } from "/static/js/nucleo/utiles.js";

const f = buscar("#form-codigo"), campo = buscar("#codigo"), msg = buscar("#msg");
let datos = null, codigoValido = "";

const avisar = t => { msg.textContent = t; msg.hidden = !t; };
const poner = (id, t) => { const el = buscar(id); if (el) el.textContent = t; };

const limpiar = t => t.toUpperCase().replace(/[^A-Z0-9]/g, "");
campo.addEventListener("input", () => { campo.value = limpiar(campo.value); avisar(""); });

async function validar(codigo) {
  avisar("");
  try {
    const r = await fetch("/api/codigos/" + encodeURIComponent(codigo));
    if (r.status === 404) return avisar("Ese código no es válido o ya no está activo. Pídele uno nuevo a tu profesor.");
    if (!r.ok) throw new Error("servidor");
    datos = await r.json();
    codigoValido = codigo;

    poner("#d-carrera", datos.carrera);
    poner("#d-cuatri", datos.cuatri + "° cuatrimestre");
    poner("#d-grupo", datos.grupo);
    poner("#d-docente", datos.docenteNombre || datos.docente);
    poner("#d-materia", datos.materia);
    buscar("#paso-codigo").hidden = true;
    buscar("#paso-grupo").hidden = false;
  } catch {
    avisar("No se pudo conectar con el servidor. Intenta de nuevo.");
  }
}

f.addEventListener("submit", e => { e.preventDefault(); validar(campo.value); });

buscar("#otro").onclick = () => {
  datos = null; campo.value = "";
  buscar("#paso-grupo").hidden = true;
  buscar("#paso-codigo").hidden = false;
  history.replaceState(null, "", "/alumno");
  campo.focus();
};

buscar("#comenzar").onclick = () => {
  localStorage.setItem("sesion", JSON.stringify({ nombre: "Alumno", rol: "alumno", codigo: codigoValido, ...datos }));
  location.href = "/app#alumno/evaluar";
};

const inicial = limpiar(new URLSearchParams(location.search).get("c") || "");
if (inicial) { campo.value = inicial; validar(inicial); }