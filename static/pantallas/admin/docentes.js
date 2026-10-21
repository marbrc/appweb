
 // /static/pantallas/admin/docentes.js

import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getDocentes, setDocentes } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;

// Dominios de correo permitidos.
const correoPermitido =
    /^[A-Z0-9._%+-]+@(gmail\.com|utng\.edu\.mx|outlook\.com)$/i;

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

    // Validar el correo mientras se escribe.
    campoCorreo.addEventListener("input", () => {
        campoCorreo.setCustomValidity("");

        const correo = campoCorreo.value.trim();

        if (!correo) {
            campoCorreo.setCustomValidity(
                "El correo es obligatorio."
            );
        } else if (!correoPermitido.test(correo)) {
            campoCorreo.setCustomValidity(
                "Solo se permiten correos de Gmail, UTNG u Outlook."
            );
        }
    });

    btnNuevo.onclick = () => abrirForm(-1);

    btnCancelar.onclick = () => {
        form.reset();
        form.hidden = true;
        campoCorreo.setCustomValidity("");
        editando = -1;
    };

    // Guardar o actualizar un docente.
    form.onsubmit = evento => {
        evento.preventDefault();

        const d = Object.fromEntries(new FormData(form));

        // Limpiar los espacios.
        const nombres = (d.nombres || "")
            .trim()
            .replace(/\s+/g, " ");

        const paterno = (d.paterno || "")
            .trim()
            .replace(/\s+/g, " ");

        const materno = (d.materno || "")
            .trim()
            .replace(/\s+/g, " ");

        const correo = (d.correo || "")
            .trim()
            .toLowerCase();

        // Validar que los campos obligatorios estén completos.
        if (!nombres || !paterno || !correo) {
            alert("Completa los nombres, el apellido paterno y el correo.");
            return;
        }

        // Validar el nombre: máximo 5 palabras.
        if (nombres.split(" ").length > 5) {
            alert(
                "Error: El campo de nombres no puede tener más de 5 palabras."
            );
            campoNombres.focus();
            return;
        }

        // Validar que los nombres y apellidos contengan solamente letras
        // y espacios. Se permiten acentos y la letra ñ.
        const patronNombre =
            /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+(?:\s+[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+)*$/;

        if (!patronNombre.test(nombres)) {
            alert("Escribe nombres válidos usando solamente letras.");
            campoNombres.focus();
            return;
        }

        if (!patronNombre.test(paterno)) {
            alert("Escribe un apellido paterno válido.");
            campoPaterno.focus();
            return;
        }

        if (materno && !patronNombre.test(materno)) {
            alert("Escribe un apellido materno válido.");
            campoMaterno.focus();
            return;
        }

        // VALIDACIÓN OBLIGATORIA DEL CORREO.
        // No se guarda nada si el dominio no está autorizado.
        if (!correo) {
            alert("El correo es obligatorio.");
            campoCorreo.focus();
            return;
        }

        if (!correoPermitido.test(correo)) {
            alert(
                "Correo no permitido.\n\n" +
                "Utiliza uno de estos dominios:\n" +
                "@gmail.com\n" +
                "@utng.edu.mx\n" +
                "@outlook.com"
            );

            campoCorreo.focus();
            return;
        }

        // Construir el nombre completo.
        const nombreCompleto =
            `${nombres} ${paterno}${materno ? " " + materno : ""}`;

        const lista = getDocentes();

        const item = {
            nombre: nombreCompleto,
            nombres: nombres,
            paterno: paterno,
            materno: materno,
            correo: correo
        };

        // Guardar los cambios o agregar un nuevo docente.
        if (editando >= 0) {
            lista[editando] = item;
        } else {
            lista.push(item);
        }

        setDocentes(lista);

        form.reset();
        campoCorreo.setCustomValidity("");
        form.hidden = true;
        editando = -1;

        dibujar();
    };

    // Acciones de editar y eliminar.
    tabla.onclick = evento => {
        const botonEditar = evento.target.closest("[data-ed]");
        const botonEliminar = evento.target.closest("[data-del]");

        if (botonEditar) {
            abrirForm(Number(botonEditar.dataset.ed));
        }

        if (botonEliminar) {
            if (!confirm("¿Eliminar este docente?")) {
                return;
            }

            const lista = getDocentes();
            lista.splice(Number(botonEliminar.dataset.del), 1);

            setDocentes(lista);
            dibujar();
        }
    };

    // Preparar el formulario para agregar o editar.
    function abrirForm(indice) {
        editando = indice;
        form.hidden = false;
        campoCorreo.setCustomValidity("");

        if (indice >= 0) {
            const doc = getDocentes()[indice];

            if (doc.nombres) {
                campoNombres.value = doc.nombres;
                campoPaterno.value = doc.paterno || "";
                campoMaterno.value = doc.materno || "";
            } else {
                const partes = (doc.nombre || "").split(" ");
                const total = partes.length;

                if (total >= 3) {
                    campoMaterno.value = partes.pop();
                    campoPaterno.value = partes.pop();
                } else if (total === 2) {
                    campoPaterno.value = partes.pop();
                    campoMaterno.value = "";
                } else {
                    campoPaterno.value = "";
                    campoMaterno.value = "";
                }

                campoNombres.value = partes.join(" ");
            }

            campoCorreo.value = doc.correo || "";
        } else {
            form.reset();
        }

        campoNombres.focus();
    }

    // Evitar insertar los datos de los docentes como HTML.
    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caracter]);
    }

    // Mostrar la tabla de docentes.
    function dibujar() {
        const lista = getDocentes();

        tabla.innerHTML = lista.length
            ? lista.map((doc, indice) => `
                <tr>
                    <td>${escaparHTML(doc.nombre)}</td>
                    <td>${escaparHTML(doc.correo)}</td>
                    <td class="acciones-fila">
                        <button
                            class="mini"
                            type="button"
                            data-ed="${indice}"
                        >Editar</button>

                        <button
                            class="mini rojo"
                            type="button"
                            data-del="${indice}"
                        >Eliminar</button>
                    </td>
                </tr>
            `).join("")
            : `
                <tr>
                    <td colspan="3" class="vacio">
                        Todavía no hay docentes. Toca "+ Nuevo docente".
                    </td>
                </tr>
            `;
    }

    dibujar();
}
