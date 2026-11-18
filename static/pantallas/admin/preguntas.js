// /static/pantallas/admin/preguntas.js
// las preguntas viven en la tabla Pregunta y se manejan con /api/preguntas.
// NUNCA se borran: al eliminar se desactivan (Activa = 0) y dejan de salirle al alumno,
// pero se pueden recuperar desde "Ver eliminados".
import { buscar, api, avisar, confirmar, cargando, esc } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { refrescarDatos } from "/static/js/nucleo/datos.js";
import { abrirPapelera } from "/static/js/nucleo/papelera.js";
import { filtrar, conectar, cuenta } from "/static/js/nucleo/filtro.js";

let cont = null;
let preguntas = [];
let editando = null;   // id de la pregunta que se está editando (null = nueva)

export async function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  const btnNuevo = buscar("#p-nuevo", cont);
  const form = buscar("#p-form", cont);
  const btnCancelar = buscar("#p-cancelar", cont);
  const lista = buscar("#p-lista", cont);
  const texto = buscar("#p-texto", cont);
  const contador = buscar("#p-cont", cont);
  const titulo = buscar("#p-titulo", cont);

  if (!btnNuevo || !form || !btnCancelar || !lista || !texto) {
    console.error("Faltan elementos del HTML de preguntas");
    return;
  }

  const activas = () => preguntas.filter(p => p.activa);
  const actualizarContador = () => { contador.textContent = `${texto.value.length}/250`; };
  texto.addEventListener("input", actualizarContador);

  const cerrar = () => { form.reset(); form.hidden = true; editando = null; actualizarContador(); };

  btnNuevo.onclick = () => abrirForm(null);
  btnCancelar.onclick = cerrar;
  buscar("#p-papelera", cont).onclick = () => abrirPapelera("preguntas", cargar);

  // buscador: filtra por el texto de la pregunta
  const campoBuscar = buscar("#p-buscar", cont);
  conectar(campoBuscar, () => dibujar());

  // --- GUARDAR (nueva o edición) ---
  form.onsubmit = async e => {
    e.preventDefault();

    let t = texto.value.trim().replace(/\s+/g, " ");
    if (t.length < 10) return avisar("La pregunta debe tener al menos 10 caracteres.", "err");
    if (t.length > 250) return avisar("La pregunta no puede tener más de 250 caracteres.", "err");
    t = t.charAt(0).toUpperCase() + t.slice(1);

    const eraEdicion = editando !== null;
    const btn = buscar("#p-guardar", form);
    cargando(btn, true);
    try {
      if (eraEdicion) {
        await api(`/api/preguntas/${editando}`, { metodo: "PUT", datos: { texto: t } });
      } else {
        await api("/api/preguntas", { metodo: "POST", datos: { texto: t } });
      }
      cerrar();
      await cargar();
      refrescarDatos();
      avisar(eraEdicion ? "Pregunta actualizada." : "Pregunta agregada.");
    } catch (err) {
      avisar(err.message, "err");
    }
    cargando(btn, false);
  };

  // --- EDITAR / DESACTIVAR / MOVER ---
  lista.onclick = async e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");
    const mv = e.target.closest("[data-mv]");

    if (ed) {
      const p = activas().find(x => String(x.id) === ed.dataset.ed);
      if (p) abrirForm(p);
    }

    if (del) {
      const p = activas().find(x => String(x.id) === del.dataset.del);
      if (!p) return;
      if (!await confirmar('No se borra: la pregunta se desactiva y deja de salirle a los alumnos. ' +
        'La puedes recuperar en "Ver eliminados".',
        { titulo: `¿Desactivar la pregunta ${p.num}?`, si: "Desactivar", peligro: true })) return;

      cargando(del, true);
      try {
        const r = await api(`/api/preguntas/${p.id}`, { metodo: "DELETE" });
        preguntas = r.lista || [];
        if (editando === p.id) cerrar();
        dibujar();
        refrescarDatos();
        avisar("Pregunta desactivada. La puedes recuperar en Ver eliminados.");
      } catch (err) {
        avisar(err.message, "err");
        cargando(del, false);
      }
    }

    if (mv) {
      const listaActiva = activas();
      const i = +mv.dataset.i;
      const j = i + (+mv.dataset.mv);
      if (j < 0 || j >= listaActiva.length) return;

      const ids = listaActiva.map(p => p.id);
      [ids[i], ids[j]] = [ids[j], ids[i]];
      try {
        await api("/api/preguntas/orden", { metodo: "PUT", datos: ids });
        await cargar();
        refrescarDatos();
      } catch (err) {
        avisar(err.message, "err");
      }
    }
  };

  function abrirForm(p) {
    editando = p ? p.id : null;
    form.hidden = false;
    form.reset();
    texto.value = p ? p.texto : "";
    titulo.textContent = p ? `Editar pregunta ${p.num}` : "Nueva pregunta";
    actualizarContador();
    texto.focus();
  }

  function dibujar() {
    const activa = activas();
    const q = campoBuscar ? campoBuscar.value : "";
    const visibles = filtrar(activa, q, p => p.texto);
    const filtrando = !!q.trim();

    const total = buscar("#p-total", cont);
    if (total) total.textContent = cuenta(visibles.length, activa.length, "pregunta activa", "preguntas activas");

    // con búsqueda activa no se reordena (las flechas cambiarían de lugar a media lista)
    lista.innerHTML = visibles.length
      ? visibles.map(([p, i]) => `
          <li class="pregunta-item">
            <span class="num">${p.num}</span>
            <p>${esc(p.texto)}</p>
            <div class="acciones-fila">
              <button class="mini" type="button" data-mv="-1" data-i="${i}" title="${filtrando ? "Quita la búsqueda para reordenar" : "Subir"}" ${i === 0 || filtrando ? "disabled" : ""}>↑</button>
              <button class="mini" type="button" data-mv="1" data-i="${i}" title="${filtrando ? "Quita la búsqueda para reordenar" : "Bajar"}" ${i === activa.length - 1 || filtrando ? "disabled" : ""}>↓</button>
              <button class="mini" type="button" data-ed="${p.id}">Editar</button>
              <button class="mini rojo" type="button" data-del="${p.id}">Eliminar</button>
            </div>
          </li>`).join("")
      : filtrando
        ? `<li class="vacio">Nada coincide con "${esc(q.trim())}".</li>`
        : `<li class="vacio">Todavía no hay preguntas activas. Toca "+ Nueva pregunta" o revisa "Ver eliminados".</li>`;
  }

  async function cargar() {
    try {
      preguntas = await api("/api/preguntas?todas=1");
      dibujar();
    } catch (err) {
      avisar(err.message, "err");
    }
  }

  await cargar();
}
