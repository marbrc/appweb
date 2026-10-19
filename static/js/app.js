
// pantallas de la Encuestaaaaa
// tdv no hay base de datoooos. usuarios y evaluaciones se guardan locamente y eso solo solo para probar


const PREG = [
  "El profesor expone los contenidos y prácticas de su asignatura de manera clara, gradual y congruente.",
  "El profesor proporciona orientación y apoyo a los alumnos con problemas de aprendizaje.",
  "Propicia un ambiente de confianza y de participación durante la clase.",
  "Establece controles de evaluación del aprendizaje considerando: exámenes parciales, participación, trabajos, prácticas, etc.",
  "El profesor da seguimiento al programa, considerando los propósitos y contenidos, a fin de lograr el saber, el saber hacer y el saber ser.",
  "El profesor emplea métodos didácticos (gráficas, folletos, acetatos, ilustraciones, dinámicas de grupo o trabajos en equipo) para facilitar la comprensión de los temas.",
  "El profesor proporciona mayores referencias sobre los temas que se les dificulta a los alumnos.",
  "El profesor responde todas las preguntas formuladas por los alumnos.",
  "El profesor muestra disposición para atender a los alumnos dentro y fuera de clase para resolver y aclarar preguntas o dudas en temas que te interesen.",
  "El nivel de dificultad de los ejemplos de clase es congruente con el de los exámenes.",
  "El profesor entra a tiempo a clase.",
  "El profesor fomenta el auto-aprendizaje o actividades de lectura."
];
// datos tipo ej, para que salgan en el reporte de muestra (datos de prueba)9
const PROM = [9.6, 9.4, 9.3, 9.4, 9.4, 9.3, 9.2, 9.5, 9.5, 9.5, 9.3, 9.4];
const COMS = ["que nos más ejercicios", "siga así es muy buena profesoraa", "que nos brinde ayuda extra en la  clase", "que sea un poco más dinamica la clase", "q por favoor  no avance tan rapido las diapositivas"];
const REP = [["15/10/2026", "GTID243", "Vazquez Juarez Erika", "9.2"], ["14/10/2026", "GTID241", "Sustaita Cruces Daniel", "7.0"], ["14/10/2026", "GTID242", "Rodriguez Garcia Anastacio", "8.5"]];
const PANEL = { alumno: "alumno", docente: "docente", administrador: "admin" };

// mapa curricular: cada carrera con sus materias y sus grupos por cuatrimestre
// ahorita son de ejemplo y cuando tengamos el mapa de verdad solo se cambia aqui
const CARRERAS = {
  "Desarrollo de Software": {
    materias: { 1: ["Programación Estructurada", "Calculo de varias variables"], 2: ["Bases de datos", "Ingles"], 3: ["Redes", "Estadística"] },
    grupos: { 1: ["GTRD321", "GTID143"], 2: ["GTID321", "GT1IDW32"], 3: ["GTID456"] }
  },
  "Entornos virtuales": {
    materias: { 1: ["Fisica", "Calculo Diferencial"], 2: ["Redes", "Ingle"] },
    grupos: { 1: ["GTID432"], 2: ["GTID123"] }
  },
  "Mecatrónica": {
    materias: { 1: ["Electrónica", "Física"], 2: ["Programación", "Idioma Extranjero"] },
    grupos: { 1: ["GTID342"], 2: ["GTID341"] }
  }
};

// lista de profesores (de ejemplo)
const PROFESORES = ["Vazquez Juarez Erika", "Sustaita Cruces Daniel", "Rodriguez Garcia Anastacio", "Hernández Monzón Verónica"];

// reporte de muestra: las 12 calificaciones de cada alumno y al final su comentario (de la hoja de reporte)
const REPORTE_EJ = [
  [9, 9, 9, 9, 9, 9, 9, 9, 8, 8, 8, 8, "Que proporcione más ejercicios"],
  [10, 10, 9, 10, 10, 10, 10, 10, 9, 9, 10, 10, ""],
  [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, ""],
  [9, 8, 9, 9, 9, 8, 8, 10, 10, 9, 8, 8, "Que proporcione más ejercicios"],
  [9, 9, 9, 9, 9, 9, 8, 9, 9, 9, 9, 8, ""]
];

//  VARIABLES

// buscar es la abreviscion para document.querySelector y este busca UN elemento de la pagina
// s es lo que busco ej. #salir y r es donde lo busco porque si no digo nada busca en toda la pg
// ej. buscar #salir encuentra el elemento con id="salir
const buscar = (s, r = document) => r.querySelector(s);

// buscarTodos busca tds los elementos que coincidan y  Los tres puntitos ... los convierten en una lista
// normal para poder usar forEach 
const buscarTodos = (s, r = document) => [...r.querySelectorAll(s)];

// leer saca una lista guardada en el navegador c
// y si no hay nada o hay error regresa una lista vacia []
const leer = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };

