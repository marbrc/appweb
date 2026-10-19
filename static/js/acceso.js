// acceso.js, la entrada del alumno, toma el código del enlace o escrito, le pregunta al servidor
// de qué grupo es y si está bien, guarda la sesión de alumno y lo manda al marco
import { buscar } from "/static/js/nucleo/utiles.js";

const f = buscar("#form-codigo"), campo = buscar("#codigo"), msg = buscar("#msg");
let datos = null, codigoValido = ""; // lo que regresó el servidor (grupo, carrera, cuatri) y el codigo que sirvió

// avisar, muestra el mensaje de error o lo esconde si va vacio
const avisar = t => { msg.textContent = t; msg.hidden = !t; };

// solo letras y números en mayusculas 
const limpiar = t => t.toUpperCase().replace(/[^A-Z0-9]/g, "");
campo.addEventListener("input", () => { campo.value = limpiar(campo.value); avisar(""); });

// validar, pregunta al servidor si el código existe
async function validar(codigo) {
  avisar("");
  try {
    const r = await fetch("/api/codigos/" + encodeURIComponent(codigo));
    if (r.status === 404) return avisar("Ese código no es válido o ya no está activo. Pídele uno nuevo a tu profesor.");
    if (!r.ok) throw new Error("servidor");
    datos = await r.json();
    codigoValido = codigo;
    // textContent y no innerHTML, por seguridad
    buscar("#d-carrera").textContent = datos.carrera;
    buscar("#d-cuatri").textContent = datos.cuatri + "° cuatrimestre";
    buscar("#d-grupo").textContent = datos.grupo;
    buscar("#paso-codigo").hidden = true;
    buscar("#paso-grupo").hidden = false;
  } catch {
    avisar("No se pudo conectar con el servidor. Intenta de nuevo.");
  }
}

f.addEventListener("submit", e => { e.preventDefault(); validar(campo.value); });

// no es mi grupo, regresa a pedir otro código
buscar("#otro").onclick = () => {
  datos = null; campo.value = "";
  buscar("#paso-grupo").hidden = true;
  buscar("#paso-codigo").hidden = false;
  history.replaceState(null, "", "/alumno"); // quita el ?c= de la dirección
  campo.focus();
};

// comenzar, guarda la sesión del alumno y entra al marco, no se guarda nombre ni correo es anónimo
buscar("#comenzar").onclick = () => {
  localStorage.setItem("sesion", JSON.stringify({ nombre: "Alumno", rol: "alumno", codigo: codigoValido, ...datos }));
  location.href = "/app#alumno/inicio";
};

// si el enlace trae ?c=CODIGO se valida solo sin que escriba nada
const inicial = limpiar(new URLSearchParams(location.search).get("c") || "");
if (inicial) { campo.value = inicial; validar(inicial); }