
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

// entrar: guarda la sesión del usuario y lo manda a su pantalla segun su rol
const entrar = u => { sesion = u; ir(PANEL[u.rol]); };

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
    f.reset(); iniciar(); cuenta(); buscar("#gracias").hidden = false;
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
  Array.from({ length: 10 }, (_, k) => `<label><input type="radio" name="p${i + 1}" value="${k + 1}" required><span>${k + 1}</span></label>`).join("")
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
const OPC = {
  carrera: () => Object.keys(CAT),
  cuatri: () => Array.from({ length: 11 }, (_, i) => `${i + 1}° cuatrimestre`),
  grupo: () => ["A", "B", "BIS"].map(g => parseInt(sel("cuatri").value) + g),
  prof: () => CAT[sel("carrera").value].prof,
  mat: () => CAT[sel("carrera").value].mat
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
  if (ok) buscar("#clase").textContent = `✔ Evaluando a ${sel("prof").value}, ${sel("mat").value} (grupo ${sel("grupo").value})`;
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

// menú de la izquierda: marco el botón que toque Solo "Inicio" está hecho
// en los demás sale un aviso de que lo integra el equipo
buscarTodos(".lat button").forEach(b => b.addEventListener("click", () => {
  const inicio = b.textContent === "Inicio";
  buscarTodos(".lat button").forEach(x => x.classList.toggle("act", x === b));
  buscar("#resumen").hidden = !inicio;
  buscar("#pend").hidden = inicio;
  buscar("#pend b").textContent = b.textContent;
}));


// al final muestro la pantalla que toque cuando se abre la pagina
mostrar();