// guardar: guarda una lista en el navegador con el nombre k
// JSON.stringify la pasa a texto porquue localStorage solo guarda texto
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Variables q van cambiando mientras se usa la pagina
// flujo = si estoy en registro o en " recuperar, es para saber a donde ir despues del código
// correo = el correo con el que estoy ingressndo
// sesion = el usuario que inició sesión y null significa que nadie
let flujo = "registro", correo = "", sesion = null;


// --------NAVEGACIÓN ENTRE lASS PANTALLAS ----------

// aqui cada pantalla es una <section class="pantalla" id=algo> del HTML y solo se ve una a la vez
// La que se ve depende del # de la dirección, ej. pagina#login
function mostrar() {
  let id = location.hash.slice(1);        // lo que viene despues del # sin el #
  const el = document.getElementById(id); // busco la pantalla con ese id
  if (!el || !el.classList.contains("pantalla")) id = "bienvenida"; //  y si no existe muestro la de bienvenida
  buscarTodos(".pantalla").forEach(p => p.hidden = p.id !== id); // escondr todas menos la que quiero
  buscar("#salir").hidden = !sesion;      // "cerrar sesión solo se ve si hay una sesión iniciada
  scrollTo(0, 0);                         // sube hasta arriba de la página
}

// ir  a login  cambia el # y con eso se abre la pantalla
// si ya esrtamos en ese # nada más se muestro otra vez
const ir = id => location.hash === "#" + id ? mostrar() : (location.hash = id);

// cada vez que cambia el # un clic o con otro boton se ejecuta mostrar
addEventListener("hashchange", mostrar);


// ---------TEMAS DE APARIENCIA DE LAPP (claro, oscuro y negro) ----------

// se pone el tema en el <html> como data-tema = y el csss cambia los colores según ese valor
function tema(t) {
  document.documentElement.dataset.tema = t;        // <html data-tema="oscuro">
  try { localStorage.setItem("tema", t); } catch {} // lo guardo para acordarme del ultimo que elegi
}

// al abrir la pagina  se usa el tema guardado  y si no hay ninguno uso el claro
try { tema(localStorage.getItem("tema") || "claro"); } catch { tema("claro"); }


// ---------- los clics ----------

// esccha todos los clics de la pagina en un solo lugar
document.addEventListener("click", e => {
  // e.target es lo que se tocó closest busca ese elemento o un padre suyo con ese atributo o clase
  const a = e.target.closest("[data-ir]"), t = e.target.closest("[data-t]"), o = e.target.closest(".ojo");

  // data-ir="login": botones y links que llevan a otra pantalla
  // preventDefault evita que el link haga lo normal de brincar
  // Si es el botón Cerrar sesión primero borro la sesión
  if (a) { e.preventDefault(); if (a.id === "salir") sesion = null; ir(a.dataset.ir); }

  // data-t="oscuro": botones del menú de configuració  cambian el tema y cierran el menú
  if (t) { tema(t.dataset.t); buscar(".cfg").open = false; }

  // .ojo: el ojito de la contraseña cambia el campo entre password de puntitos y despues ya se ve
  if (o) { const i = o.previousElementSibling; i.type = i.type === "password" ? "text" : "password"; }
});

// se ppone el ojito dentro de cada campo de contraseña .pw desde aqui para no repetirlo en el HTML
buscarTodos(".pw").forEach(p => p.insertAdjacentHTML("beforeend", '<button type="button" class="ojo" aria-label="Mostrar u ocultar contraseña">👁</button>'));


// ----------FORMULARIOS ----------

// msg: muestra o borra el mensaje de error rojo de un formulario
// f es el formulario y t el textoy si t viene vacio se esconde el mensaje
const msg = (f, t) => { const e = buscar(".err", f); if (e) { e.textContent = t; e.hidden = !t; } };

// entrar: guarda la sesión sin la contraseña y manda al marco, ahí se arma el menú segun el rol
const entrar = u => { localStorage.setItem("sesion", JSON.stringify({ nombre: u.nombre, correo: u.correo, rol: u.rol })); location.href = "/app"; };

