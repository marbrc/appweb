// /static/js/acceso.js
// todo lo del alumno: valida el codigo, confirma su clase, le pone las preguntas una por una y manda la evaluacion
// ANTES el alumno se mandaba al marco del admin y las preguntas salian de un json, por eso no funcionaban
import { buscar, buscarTodos, api, confirmar, cargando } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";

pintarIconos();

const f = buscar("#form-codigo"), campo = buscar("#codigo"), msg = buscar("#msg");
let datos = null, codigoValido = "", preguntas = [], respuestas = {}, actual = 0;

const avisar = t => { msg.textContent = t; msg.hidden = !t; };
const poner = (id, t) => { const el = buscar(id); if (el) el.textContent = t; };
const limpiar = t => t.toUpperCase().replace(/[^A-Z0-9]/g, "");

// ir, cambia de paso con una transicion suavecita
const PASOS = ["#paso-codigo", "#paso-grupo", "#paso-preguntas", "#paso-comentario", "#paso-gracias"];
function ir(paso) {
  PASOS.forEach(p => { buscar(p).hidden = p !== paso; });
  const el = buscar(paso);
  el.classList.remove("entra"); el.offsetHeight; el.classList.add("entra");
  scrollTo({ top: 0, behavior: "smooth" });
}

campo.addEventListener("input", () => { campo.value = limpiar(campo.value); avisar(""); });

// ---------- 1 VALIDAR EL CODIGO ----------
async function validar(codigo) {
  avisar("");
  if (codigo.length !== 6) return avisar("El código tiene 6 letras y números.");
  const btn = buscar(".btn", f);
  cargando(btn, true);
  try {
    // las dos cosas al mismo tiempo: la clase del codigo y las preguntas activas
    [datos, preguntas] = await Promise.all([
      api("/api/codigos/" + encodeURIComponent(codigo)),
      api("/api/preguntas")
    ]);
    codigoValido = codigo;
    if (!preguntas.length) { cargando(btn, false); return avisar("Todavía no hay preguntas en el sistema, avísale a tu profesor."); }

    poner("#d-docente", datos.docenteNombre || datos.docente);
    poner("#d-materia", datos.materia);
    poner("#d-grupo", `${datos.grupo} · ${datos.cuatri}° cuatrimestre`);
    poner("#d-carrera", datos.carrera);
    poner("#d-cuantas", `Son ${preguntas.length} preguntas, te toma unos 2 minutos.`);
    buscar("#ya-contesto").hidden = !localStorage.getItem("contestado:" + codigo);
    history.replaceState(null, "", "/alumno?c=" + codigo);
    ir("#paso-grupo");
  } catch (e) {
    avisar(e.message.includes("no válido") || e.message.includes("Código")
      ? "Ese código no es válido o ya no está activo. Pídele uno nuevo a tu profesor."
      : e.message);
  }
  cargando(btn, false);
}

f.addEventListener("submit", e => { e.preventDefault(); validar(campo.value); });

buscar("#otro").onclick = () => {
  datos = null; campo.value = "";
  history.replaceState(null, "", "/alumno");
  ir("#paso-codigo");
  campo.focus();
};

// ---------- 2 Y 3 LAS PREGUNTAS UNA POR UNA ----------
buscar("#comenzar").onclick = () => {
  respuestas = {}; actual = 0;
  poner("#preg-clase", `${datos.materia} · ${datos.docenteNombre || datos.docente}`);
  ir("#paso-preguntas");
  mostrarPregunta(0);
};

// la escala del 5 al 10, cada boton con su color (rojo, amarillo, verde)
buscar("#escala").innerHTML = [5, 6, 7, 8, 9, 10].map(n =>
  `<button type="button" class="nota n${n}" role="radio" aria-checked="false" data-v="${n}">${n}</button>`).join("");

