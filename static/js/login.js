// /static/js/login.js
// iniciar sesión, registrarse y recuperar contraseña
// ANTES el login dejaba entrar con cualquier correo y contraseña porque no le preguntaba nada al servidor,
// ahora se revisa contra la tabla Administrador de SQL Server (la contraseña va encriptada con SHA2_256)
import { buscar, buscarTodos, api, cargando, ojitos, fuerza, REGLA_CLAVE, MSG_CLAVE } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";

pintarIconos();
ojitos();

// ---------- REGLAS (las mismas de validacion.js de la documentacion) ----------
const NOMBRE = /^[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]*\.?(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]*\.?){0,4}$/;
const CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// error, pone el mensaje rojo en el formulario (o lo quita si va vacio)
const error = (form, texto) => { const m = buscar("[data-error]", form); m.className = "msg err"; m.textContent = texto || ""; m.hidden = !texto; };

// ---------- CAMBIAR DE VISTA SEGUN EL # ----------
const VISTAS = { login: "#v-login", registro: "#v-registro", recuperar: "#v-recuperar" };
function mostrar() {
  const v = VISTAS[location.hash.slice(1)] ? location.hash.slice(1) : "login";
  Object.entries(VISTAS).forEach(([k, sel]) => { buscar(sel).hidden = k !== v; });
  document.title = { login: "Iniciar sesión", registro: "Crear cuenta", recuperar: "Recuperar contraseña" }[v] + " · Encuesta Docente UTNG";
  if (v === "recuperar") paso(1);
  buscar(VISTAS[v] + " input")?.focus();
}
addEventListener("hashchange", mostrar);

// si ya tiene la sesion iniciada (y el servidor dice que sigue valida) lo mando directo al sistema
if (localStorage.getItem("sesion")) {
  api("/api/yo").then(() => location.replace("/app")).catch(() => localStorage.removeItem("sesion"));
}
mostrar();

// entrar, guarda la sesion en el navegador y abre el marco
const entrar = usuario => {
  localStorage.setItem("sesion", JSON.stringify(usuario));
  location.href = "/app";
};

// ---------- 1 INICIAR SESIÓN ----------
const fLogin = buscar("#v-login");
fLogin.addEventListener("submit", async e => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(fLogin));
  if (!CORREO.test(d.correo.trim())) return error(fLogin, "Escribe un correo válido.");
  if (!d.clave) return error(fLogin, "Escribe tu contraseña.");
  error(fLogin);
  const btn = buscar(".btn", fLogin);
  cargando(btn, true);
  try {
    entrar(await api("/api/login", { metodo: "POST", datos: { correo: d.correo.trim(), clave: d.clave, recordar: !!d.recordar } }));
  } catch (err) {
    error(fLogin, err.message);
    fLogin.clave.select();
    cargando(btn, false);
  }
});

// ---------- 2 REGISTRO ----------
const fReg = buscar("#v-registro");
fReg.clave.addEventListener("input", () => buscar("#fuerza-reg").dataset.n = fuerza(fReg.clave.value));
// marca en rojo el campo que esta mal en cuanto sales de el
const reglasReg = {
  nombres: v => NOMBRE.test(v) && v.length >= 2 || "El nombre debe empezar con mayúscula y llevar solo letras.",
  paterno: v => NOMBRE.test(v) || "El apellido paterno debe empezar con mayúscula y llevar solo letras.",
  materno: v => !v || NOMBRE.test(v) || "El apellido materno debe empezar con mayúscula y llevar solo letras.",
  correo: v => CORREO.test(v) || "Escribe un correo válido.",
  clave: v => REGLA_CLAVE.test(v) || MSG_CLAVE,
  clave2: v => v === fReg.clave.value || "Las contraseñas no son iguales."
};
const revisar = campo => {
  const r = reglasReg[campo.name]?.(campo.name.startsWith("clave") ? campo.value : campo.value.trim().replace(/\s+/g, " "));
  campo.setCustomValidity(r === true ? "" : r || "");
  return r === true ? null : r;
};
buscarTodos("input", fReg).forEach(c => c.addEventListener("blur", () => revisar(c)));