// aqui esta lo que hace cada formulario cuando se envia
// cada uno recibe f de el formulario y d de los datos que escribió la persona
const forms = {
  // iniciar sesión: busca un usuario con ese correo y esa contraseña
    // y si no existe muestro el error, si existe limpia el formulario y deja entrar
  login(f, d) {
    const u = leer("usuarios").find(x => x.correo === d.correo && x.clave === d.clave);
    if (!u) return msg(f, "Correo o contraseña incorrectos. Si no tienes cuenta, regitate.");
    f.reset(); entrar(u);
  },

  // registro: si el correo ya existe marco error y Si no guardo al usuario
  // los tres puntitos ...us copian los usuarios que ya había y pasa a la pantalla del codigo
  registro(f, d) {
    const us = leer("usuarios");
    if (us.some(x => x.correo === d.correo)) return msg(f, "Ese correo ya está registrado.");
    guardar("usuarios", [...us, d]);
    flujo = "registro"; correo = d.correo; f.reset(); ir("codigo");
  },

  // recuperar contraseña: solo se acuerda del correo y de que  va a recuperar y paso a pedir el codigo
  // peroooooo POR AHORITA NO SE MANDA NIGUN CORREO DE VERDADDD, SOLO ES POR PRUEBA
  recuperar(f, d) { flujo = "recuperar"; correo = d.correo; f.reset(); ir("codigo"); },

  // código: junta los 6 dígitos y revisa que estén completos y AHORTIA SIVE CUALQUIER CODIGO QUE LE PONGAMOS 
  // si venía del registro lo deja entrar y si venía de recuperar lo manda a crear su contraseña nueva
  codigo(f) {
    const cods = buscarTodos(".cod", f);
    if (cods.map(c => c.value).join("").length < 6) return msg(f, "Escribe los 6 dígitos del código.");
    cods.forEach(c => c.value = "");
    if (flujo !== "registro") return ir("nueva");
    const u = leer("usuarios").find(x => x.correo === correo);
    u ? entrar(u) : ir("login");
  },

  // nueva contraseña: revisa que las dos sean iguales, le cambia la contraseña a ese usuario y va al login
  nueva(f, d) {
    if (d.clave !== d.clave2) return msg(f, "Las contraseñas no coinciden.");
    const us = leer("usuarios"), u = us.find(x => x.correo === correo);
    if (u) { u.clave = d.clave; guardar("usuarios", us); }
    f.reset(); ir("login");
  },

  // Encuesta del alumno: guardo la evaluación con la fecha y limpia todo para otra evaluación
  eval(f, d) {
    // la evaluacion es anonima no se guarda ningun dato del alumno
    guardar("evaluaciones", [...leer("evaluaciones"), { fecha: new Date().toLocaleDateString("es-MX"), ...d }]);
    f.reset(); iniciar(); cuenta(); ir("enviado"); celebrar();
  }
};

// escucha el envio de todos los formularios, Los que tienen data-f="algo" usan la función con ese nombre
// de arriba Object.fromEntriesnew FormData(f)) convierte lo escrito en un objeto
// ej { correo: ".", clave: "." }
document.addEventListener("submit", e => {
  const f = e.target.closest("[data-f]");
  if (!f) return;
  e.preventDefault(); msg(f, ""); // evita que la pagina se recargue y borro el error anterior
  forms[f.dataset.f](f, Object.fromEntries(new FormData(f)));
});


// ---------- EL CÓDIGO DE 6 DÍGITOS ----------

// se hace los 6 cuadritos repitiendo el mismo input 6 veces
buscar(".codigo").innerHTML = '<input class="cod" maxlength="1" inputmode="numeric" aria-label="Dígito">'.repeat(6);

// en cada cuadrito dejo solo números (/\D/g es todo lo que no sea dígito) y pasa al sig
buscarTodos(".cod").forEach((c, i, l) => c.addEventListener("input", () => {
  c.value = c.value.replace(/\D/g, "");
  if (c.value && l[i + 1]) l[i + 1].focus();
}));


// ---------- ALUMNO: LAS 12 PREGUNTAS ----------

// por cada pregunta arma su bloque con 10 botones del 1 al 10 (radio = solo se puede elegir uno)
// lo que va dentro de ${ } se mete en el texto que esta entre comillas invertidas ` `
buscar("#preguntas").innerHTML = PREG.map((q, i) => `<fieldset><legend>${i + 1}. ${q}</legend><div class="esc">${
  // ahorita son 6 botones del 5 al 10 (k + 5 hace que empiece en 5)
  Array.from({ length: 6 }, (_, k) => `<label><input type="radio" name="p${i + 1}" value="${k + 5}" required><span>${k + 5}</span></label>`).join("")
}</div></fieldset>`).join("");

// cuenta: cuenta cuantas preguntas ya contesta lo escribe "3 de 12 respondidas" y sogue la barra de avance
function cuenta() {
  const n = buscarTodos("#preguntas input:checked").length;
  buscar("#cuenta").textContent = n + " de 12 respondidas";
  buscar(".prog i").style.width = n / 12 * 100 + "%";
}

// cada vez que contesta algo esconde el "Gracias" de la ev anterior y vuelvo a contar
buscar("#preguntas").addEventListener("change", () => { buscar("#gracias").hidden = true; cuenta(); });


// ---------- ALUMNO: FILTROS EN CASCADA ----------
// el orden: carrera > cuatrimestre > grupo > profesor y materia
// cada filtro se activa hasta que esvoge el anterior

// sel"carrera" encuentra el select con id="f-carrera"
const sel = k => buscar("#f-" + k);