function mostrarPregunta(i, direccion = 1) {
  actual = i;
  const p = preguntas[i], caja = buscar(".preg-caja");
  caja.classList.remove("de-der", "de-izq"); caja.offsetHeight;
  caja.classList.add(direccion > 0 ? "de-der" : "de-izq");   // entra por la derecha o por la izquierda
  poner("#preg-num", `Pregunta ${i + 1} de ${preguntas.length}`);
  poner("#preg-texto", p.texto);
  buscar("#preg-barra").style.width = (Object.keys(respuestas).length / preguntas.length * 100) + "%";
  buscarTodos(".nota").forEach(b => {
    const elegida = respuestas[p.id] === +b.dataset.v;
    b.classList.toggle("on", elegida);
    b.setAttribute("aria-checked", elegida);
  });
  buscar("#anterior").disabled = i === 0;
  buscar("#siguiente").disabled = !respuestas[p.id];
  poner("#sig-txt", i === preguntas.length - 1 ? "Terminar" : "Siguiente");
}

function elegir(v) {
  const p = preguntas[actual];
  respuestas[p.id] = v;
  mostrarMarcada();
  // se pasa solita a la siguiente despues de un ratito para que vea lo que eligio
  clearTimeout(elegir.t);
  elegir.t = setTimeout(siguiente, 380);
}
function mostrarMarcada() {
  const v = respuestas[preguntas[actual].id];
  buscarTodos(".nota").forEach(b => { b.classList.toggle("on", +b.dataset.v === v); b.setAttribute("aria-checked", +b.dataset.v === v); });
  buscar("#siguiente").disabled = false;
  buscar("#preg-barra").style.width = (Object.keys(respuestas).length / preguntas.length * 100) + "%";
}
function siguiente() {
  if (!respuestas[preguntas[actual].id]) return;
  if (actual < preguntas.length - 1) mostrarPregunta(actual + 1, 1);
  else { ir("#paso-comentario"); buscar("#comentario").focus(); }
}

buscar("#escala").onclick = e => { const b = e.target.closest(".nota"); if (b) elegir(+b.dataset.v); };
buscar("#siguiente").onclick = siguiente;
buscar("#anterior").onclick = () => { clearTimeout(elegir.t); if (actual > 0) mostrarPregunta(actual - 1, -1); };
// con el teclado tambien: 5 a 9 y el 0 es el 10, flechas para moverse
addEventListener("keydown", e => {
  if (buscar("#paso-preguntas").hidden || e.target.tagName === "TEXTAREA") return;
  if (/^[5-9]$/.test(e.key)) elegir(+e.key);
  if (e.key === "0") elegir(10);
  if (e.key === "ArrowRight" || e.key === "Enter") siguiente();
  if (e.key === "ArrowLeft") buscar("#anterior").click();
});

// ---------- 4 COMENTARIO Y ENVIAR ----------
const com = buscar("#comentario");
com.addEventListener("input", () => poner("#com-cont", `${com.value.length}/300`));
buscar("#volver-preg").onclick = () => { ir("#paso-preguntas"); mostrarPregunta(preguntas.length - 1, -1); };

buscar("#enviar").onclick = async e => {
  const btn = e.currentTarget, err = buscar("#msg-envio");
  err.hidden = true;
  if (Object.keys(respuestas).length < preguntas.length) return ir("#paso-preguntas"), mostrarPregunta(0);
  if (!await confirmar("Después de enviarla ya no la puedes cambiar.", { titulo: "¿Enviar tu evaluación?", si: "Enviar" })) return;
  cargando(btn, true);
  try {
    await api("/api/evaluaciones", { metodo: "POST", datos: { codigo: codigoValido, respuestas, comentario: com.value.trim() } });
    localStorage.setItem("contestado:" + codigoValido, "1");   // solo para avisarle si vuelve a entrar
    com.value = ""; poner("#com-cont", "0/300");
    ir("#paso-gracias");
  } catch (ex) {
    err.textContent = ex.message; err.hidden = false;
  }
  cargando(btn, false);
};

buscar("#otra").onclick = () => buscar("#otro").click();

// si llego con el enlace (/alumno?c=K7M2QP) se valida solito
const inicial = limpiar(new URLSearchParams(location.search).get("c") || "");
if (inicial) { campo.value = inicial; validar(inicial); }
