// /static/pantallas/admin/docentes.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { 
  getDocentes, setDocentes, getClases, setClases, getAsignaturas, getGrupos
} from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

const correoPermitido = /^[A-Z0-9._%+-]+@(gmail\.com|utng\.edu\.mx|outlook\.com)$/i;

export function iniciar(contenedor) {
    cont = contenedor;
    pintarIconos(cont);

    const btnNuevo = buscar("#d-nuevo", cont);
    const form = buscar("#d-form", cont);
    const btnCancelar = buscar("#d-cancelar", cont);
    const tabla = buscar("#d-tabla", cont);
    const selMateria = buscar("#d-sel-materia", cont);

    if (!btnNuevo || !form || !btnCancelar || !tabla) return;

    const campoNombres = form.elements.namedItem("nombres");
    const campoPaterno = form.elements.namedItem("paterno");
    const campoMaterno = form.elements.namedItem("materno");
    const campoCorreo = form.elements.namedItem("correo");

    // --- LLENAR COMBO CON LAS ASIGNATURAS ---
    function llenarComboMaterias(materiasSeleccionadas = []) {
        const asignaturas = getAsignaturas() || [];
        
        selMateria.innerHTML = '<option value="">Selecciona una asignatura...</option>';

        if (asignaturas.length === 0) {
            selMateria.innerHTML = '<option value="">No hay asignaturas registradas</option>';
            return;
        }

        asignaturas.forEach(a => {
            const option = document.createElement("option");
            option.value = a.nombre;
            option.textContent = a.nombre;
            selMateria.appendChild(option);
        });
        
        // Nota: Como es un combo normal, solo mostrará la primera que tenga asignada
        if (materiasSeleccionadas.length > 0) {
            selMateria.value = materiasSeleccionadas[0];
        }
    }

    // Validar correo
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

    // --- GUARDAR ---
    form.onsubmit = evento => {
        evento.preventDefault();
        
        const d = Object.fromEntries(new FormData(form));
        
        const nombres = (d.nombres || "").trim().replace(/\s+/g, " ");
        const paterno = (d.paterno || "").trim().replace(/\s+/g, " ");
        const materno = (d.materno || "").trim().replace(/\s+/g, " ");
        const correo = (d.correo || "").trim().toLowerCase();
        const materiaSeleccionada = d.materia_asignada;

        if (!nombres || !paterno || !correo) return alert("Completa los nombres, el apellido paterno y el correo.");
        if (!correoPermitido.test(correo)) return alert("Correo no permitido.");

        const nombreCompleto = `${nombres} ${paterno}${materno ? " " + materno : ""}`;
        const lista = getDocentes();

        const correoDuplicado = lista.some((doc, i) => i !== editando && doc.correo === correo);
        if (correoDuplicado) return alert("Ya existe un docente con este correo.");

        const item = { nombre: nombreCompleto, nombres, paterno, materno, correo };

        if (editando >= 0) lista[editando] = item;
        else lista.push(item);
        setDocentes(lista);

        // --- ACTUALIZAR CARGA ACADÉMICA ---
        // Aquí está el truco: NO borramos las anteriores, solo agregamos la nueva
        let clasesActuales = getClases() || [];
        
        if (materiaSeleccionada) {
            const grupos = getGrupos() || [];
            
            grupos.forEach(g => {
                // Verificamos si el docente ya tiene esa materia en ese grupo para no duplicar
                const yaExiste = clasesActuales.some(c => 
                    c.docenteId === correo && 
                    c.asignaturaId === materiaSeleccionada && 
                    c.grupoId === g.clave
                );

                if (!yaExiste) {
                    clasesActuales.push({
                        grupoId: g.clave,
                        asignaturaId: materiaSeleccionada,
                        docenteId: correo,
                        id: Date.now() + Math.random()
                    });
                }
            });
        }

        setClases(clasesActuales);

        form.reset();
        campoCorreo.setCustomValidity("");
        form.hidden = true;
        editando = -1;
        dibujar();
    };

    // --- ACCIONES (EDITAR / ELIMINAR) ---
    tabla.onclick = evento => {
        const botonEditar = evento.target.closest("[data-ed]");
        const botonEliminar = evento.target.closest("[data-del]");

        if (botonEditar) abrirForm(Number(botonEditar.dataset.ed));

        if (botonEliminar) {
            const indice = Number(botonEliminar.dataset.del);
            const docente = getDocentes()[indice];
            const clases = getClases() || [];

            const clasesAsignadas = clases.filter(c => c.docenteId === docente.correo || c.docenteId === docente.nombre);
            if (clasesAsignadas.length > 0) {
                alert(`No puedes eliminar a "${docente.nombre}" porque tiene materias asignadas.`);
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

            const clases = getClases() || [];
            const susClases = clases.filter(c => c.docenteId === doc.correo);
            const materiasUnicas = [...new Set(susClases.map(c => c.asignaturaId))];
            
            llenarComboMaterias(materiasUnicas);
        } else {
            form.reset();
            llenarComboMaterias();
        }
        campoNombres.focus();
    }

    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    }

    function dibujar() {
        const lista = getDocentes() || [];
        const clases = getClases() || [];
        
        const total = buscar("#d-total", cont);
        if (total) total.textContent = lista.length + (lista.length === 1 ? " registrado" : " registrados");

        tabla.innerHTML = lista.length
            ? lista.map((doc, indice) => {
                const susClases = clases.filter(c => c.docenteId === doc.correo || c.docenteId === doc.nombre);
                const materiasUnicas = [...new Set(susClases.map(c => c.asignaturaId))];
                
                let materiasHTML = materiasUnicas.length === 0 
                    ? `<span style="color:var(--mut); font-size:0.85rem;">Sin asignar</span>`
                    : `<div style="display:flex; flex-wrap: wrap; gap:4px;">` + 
                      materiasUnicas.slice(0, 3).map(m => `<span class="chip" style="font-size:0.75rem;">${escaparHTML(m)}</span>`).join(" ") + 
                      (materiasUnicas.length > 3 ? `<span style="font-size:0.75rem; color:var(--mut);"> +${materiasUnicas.length - 3} más</span>` : "") + 
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