fReg.addEventListener("submit", async e => {
  e.preventDefault();
  const primero = buscarTodos("input", fReg).map(c => [c, revisar(c)]).find(([, r]) => r);
  if (primero) { primero[0].focus(); return error(fReg, primero[1]); }
  error(fReg);
  const d = Object.fromEntries(new FormData(fReg));
  ["nombres", "paterno", "materno", "correo"].forEach(k => d[k] = d[k].trim().replace(/\s+/g, " "));
  const btn = buscar(".btn", fReg);
  cargando(btn, true);
  try {
    entrar(await api("/api/registro", { metodo: "POST", datos: d }));
  } catch (err) {
    error(fReg, err.message);
    cargando(btn, false);
  }
});

// ---------- 3 RECUPERAR CONTRASEÑA ----------
const r1 = buscar("#rec-1"), r2 = buscar("#rec-2"), r3 = buscar("#rec-3");
let correoRec = "", codigoRec = "";

// paso, enseña el paso 1, 2 o 3 y prende las bolitas de arriba
function paso(n) {
  [r1, r2, r3].forEach((f, i) => { f.hidden = i !== n - 1; error(f); });
  buscarTodos("#pasos li").forEach((li, i) => { li.classList.toggle("on", i < n); li.classList.toggle("actual", i === n - 1); });
  if (n === 1) { r1.reset(); r2.reset(); r3.reset(); }
  setTimeout(() => buscar("input", [r1, r2, r3][n - 1])?.focus(), 50);
}

async function mandarCodigo(btn) {
  cargando(btn, true);
  try {
    const r = await api("/api/recuperar", { metodo: "POST", datos: { correo: correoRec } });
    buscar("#rec-aviso").textContent = r.prueba
      ? "Modo prueba: el correo todavía no está configurado (correo.py), el código salió en la terminal donde corre flask."
      : `Si ${correoRec} tiene cuenta, te llegó un código. Sirve 15 minutos, revisa también la carpeta de spam.`;
    paso(2);
  } catch (err) {
    error(r2.hidden ? r1 : r2, err.message);
  }
  cargando(btn, false);
}

r1.addEventListener("submit", e => {
  e.preventDefault();
  correoRec = r1.correo.value.trim().toLowerCase();
  if (!CORREO.test(correoRec)) return error(r1, "Escribe un correo válido.");
  mandarCodigo(buscar(".btn", r1));
});

buscar("#reenviar").onclick = e => mandarCodigo(e.currentTarget);
r2.codigo.addEventListener("input", () => { r2.codigo.value = r2.codigo.value.replace(/\D/g, "").slice(0, 6); });

r2.addEventListener("submit", async e => {
  e.preventDefault();
  codigoRec = r2.codigo.value;
  if (!/^\d{6}$/.test(codigoRec)) return error(r2, "El código son 6 números.");
  const btn = buscar(".btn", r2);
  cargando(btn, true);
  try {
    await api("/api/recuperar/verificar", { metodo: "POST", datos: { correo: correoRec, codigo: codigoRec } });
    paso(3);
  } catch (err) { error(r2, err.message); }
  cargando(btn, false);
});

r3.clave.addEventListener("input", () => buscar("#fuerza-rec").dataset.n = fuerza(r3.clave.value));
r3.addEventListener("submit", async e => {
  e.preventDefault();
  if (!REGLA_CLAVE.test(r3.clave.value)) return error(r3, MSG_CLAVE);
  if (r3.clave.value !== r3.clave2.value) return error(r3, "Las contraseñas no son iguales.");
  const btn = buscar(".btn", r3);
  cargando(btn, true);
  try {
    await api("/api/recuperar/cambiar", { metodo: "POST", datos: { correo: correoRec, codigo: codigoRec, clave: r3.clave.value } });
    location.hash = "#login";
    fLogin.correo.value = correoRec;
    const m = buscar("[data-error]", fLogin);
    m.className = "msg ok"; m.textContent = "Listo, tu contraseña se cambió. Ya puedes entrar."; m.hidden = false;
    fLogin.clave.focus();
  } catch (err) { error(r3, err.message); }
  cargando(btn, false);
});
