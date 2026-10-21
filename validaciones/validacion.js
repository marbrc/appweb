
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // VALIDACIONES DEL REGISTRO DE USUARIO
    // ==========================================

    const formRegistro = document.getElementById("formRegistro");

    const reglasRegistro = {

        // Nombre: de 3 a 60 caracteres y de 1 a 5 palabras.
        // Cada palabra debe iniciar con mayúscula.
        // Solo permite letras, acentos, ñ y espacios.
        nombre: valor => {
            const nombreCorrecto =
                /^[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]*(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]*){0,4}$/.test(valor);

            return (
                valor.length >= 3 &&
                valor.length <= 60 &&
                nombreCorrecto
            ) || "Escribe de 1 a 5 palabras. Cada palabra debe iniciar con mayúscula y contener solo letras.";
        },

        // Correo institucional de la UTNG.
        correo: valor =>
            /^[^@\s]+@utng\.edu\.mx$/.test(valor) ||
            "Usa tu correo institucional (@utng.edu.mx).",

        // Contraseña: de 8 a 20 caracteres.
        // Debe incluir mayúscula, minúscula y número.
        clave: valor =>
            /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/.test(valor) ||
            "La contraseña debe tener de 8 a 20 caracteres, una mayúscula, una minúscula y un número.",

        // Confirmación de contraseña.
        clave2: (valor, formulario) =>
            valor === formulario.elements.clave.value ||
            "Las contraseñas no son iguales.",

        // Selección de rol.
        rol: valor =>
            ["Alumno", "Docente", "Administrador"].includes(valor) ||
            "Selecciona un rol válido."
    };


    // ==========================================
    // VALIDACIONES DEL INICIO DE SESIÓN
    // ==========================================

    const formLogin = document.getElementById("formLogin");

    const reglasLogin = {
        correo: valor =>
            /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor) ||
            "Escribe un correo electrónico válido."
    };


    // ==========================================
    // MOSTRAR Y COMPROBAR ERRORES
    // ==========================================

    function revisar(campo, reglas, formulario) {

        // Conservar los espacios de las contraseñas.
        const valor =
            campo.name === "clave" || campo.name === "clave2"
                ? campo.value
                : campo.value.trim();

        // Buscar el mensaje de error del campo.
        const siguiente = campo.nextElementSibling;

        const mensaje =
            siguiente && siguiente.classList.contains("error")
                ? siguiente
                : campo.parentElement.querySelector(".error");

        let resultado = true;

        // Comprobar si el campo está vacío.
        if (!valor) {
            resultado = "Este campo es obligatorio.";
        } else if (reglas[campo.name]) {
            resultado = reglas[campo.name](valor, formulario);
        }

        // Mostrar el mensaje de error.
        if (mensaje) {
            mensaje.textContent =
                resultado === true ? "" : resultado;
        }

        // Marcar el campo según el resultado.
        campo.classList.toggle("mal", resultado !== true);
        campo.classList.toggle("bien", resultado === true);

        return resultado === true;
    }


    // ==========================================
    // ACTIVAR VALIDACIONES EN CADA FORMULARIO
    // ==========================================

    function activar(formulario, reglas, tipo) {

        if (!formulario) return;

        const campos = formulario.querySelectorAll(
            "input[name], select[name]"
        );

        campos.forEach(campo => {

            // Validar al salir del campo.
            campo.addEventListener("blur", () => {
                revisar(campo, reglas, formulario);
            });

            // Validar mientras se escribe.
            campo.addEventListener("input", () => {

                revisar(campo, reglas, formulario);

                // Si cambia la contraseña, revisar también
                // la confirmación de contraseña.
                if (
                    campo.name === "clave" &&
                    tipo === "registro"
                ) {
                    const confirmacion =
                        formulario.querySelector('[name="clave2"]');

                    if (confirmacion && confirmacion.value) {
                        revisar(confirmacion, reglas, formulario);
                    }
                }
            });

            // Validar cuando cambia una selección.
            campo.addEventListener("change", () => {
                revisar(campo, reglas, formulario);
            });
        });


        // ==========================================
        // VALIDAR AL ENVIAR EL FORMULARIO
        // ==========================================

        formulario.addEventListener("submit", evento => {

            evento.preventDefault();

            let valido = true;

            campos.forEach(campo => {
                if (!revisar(campo, reglas, formulario)) {
                    valido = false;
                }
            });

            const mensajeExito =
                formulario.querySelector(".ok");

            if (mensajeExito) {
                mensajeExito.hidden = !valido;

                if (valido) {
                    mensajeExito.textContent =
                        tipo === "registro"
                            ? "Registro correcto"
                            : "Validación de inicio de sesión correcta";
                }
            }

            // Si existen errores, ocultar el mensaje de éxito
            // y enfocar el primer campo incorrecto.
            if (!valido) {

                if (mensajeExito) {
                    mensajeExito.hidden = true;
                }

                const primerError = [...campos].find(campo =>
                    !revisar(campo, reglas, formulario)
                );

                if (primerError) {
                    primerError.focus();
                }
            }
        });
    }


    // ==========================================
    // INICIAR LAS VALIDACIONES
    // ==========================================

    activar(formRegistro, reglasRegistro, "registro");
    activar(formLogin, reglasLogin, "login");

});