// que filtros se abren después de elegir uno
const SIG = { carrera: ["cuatri"], cuatri: ["grupo"], grupo: ["prof", "mat"] };

// las opciones de cada filtro los profesores y materias dependen de la carrera elegid
// y los grupos del cuatrimestre parseInt saca el numero, ej.  "3 cuatrimestre" saca 3)
// ahora las carreras, cuatrimestres, grupos y materias salen del mapa curricular CARRERAS y los profesores de PROFESORES
const OPC = {
  carrera: () => Object.keys(CARRERAS),
  cuatri: () => Object.keys(CARRERAS[sel("carrera").value].materias).map(n => `${n}° cuatrimestre`),
  grupo: () => CARRERAS[sel("carrera").value].grupos[parseInt(sel("cuatri").value)] || [],
  prof: () => PROFESORES,
  mat: () => CARRERAS[sel("carrera").value].materias[parseInt(sel("cuatri").value)] || []
};

// poner: llena un filtro con sus opciones y lo activa (abierto = true),
// o lo deja vacio y bloqueado (abierto = false)
function poner(k, abierto) {
  const s = sel(k);
  s.innerHTML = `<option value="">${abierto ? "Selecciona" : "Elige el campo anterior"}</option>` + (abierto ? OPC[k]() : []).map(x => `<option>${x}</option>`).join("");
  s.disabled = !abierto;
}

// limpiar: vacia y bloquea un filtro y también todos los que dependen de el
function limpiar(k) { poner(k, false); (SIG[k] || []).forEach(limpiar); }

// clase: revisa si ya elegí los 5 filtros sisis, desbloquea las preguntas y muestra a quien esta evaluando
// si no las preguntas siguen bloqueadas y se ve el aviso
function clase() {
  const ok = Object.keys(OPC).every(k => sel(k).value);
  buscar("#preguntas").disabled = !ok;
  buscar("#aviso").hidden = ok;
  buscar("#clase").hidden = !ok;
  if (ok) buscar("#clase").textContent = `Evaluando a ${sel("prof").value}, ${sel("mat").value} (grupo ${sel("grupo").value})`;
}

// iniciar: deja los filtros como al principio con solo "carrera" activa
function iniciar() { Object.keys(OPC).forEach(k => poner(k, k === "carrera")); clase(); }

// Cuando cambio un filtro: limpia los que dependen de él, abre el sig,si ya se eligio algo y revisa todo
Object.keys(OPC).forEach(k => sel(k).addEventListener("change", () => {
  (SIG[k] || []).forEach(limpiar);
  if (sel(k).value) (SIG[k] || []).forEach(n => poner(n, true));
  clase();
}));

iniciar(); // al abrir la pag arranco con los filtros limpios


// ----------DOCENTE: SUS RESULTADOS ----------

// promedio general: sumo los 12 promedios reduce divide entre 12 y deja un decimal (toFixed)
buscar("#pg").textContent = (PROM.reduce((a, b) => a + b) / PROM.length).toFixed(1);

// tabla con cada pregunta y su promedio una fila por pregunta
buscar("#tabla-d").innerHTML = PREG.map((q, i) => `<tr><td>${i + 1}</td><td>${q}</td><td>${PROM[i].toFixed(1)}</td></tr>`).join("");

// lista de comentarios
buscar("#coms").innerHTML = COMS.map(c => `<li>${c}</li>`).join("");


// ---------- ADMINISTRADOR: RESUMEN Y MENÚ ----------

// gráfica de barras: cada barra mide lo que vale su promedio 9.6 es 96% de alto
buscar("#barras").innerHTML = PROM.map((v, i) => `<span class="col" title="Pregunta ${i + 1}: ${v}"><i style="height:${v * 10}%"></i>${i + 1}</span>`).join("");

// tabla de reportes recientes una fila por reporte y una celda por dato
buscar("#rep").innerHTML = REP.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("");

