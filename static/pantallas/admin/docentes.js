// /static/pantallas/admin/docentes.js
import { buscar, avisar, confirmar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  getDocentes, setDocentes, getClases, setClases, getAsignaturas
} from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

const correoPermitido = /^[A-Z0-9._%+-]+@(gmail\.com|utng\.edu\.mx|outlook\.com)$/i;
// cada palabra con mayuscula, y se vale la inicial con punto (J. Refugio)
const mayus = /^[A-ZÁÉÍÓÚÑ][a-záéíóúüñ]*\.?(\s[A-ZÁÉÍÓÚÑ][a-záéíóúüñ]*\.?)*$/;

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// materias del docente: si ya tiene lista propia se usa; si es un docente viejo, se sacan de sus clases
const materiasDe = (doc, clases) => doc.materias ?? [...new Set(
    clases.filter(c => c.docenteId === doc.correo || c.docenteId === doc.nombre).map(c => c.asignaturaId))];

export function iniciar(contenedor) {
    cont = contenedor;
    pintarIconos(cont);

    const btnNuevo = buscar("#d-nuevo", cont);
    const form = buscar("#d-form", cont);
    const btnCancelar = buscar("#d-cancelar", cont);
    const tabla = buscar("#d-tabla", cont);

    if (!btnNuevo || !form || !btnCancelar || !tabla) {
        console.error("Faltan elementos en el HTML de docentes");
        return;
    }

    const campoNombres = form.elements.namedItem("nombres");
    const campoPaterno = form.elements.namedItem("paterno");
    const campoMaterno = form.elements.namedItem("materno");
    const campoCorreo = form.elements.namedItem("correo");

   function llenarMaterias(seleccion = []) {
    const caja = buscar("#d-materias", cont);
    const datos = getAsignaturas() || [];

    // Extraer el nombre correctamente si viene como string u objeto ({nombre} o {NomAsignatura})
    const nombresUnicos = [...new Set(
        datos.map(a => typeof a === "string" ? a : (a.nombre || a.NomAsignatura)).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

    caja.innerHTML = nombresUnicos.length
        ? nombresUnicos.map(n => `<label><input type="checkbox" name="materias" value="${escaparHTML(n)}" ${seleccion.includes(n) ? "checked" : ""}>${escaparHTML(n)}</label>`).join("")
        : `<span style="color:var(--mut)">No hay asignaturas registradas</span>`;
}

    campoCorreo.addEventListener("input", () => {
        campoCorreo.setCustomValidity("");
        const correo = campoCorreo.value.trim();
        if (correo && !correoPermitido.test(correo)) campoCorreo.setCustomValidity("Solo correos Gmail, UTNG u Outlook.");
    });

    btnNuevo.onclick = () => abrirForm(-1);

    btnCancelar.onclick = () => {
        form.reset();
        form.hidden = true;
        campoCorreo.setCustomValidity("");
        editando = -1;
    };

    // --- GUARDAR (nuevo o edición) ---
    form.onsubmit = async evento => {
        evento.preventDefault();

        const d = Object.fromEntries(new FormData(form));
        const nombres = (d.nombres || "").trim().replace(/\s+/g, " ");
        const paterno = (d.paterno || "").trim().replace(/\s+/g, " ");
        const materno = (d.materno || "").trim().replace(/\s+/g, " ");
        const correo = (d.correo || "").trim().toLowerCase();
        const materiasSel = [...form.querySelectorAll('input[name="materias"]:checked')].map(x => x.value);

        // el correo ya es opcional porque todavia no tenemos el de todos los maestros
        if (!nombres || !paterno) return avisar("Completa el nombre y el apellido paterno.", "err");
        if (!mayus.test(nombres) || !mayus.test(paterno) || (materno && !mayus.test(materno)))
            return avisar("Nombre y apellidos deben empezar con mayúscula (ej. Juan Pérez).", "err");
        if (correo && !correoPermitido.test(correo)) return avisar("Solo se permiten correos Gmail, UTNG u Outlook.", "err");

        const lista = getDocentes() || [];
        if (correo && lista.some((doc, i) => i !== editando && doc.correo === correo))
            return avisar("Ya existe un docente con este correo.", "err");

        const nombreCompleto = `${nombres} ${paterno}${materno ? " " + materno : ""}`;
        const item = { nombre: nombreCompleto, nombres, paterno, materno, correo, materias: materiasSel };

        const viejo = editando >= 0 ? lista[editando] : null;
        const correoViejo = viejo ? viejo.correo : correo;
        const nombreViejo = viejo ? viejo.nombre : nombreCompleto;

        const eraEdicion = editando >= 0;
if (eraEdicion) lista[editando] = item;
else lista.push(item);
form.reset();
campoCorreo.setCustomValidity("");
form.hidden = true;
editando = -1;

await setDocentes(lista);   // guarda y actualiza la copia local
dibujar();                  // ahora sí pinta

const nuevoId = correo || nombreCompleto;
if (eraEdicion && (correoViejo !== correo || nombreViejo !== nombreCompleto)) {
    const clases = (getClases() || []).map(c =>
        (c.docenteId === correoViejo || c.docenteId === nombreViejo) ? { ...c, docenteId: nuevoId } : c);
    await setClases(clases);
    dibujar();
}
avisar(eraEdicion ? "Docente actualizado." : "Docente registrado.");
    };

    // --- EDITAR / ELIMINAR ---
    tabla.onclick = async evento => {
        const botonEditar = evento.target.closest("[data-ed]");
        const botonEliminar = evento.target.closest("[data-del]");

        if (botonEditar) abrirForm(Number(botonEditar.dataset.ed));

        if (botonEliminar) {
            const indice = Number(botonEliminar.dataset.del);
            const lista = getDocentes() || [];
            const docente = lista[indice];
            const clases = getClases() || [];

            const asignadas = clases.filter(c => c.docenteId === docente.correo || c.docenteId === docente.nombre);
            if (asignadas.length > 0) {
                return avisar(`No puedes eliminar a "${docente.nombre}" porque tiene grupos asignados en Carga Académica. Elimina esas asignaciones primero.`, "err");
            }

            if (!await confirmar("Esta acción no se puede deshacer.", { titulo: `¿Eliminar a ${docente.nombre}?`, si: "Eliminar", peligro: true })) return;
            lista.splice(indice, 1);
            setDocentes(lista);
            dibujar();
        }
    };

    function abrirForm(indice) {
        editando = indice;
        form.hidden = false;
        campoCorreo.setCustomValidity("");
        buscar("#d-titulo", cont).textContent = indice >= 0 ? "Editar docente" : "Nuevo docente";

        if (indice >= 0) {
            const doc = getDocentes()[indice];
            campoNombres.value = doc.nombres || doc.nombre.split(" ")[0];
            campoPaterno.value = doc.paterno || "";
            campoMaterno.value = doc.materno || "";
            campoCorreo.value = doc.correo || "";
            llenarMaterias(materiasDe(doc, getClases() || []));
        } else {
            form.reset();
            llenarMaterias();
        }
        campoNombres.focus();
    }

    function dibujar() {
        const lista = getDocentes() || [];
        const clases = getClases() || [];

        const total = buscar("#d-total", cont);
        if (total) total.textContent = lista.length + (lista.length === 1 ? " registrado" : " registrados");

        tabla.innerHTML = lista.length
            ? lista.map((doc, indice) => {
                const materias = materiasDe(doc, clases);

                const materiasHTML = materias.length === 0
                    ? `<span class="sub">Sin asignar</span>`
                    : `<div style="display:flex;flex-wrap:wrap;gap:4px;">` +
                      materias.slice(0, 3).map(m => `<span class="chip">${escaparHTML(m)}</span>`).join(" ") +
                      (materias.length > 3 ? `<span class="sub"> +${materias.length - 3} más</span>` : "") +
                      `</div>`;

                return `
                <tr>
                    <td><div class="persona"><span class="avatar-mini">${escaparHTML((doc.nombre || "?").trim().charAt(0).toUpperCase())}</span>${escaparHTML(doc.nombre)}</div></td>
                    <td>${doc.correo ? escaparHTML(doc.correo) : '<span class="sub">Sin correo</span>'}</td>
                    <td>${materiasHTML}</td>
                    <td class="acciones-fila">
                        <button class="mini" type="button" data-ed="${indice}">Editar</button>
                        <button class="mini rojo" type="button" data-del="${indice}">Eliminar</button>
                    </td>
                </tr>`;
            }).join("")
            : `<tr><td colspan="4" class="vacio">Todavía no hay docentes. Toca "+ Nuevo docente".</td></tr>`;
    }

    dibujar();
}