// /static/pantallas/admin/docentes.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import {
  getDocentes, setDocentes, getClases, setClases, getAsignaturas
} from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

const correoPermitido = /^[A-Z0-9._%+-]+@(gmail\.com|utng\.edu\.mx|outlook\.com)$/i;
const mayus = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*$/;

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
        const asignaturas = getAsignaturas() || [];
        caja.innerHTML = asignaturas.length
            ? asignaturas.map(a => `<label><input type="checkbox" name="materias" value="${escaparHTML(a.nombre)}" ${seleccion.includes(a.nombre) ? "checked" : ""}>${escaparHTML(a.nombre)}</label>`).join("")
            : `<span style="color:var(--mut)">No hay asignaturas registradas</span>`;
    }

    campoCorreo.addEventListener("input", () => {
        campoCorreo.setCustomValidity("");
        const correo = campoCorreo.value.trim();
        if (!correo) campoCorreo.setCustomValidity("El correo es obligatorio.");
        else if (!correoPermitido.test(correo)) campoCorreo.setCustomValidity("Solo correos Gmail, UTNG u Outlook.");
    });

    btnNuevo.onclick = () => abrirForm(-1);

    btnCancelar.onclick = () => {
        form.reset();
        form.hidden = true;
        campoCorreo.setCustomValidity("");
        editando = -1;
    };

    // --- GUARDAR (nuevo o edición) ---
    form.onsubmit = evento => {
        evento.preventDefault();

        const d = Object.fromEntries(new FormData(form));
        const nombres = (d.nombres || "").trim().replace(/\s+/g, " ");
        const paterno = (d.paterno || "").trim().replace(/\s+/g, " ");
        const materno = (d.materno || "").trim().replace(/\s+/g, " ");
        const correo = (d.correo || "").trim().toLowerCase();
        const materiasSel = [...form.querySelectorAll('input[name="materias"]:checked')].map(x => x.value);

        if (!nombres || !paterno || !correo) return alert("Completa los nombres, el apellido paterno y el correo.");
        if (!mayus.test(nombres) || !mayus.test(paterno) || (materno && !mayus.test(materno)))
            return alert("Nombre y apellidos deben empezar con mayúscula (ej. Juan Pérez).");
        if (!correoPermitido.test(correo)) return alert("Correo no permitido.");

        const lista = getDocentes() || [];
        if (lista.some((doc, i) => i !== editando && doc.correo === correo))
            return alert("Ya existe un docente con este correo.");

        const nombreCompleto = `${nombres} ${paterno}${materno ? " " + materno : ""}`;
        const item = { nombre: nombreCompleto, nombres, paterno, materno, correo, materias: materiasSel };

        const viejo = editando >= 0 ? lista[editando] : null;
        const correoViejo = viejo ? viejo.correo : correo;
        const nombreViejo = viejo ? viejo.nombre : nombreCompleto;

        if (editando >= 0) lista[editando] = item;
        else lista.push(item);
        setDocentes(lista);

        // solo actualiza el correo en las asignaciones que ya tenía (Carga Académica)
        const clases = (getClases() || []).map(c =>
            (c.docenteId === correoViejo || c.docenteId === nombreViejo) ? { ...c, docenteId: correo } : c);
        setClases(clases);

        form.reset();
        campoCorreo.setCustomValidity("");
        form.hidden = true;
        editando = -1;
        dibujar();
    };

    // --- EDITAR / ELIMINAR ---
    tabla.onclick = evento => {
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
                alert(`No puedes eliminar a "${docente.nombre}" porque tiene grupos asignados en Carga Académica. Elimina esas asignaciones primero.`);
                return;
            }

            if (!confirm("¿Eliminar este docente?")) return;
            lista.splice(indice, 1);
            setDocentes(lista);
            dibujar();
        }
    };

    function abrirForm(indice) {
        editando = indice;
        form.hidden = false;
        campoCorreo.setCustomValidity("");

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
                    ? `<span style="color:var(--mut);font-size:.85rem;">Sin asignar</span>`
                    : `<div style="display:flex;flex-wrap:wrap;gap:4px;">` +
                      materias.slice(0, 3).map(m => `<span class="chip" style="font-size:.75rem;">${escaparHTML(m)}</span>`).join(" ") +
                      (materias.length > 3 ? `<span style="font-size:.75rem;color:var(--mut);"> +${materias.length - 3} más</span>` : "") +
                      `</div>`;

                return `
                <tr>
                    <td><div class="persona"><span class="avatar-mini">${escaparHTML((doc.nombre || "?").trim().charAt(0).toUpperCase())}</span>${escaparHTML(doc.nombre)}</div></td>
                    <td>${escaparHTML(doc.correo)}</td>
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