// lo de abajo solo se hace si ya esta el index.html nuevo (el que tiene #v-catalogo)
// y si todavia no esta no pasa nada, solo no se ven los catalogos ni los reportes
if (buscar("#v-catalogo")) {

// ----- catalogos: Grupos, Docentes, Materias y Preguntas -----
// filas: saca de CARRERAS una lista de [nombre, carrera, cuatrimestre]
const filas = campo => Object.entries(CARRERAS).flatMap(([carrera, c]) =>
  Object.entries(c[campo]).flatMap(([cuatri, lista]) => lista.map(x => [x, carrera, cuatri])));

// cada catalogo dice su titulo, sus campos y sus datos y con eso se arma sola la tabla y el formulario
const CATALOGOS = {
  grupos: { titulo: "Grupos", campos: ["Clave", "Carrera", "Cuatrimestre"], datos: filas("grupos") },
  docentes: { titulo: "Docentes", campos: ["Nombre"], datos: PROFESORES.map(n => [n]) },
  materias: { titulo: "Materias", campos: ["Nombre", "Carrera", "Cuatrimestre"], datos: filas("materias") },
  preguntas: { titulo: "Preguntas", campos: ["Número", "Texto"], datos: PREG.map((t, i) => [i + 1, t]) }
};
let cat = "grupos", editando = -1; // cat = catalogo que se ve y editando = fila que se edita (-1 es uno nuevo)

// los numeros de Inicio salen de los mismos datos
buscar("#n-grupos").textContent = CATALOGOS.grupos.datos.length;
buscar("#n-docentes").textContent = PROFESORES.length;
buscar("#n-materias").textContent = CATALOGOS.materias.datos.length;

// abrirCatalogo: pone el titulo y los encabezados del catalogo elegido y dibuja su tabla
function abrirCatalogo(nombre) {
  cat = nombre;
  buscar("#cat-titulo").textContent = CATALOGOS[cat].titulo;
  buscar("#cat-form").hidden = true;
  buscar("#cat-head").innerHTML = "<tr>" + CATALOGOS[cat].campos.map(c => `<th>${c}</th>`).join("") + "<th></th></tr>";
  dibujarTabla();
}

// dibujarTabla: una fila por cada registro con sus botones Editar y Eliminar
function dibujarTabla() {
  buscar("#cat-body").innerHTML = CATALOGOS[cat].datos.map((fila, i) =>
    "<tr>" + fila.map(x => `<td>${x}</td>`).join("") +
    `<td><button class="mini" data-editar="${i}">Editar</button> <button class="mini rojo" data-borrar="${i}">Eliminar</button></td></tr>`).join("");
}

// formulario: arma los campos del catalogo. si i es una fila los llena con sus datos y si es -1 quedan vacios
function formulario(i) {
  editando = i;
  const c = CATALOGOS[cat], f = buscar("#cat-form");
  f.innerHTML = c.campos.map((campo, k) =>
    `<label>${campo}<input name="c${k}" required value="${i >= 0 ? String(c.datos[i][k]).replace(/"/g, "&quot;") : ""}"></label>`).join("") +
    '<div class="acciones"><button class="btn">Guardar</button><button type="button" class="btn sec" id="cat-cancelar">Cancelar</button></div>';
  f.hidden = false;
}

// al guardar: si estaba editando cambia esa fila y si no agrega una nueva (POR AHORITA SOLO SE VE EN PANTALLA, NO SE GUARDA)
forms.catalogo = (f, d) => {
  const fila = CATALOGOS[cat].campos.map((_, k) => d["c" + k]);
  if (editando >= 0) CATALOGOS[cat].datos[editando] = fila; else CATALOGOS[cat].datos.push(fila);
  f.hidden = true;
  dibujarTabla();
};

// clics de los botones: Nuevo, Cancelar, Editar y Eliminar
document.addEventListener("click", e => {
  const t = e.target;
  if (t.id === "cat-nuevo") formulario(-1);
  if (t.id === "cat-cancelar") buscar("#cat-form").hidden = true;
  if (t.dataset.editar) formulario(+t.dataset.editar);
  if (t.dataset.borrar) { const n = +t.dataset.borrar; modal("pregunta", "¿Eliminar este registro?", "Esta acción no se puede deshacer.", true).then(ok => { if (ok) { CATALOGOS[cat].datos.splice(n, 1); dibujarTabla(); modal("ok", "Listo", "Se eliminó correctamente."); } }); }
});

// ----- reportes -----
// lleno los filtros con los datos que ya tenemos
const llenar = (id, lista) => buscar(id).innerHTML = lista.map(x => `<option>${x}</option>`).join("");
llenar("#r-grupo", CATALOGOS.grupos.datos.map(f => f[0]));
llenar("#r-prof", PROFESORES);
llenar("#r-mat", [...new Set(CATALOGOS.materias.datos.map(f => f[0]))]);

// el titulo del reporte dice que grupo, profesor y materia se esta viendo
function reporte() {
  buscar("#r-titulo").textContent = `${buscar("#r-grupo").value} · ${buscar("#r-prof").value} · ${buscar("#r-mat").value}`;
}
["#r-grupo", "#r-prof", "#r-mat"].forEach(s => buscar(s).addEventListener("change", reporte));
reporte();

// la grafica, los encabezados y la tabla del reporte una fila por alumno con su promedio
buscar("#r-barras").innerHTML = buscar("#barras").innerHTML;
buscar("#r-head").innerHTML = "<tr><th>Alum</th>" + PREG.map((_, i) => `<th>P${i + 1}</th>`).join("") + "<th>Promedio</th><th>Comentarios</th></tr>";
buscar("#r-tabla").innerHTML = REPORTE_EJ.map((f, i) => {
  const prom = (f.slice(0, 12).reduce((a, b) => a + b) / 12).toFixed(1);
  return `<tr><td>${i + 1}</td>${f.slice(0, 12).map(n => `<td>${n}</td>`).join("")}<td><b>${prom}</b></td><td>${f[12]}</td></tr>`;
}).join("");

// menú de la izquierda (sirve para administrador y para docente) cada boton abre su vista y esconde las demas
// y si el boton trae data-c tambien llena ese catalogo
buscarTodos(".lat").forEach(nav => nav.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  buscarTodos("button", nav).forEach(x => x.classList.toggle("act", x === b));
  buscarTodos(`[id^="${nav.dataset.p}"]`, nav.parentElement).forEach(v => v.hidden = v.id !== nav.dataset.p + b.dataset.v);
  if (b.dataset.c) abrirCatalogo(b.dataset.c);
}));

