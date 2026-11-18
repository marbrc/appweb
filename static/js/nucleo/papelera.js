// /static/js/nucleo/papelera.js
// la ventanita de "Ver eliminados": aquí sale todo lo que se desactivó.
// NADA se borra de la base de datos, solo se desactiva (activo = 0 / Estatus = 0),
// así que desde aquí se puede volver a activar con el botón Restaurar.
import { api, avisar, esc, cargando } from "./utiles.js";
import { icono } from "./iconos.js";
import { refrescarDatos } from "./datos.js";

// cada tipo dice cómo se llama, qué columnas tiene y cómo se pinta cada fila
const TIPOS = {
  carreras: {
    titulo: "Carreras desactivadas",
    desc: "Ya no salen en el sistema. Al restaurar una, vuelven sus grupos y sus asignaciones.",
    columnas: ["Carrera"],
    fila: c => `<td><b>${esc(c.nombre)}</b></td>`,
    vacio: "No hay carreras desactivadas."
  },
  grupos: {
    titulo: "Grupos desactivados",
    desc: "Al restaurar un grupo también vuelven sus asignaciones de Carga Académica.",
    columnas: ["Clave", "Carrera", "Cuatrimestre", "Alumnos"],
    fila: g => `<td><span class="chip clave">${esc(g.clave)}</span></td>
                <td>${esc(g.carrera)}</td>
                <td><span class="chip">${esc(g.cuatrimestre)}°</span></td>
                <td>${esc(g.alumnos)}</td>`,
    vacio: "No hay grupos desactivados."
  },
  docentes: {
    titulo: "Docentes desactivados",
    desc: "Al restaurar un docente también vuelven sus asignaciones de Carga Académica.",
    columnas: ["Nombre", "Correo"],
    fila: d => `<td><b>${esc(d.nombre)}</b></td>
                <td>${d.correo ? esc(d.correo) : '<span class="sub">Sin correo</span>'}</td>`,
    vacio: "No hay docentes desactivados."
  },
  asignaturas: {
    titulo: "Asignaturas desactivadas",
    desc: "Al restaurar una asignatura también vuelven sus asignaciones de Carga Académica.",
    columnas: ["Asignatura"],
    fila: a => `<td><b>${esc(a.nombre)}</b></td>`,
    vacio: "No hay asignaturas desactivadas."
  },
  clases: {
    titulo: "Asignaciones desactivadas",
    desc: "Son las de Carga Académica. Al restaurar una, su grupo y su carrera vuelven a aparecer.",
    columnas: ["Grupo", "Materia", "Docente"],
    fila: c => `<td><span class="chip clave">${esc(c.grupo)}</span></td>
                <td>${esc(c.materia)}</td>
                <td>${esc(c.docente)}</td>`,
    vacio: "No hay asignaciones desactivadas."
  },
  preguntas: {
    titulo: "Preguntas desactivadas",
    desc: "Dejaron de salirles a los alumnos. Al restaurarlas vuelven al final de la encuesta.",
    columnas: ["#", "Pregunta"],
    fila: p => `<td class="sub">${esc(p.num)}</td>
                <td>${esc(p.texto)}</td>`,
    vacio: "No hay preguntas desactivadas."
  }
};

// abrirPapelera(tipo, alRestaurar)
// tipo: "carreras", "grupos", "docentes", "asignaturas", "clases" o "preguntas"
// alRestaurar: función opcional que se llama después de restaurar (para que la tabla de atrás se redibuje)
export async function abrirPapelera(tipo, alRestaurar) {
  const def = TIPOS[tipo];
  if (!def) {
    console.error("Papelera: tipo desconocido", tipo);
    return;
  }

  const d = document.createElement("dialog");
  d.className = "modal modal-ancho";
  d.innerHTML = `
    <div class="modal-cabeza">
      <span class="modal-ico rojo">${icono("basura")}</span>
      <div>
        <h3>${esc(def.titulo)}</h3>
        <p>${esc(def.desc)}</p>
      </div>
    </div>
    <div class="modal-tabla">
      <table class="tabla">
        <thead>
          <tr>${def.columnas.map(c => `<th>${esc(c)}</th>`).join("")}<th>Acciones</th></tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="modal-botones">
      <button class="btn sec" type="button" data-cerrar>Cerrar</button>
    </div>`;

  const cuerpo = d.querySelector("tbody");
  const pintar = lista => {
    cuerpo.innerHTML = lista.length
      ? lista.map(item => `
          <tr>
            ${def.fila(item)}
            <td class="acciones-fila">
              <button class="mini" type="button" data-restaurar="${esc(item.id)}">Restaurar</button>
            </td>
          </tr>`).join("")
      : `<tr><td colspan="${def.columnas.length + 1}" class="vacio">${esc(def.vacio)}</td></tr>`;
  };

  cuerpo.onclick = async e => {
    const b = e.target.closest("[data-restaurar]");
    if (!b) return;
    cargando(b, true);
    try {
      const r = await api(`/api/eliminados/${tipo}/${b.dataset.restaurar}`, { metodo: "POST" });
      pintar((r.eliminados && r.eliminados[tipo]) || []);
      avisar("Restaurado. Ya vuelve a aparecer en el sistema.");
      await refrescarDatos();
      if (typeof alRestaurar === "function") alRestaurar();
    } catch (err) {
      avisar(err.message, "err");
      cargando(b, false);
    }
  };

  const cerrar = () => { d.close(); d.remove(); };
  d.querySelector("[data-cerrar]").onclick = cerrar;
  d.addEventListener("cancel", cerrar);
  d.addEventListener("click", e => { if (e.target === d) cerrar(); });

  document.body.appendChild(d);
  d.showModal();

  try {
    const datos = await api("/api/eliminados");
    pintar(datos[tipo] || []);
  } catch (err) {
    cuerpo.innerHTML = `<tr><td colspan="${def.columnas.length + 1}" class="vacio">${esc(err.message)}</td></tr>`;
  }
}