// ----- ventanita (modal) para avisos y confirmaciones -----
// tipo: "ok" (palomita), "error" (tache) o "pregunta" (?). conCancelar muestra el boton Cancelar
// si se manda campo (aunque sea "") sale un cuadro de texto y regresa lo que se escribio
// regresa una promesa: true o false (o el texto) segun lo que se apriete
function modal(tipo, titulo, texto, conCancelar, campo) {
  return new Promise(res => {
    const m = buscar("#modal"), t = buscar("#modal-campo");
    m.dataset.tipo = tipo;
    buscar("#modal-icono").textContent = { ok: "✔", error: "✖", pregunta: "?" }[tipo];
    buscar("#modal-titulo").textContent = titulo;
    buscar("#modal-texto").textContent = texto;
    t.hidden = campo === undefined; t.value = campo || "";
    buscar("#modal-no").hidden = !conCancelar;
    m.hidden = false;
    const cerrar = v => { m.hidden = true; res(v); };
    buscar("#modal-si").onclick = () => cerrar(campo === undefined ? true : t.value.trim() || false);
    buscar("#modal-no").onclick = () => cerrar(false);
  });
}

// el catalogo ahora se llama Asignaturas y cuando se guarda sale el aviso de que quedo bien
CATALOGOS.materias.titulo = "Asignaturas";
const guardarCat = forms.catalogo;
forms.catalogo = (f, d) => { guardarCat(f, d); modal("ok", "Listo", "Se guardó correctamente."); };

// ----- menu nuevo (administrador y docente) -----
// cada rol tiene sus opciones: [id, nombre, icono]
const MENUS = {
  admin: [["inicio", "Inicio", "🏠"], ["grupos", "Grupos", "👥"], ["docentes", "Docentes", "🎓"], ["materias", "Asignaturas", "📚"], ["preguntas", "Preguntas", "❓"], ["reportes", "Reportes", "📊"]],
  docente: [["inicio", "Inicio", "🏠"], ["resultados", "Mis resultados", "📈"], ["comentarios", "Comentarios", "💬"]]
};
// las de abajo son iguales para todos
const FIJO = [["cuenta", "Cuenta", "👤"], ["config", "Configuración", "⚙️"], ["salir", "Cerrar sesión", "🚪"]];
// estas opciones usan la misma vista (la del catalogo)
const VISTA = { grupos: "catalogo", docentes: "catalogo", materias: "catalogo" };
const ROLES = { admin: "Administrador", docente: "Docente" };

// armo el menu de cada rol: las tres rayitas, el cristal (pill), las opciones y las de abajo
const boton = ([id, nombre, icono]) => `<button class="it" data-id="${id}"><i>${icono}</i><span>${nombre}</span></button>`;
buscarTodos(".menu").forEach(nav => {
  nav.innerHTML = '<button class="hamb" data-hamb aria-label="Mostrar u ocultar el menú">☰</button><span class="pill"></span>' +
    `<div>${MENUS[nav.dataset.rol].map(boton).join("")}</div><div class="fijo">${FIJO.map(boton).join("")}</div>`;
  if (innerWidth < 700) nav.classList.add("cerrado"); // en el celular empieza cerrado
});

// las vistas de Cuenta y Configuracion son iguales para los dos roles, asi que se agregan aqui
buscarTodos(".panel .cont").forEach(c => c.insertAdjacentHTML("beforeend", `
  <div data-vista="cuenta" hidden>
    <h2>Cuenta</h2>
    <p class="sub" data-info></p>
    <form class="form-cat" data-f="cuenta">
      <label>Correo<input type="email" name="correo" required></label>
      <label>Nueva contraseña<span class="pw"><input type="password" name="clave" minlength="6"><button type="button" class="ojo" aria-label="Mostrar u ocultar contraseña">👁</button></span></label>
      <label>Confirmar contraseña<span class="pw"><input type="password" name="clave2" minlength="6"><button type="button" class="ojo" aria-label="Mostrar u ocultar contraseña">👁</button></span></label>
      <div class="acciones"><button class="btn">Guardar cambios</button></div>
    </form>
  </div>
  <div data-vista="config" hidden>
    <h2>Configuración</h2>
    <h3>Tema</h3>
    <div class="acciones"><button class="mini" data-t="claro">Azul claro</button><button class="mini" data-t="oscuro">Azul oscuro</button><button class="mini" data-t="negro">Negro</button></div>
    <h3>Notificaciones</h3>
    <label class="chk"><input type="checkbox" data-notif="correo"> Recibir avisos por correo</label>
    <label class="chk"><input type="checkbox" data-notif="pantalla"> Mostrar avisos en pantalla</label>
  </div>`));

// las notificaciones se guardan en el navegador
const config = JSON.parse(localStorage.getItem("config") || "{}");
buscarTodos("[data-notif]").forEach(c => {
  c.checked = config[c.dataset.notif] ?? true;
  c.addEventListener("change", () => { config[c.dataset.notif] = c.checked; localStorage.setItem("config", JSON.stringify(config)); });
});

// elegir: abre una vista del menu, marca la opcion y mueve el cristal (pill) hasta ella
function elegir(nav, id) {
  if (id === "salir") return modal("pregunta", "¿Cerrar sesión?", "Tendrás que iniciar sesión otra vez.", true).then(ok => { if (ok) { sesion = null; ir("login"); } });
  const cont = nav.nextElementSibling, vista = VISTA[id] || id;
  buscarTodos(":scope > [data-vista]", cont).forEach(v => v.hidden = v.dataset.vista !== vista);
  buscarTodos(".it", nav).forEach(b => b.classList.toggle("act", b.dataset.id === id));
  const a = buscar(".it.act", nav), p = buscar(".pill", nav);
  p.style.top = a.offsetTop + "px"; p.style.height = a.offsetHeight + "px";
  if (VISTA[id]) abrirCatalogo(id);
  if (id === "cuenta") llenarCuenta(cont);
}

// llenarCuenta: pone en el formulario el correo y el nombre de quien inicio sesion
function llenarCuenta(cont) {
  buscar("[name=correo]", cont).value = sesion?.correo || "";
  buscar("[data-info]", cont).textContent = `${sesion?.nombre || ""} · ${ROLES[PANEL[sesion?.rol]] || ""}`;
}

// los clics del menu: elegir opcion, las tres rayitas, el iconito de cuenta de arriba y los atajos de Inicio
document.addEventListener("click", e => {
  const it = e.target.closest(".menu .it"), h = e.target.closest("[data-hamb]"), at = e.target.closest("[data-ir-vista]");
  if (it) elegir(it.closest(".menu"), it.dataset.id);
  if (h) h.closest(".menu").classList.toggle("cerrado");
  if (at) elegir(at.closest(".panel").querySelector(".menu"), at.dataset.irVista);
  if (e.target.closest("[data-cuenta]")) { const nav = buscar(`#${PANEL[sesion?.rol]} .menu`); if (nav) elegir(nav, "cuenta"); }
});

// entrarPanel: cada vez que se abre un panel pone el saludo con el rol, dibuja los atajos con su animacion y vuelve a Inicio
// tambien muestra el iconito de cuenta solo cuando se esta en un panel
function entrarPanel() {
  const id = location.hash.slice(1), av = buscar("#avatar"), panel = ["admin", "docente"].includes(id);
  if (av) av.hidden = !sesion || !panel;
  if (!sesion || !panel) return;
  const nav = buscar(`#${id} .menu`);
  if (!nav) return; // por si todavia no esta el index.html nuevo
  const cont = nav.nextElementSibling, s = buscar(".saludo", cont);
  s.innerHTML = '<h2></h2><span class="rol-chip"></span>';
  buscar("h2", s).textContent = "¡Hola, " + sesion.nombre + "!";
  buscar(".rol-chip", s).textContent = "Rol: " + ROLES[id];
  buscar(".atajos", cont).innerHTML = MENUS[id].slice(1).map(([vid, nombre, icono], i) =>
    `<button class="atajo" style="--d:${i}" data-ir-vista="${vid}"><i>${icono}</i><b>${nombre}</b></button>`).join("");
  elegir(nav, "inicio");
}
addEventListener("hashchange", entrarPanel);
entrarPanel();

// ----- preguntas en tarjetas -----
// preguntas es una copia de PREG para poder agregar, editar y eliminar (POR AHORITA SOLO SE VE EN PANTALLA)
const preguntas = PREG.slice();
function dibujarPreguntas() {
  if (!buscar("#preg-lista")) return; // por si todavia no esta el index.html nuevo
  buscar("#preg-lista").innerHTML = preguntas.map((t, i) =>
    `<article class="preg-card"><span class="num">${i + 1}</span><p></p><div class="preg-acc"><button class="mini" data-pedit="${i}">Editar</button><button class="mini rojo" data-pdel="${i}">Eliminar</button></div></article>`).join("");
  buscarTodos(".preg-card p").forEach((p, i) => p.textContent = preguntas[i]); // con textContent por seguridad
}
dibujarPreguntas();

// botones de las tarjetas: cada accion pregunta con Aceptar o Cancelar y despues avisa que quedo bien
document.addEventListener("click", async e => {
  const nueva = e.target.closest("#preg-nueva"), ed = e.target.closest("[data-pedit]"), del = e.target.closest("[data-pdel]");
  if (nueva) {
    const t = await modal("pregunta", "Nueva pregunta", "Escribe el texto de la pregunta.", true, "");
    if (t) { preguntas.push(t); dibujarPreguntas(); modal("ok", "Listo", "La pregunta se agregó."); }
  }
  if (ed) {
    const i = +ed.dataset.pedit, t = await modal("pregunta", "Editar pregunta", "Cambia el texto y acepta.", true, preguntas[i]);
    if (t) { preguntas[i] = t; dibujarPreguntas(); modal("ok", "Listo", "La pregunta se actualizó."); }
  }
  if (del && await modal("pregunta", "¿Eliminar esta pregunta?", "Esta acción no se puede deshacer.", true)) {
    preguntas.splice(+del.dataset.pdel, 1); dibujarPreguntas(); modal("ok", "Listo", "La pregunta se eliminó.");
  }
});

// ----- cuenta: cambiar correo y contraseña (primero pregunta si quiere guardar) -----
forms.cuenta = (f, d) => {
  if (d.clave && d.clave !== d.clave2) return modal("error", "No se pudo guardar", "Las contraseñas no coinciden.");
  modal("pregunta", "¿Guardar cambios?", "Se va a actualizar tu cuenta.", true).then(ok => {
    if (!ok) return;
    const us = leer("usuarios"), u = us.find(x => x.correo === sesion?.correo);
    if (!u) return modal("error", "No se pudo guardar", "No encontré tu cuenta.");
    u.correo = d.correo; if (d.clave) u.clave = d.clave;
    guardar("usuarios", us); sesion = u;
    f.clave.value = f.clave2.value = "";
    modal("ok", "Listo", "Tus cambios se guardaron.");
  });
};

}


// al final muestro la pantalla que toque cuando se abre la pagina
mostrar();



// ---------- PANTALLA DE GRACIAS (con confeti) Y HASTA PRONTO ----------

// reloj guarda el temporizador que pasa del gracias a la pregunta de si quiere salir
let reloj;

// celebrar: se llama cuando se envia la evaluacion. muestra el gracias, tira el confeti
// y a los 4 segundos pasa solo a la pregunta de si quiere salir
function celebrar() {
  buscar("#gracias-a").hidden = false;
  buscar("#gracias-b").hidden = true;
  confeti();
  clearTimeout(reloj);
  reloj = setTimeout(preguntarSalir, 4000);
}

// preguntarSalir: quita el gracias y muestra "deseas salir del sitio?"
function preguntarSalir() {
  clearTimeout(reloj);
  buscar("#gracias-a").hidden = true;
  buscar("#gracias-b").hidden = false;
}

// los botones: "Continuar" se salta la espera y "Si, salir" cierra la sesion y va a la pantalla de hasta pronto
document.addEventListener("click", e => {
  if (e.target.closest("[data-sigue]")) preguntarSalir();
  if (e.target.closest("[data-salir]")) { sesion = null; ir("adios"); }
});

// confeti: dibuja papelitos de colores que caen en el canvas #confeti que ocupa toda la pantalla
function confeti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; // si la persona no quiere animaciones no se hace
  const lienzo = buscar("#confeti"), c = lienzo.getContext("2d");
  lienzo.width = innerWidth; lienzo.height = innerHeight;
  const colores = ["#1f6feb", "#f5a524", "#1f9d57", "#c9363f", "#8e44ad", "#ffd400"];
  // cada papelito tiene su posicion (x, y), su tamaño (w, h), su color, su velocidad (vx, vy) y cuanto gira
  const papeles = Array.from({ length: 160 }, () => ({
    x: Math.random() * lienzo.width, y: -Math.random() * lienzo.height * .6,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
    color: colores[Math.floor(Math.random() * colores.length)],
    vx: Math.random() * 2 - 1, vy: 2 + Math.random() * 3,
    giro: Math.random() * 6, vg: Math.random() * .4 - .2
  }));
  let cuadros = 0;
  (function pintar() {
    c.clearRect(0, 0, lienzo.width, lienzo.height);
    papeles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.giro += p.vg;   // lo muevo y lo giro un poquito
      c.save(); c.translate(p.x, p.y); c.rotate(p.giro);
      c.fillStyle = p.color; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      c.restore();
    });
    if (++cuadros < 240) requestAnimationFrame(pintar); // 240 cuadros son como 4 segundos
    else c.clearRect(0, 0, lienzo.width, lienzo.height);
  })();
}

