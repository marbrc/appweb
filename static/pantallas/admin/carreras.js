(function () {
  const LLAVE = "carreras";
  const INICIALES = ["Desarrollo de Software", "Entornos Virtuales", "Mecatrónica"];

  const $ = (id) => document.getElementById(id);
  const formWrap = $("formulario-carrera");
  const form = $("form-carrera");
  const inputIndice = $("indice-carrera");
  const inputNombre = $("nombre-carrera");
  const titulo = $("titulo-formulario");
  const tabla = $("tabla-carreras");
  const total = $("total-carreras");
  const mensaje = $("mensaje-carreras");

  // ---- Almacenamiento (si usas API de Flask, cambia solo estas dos funciones) ----
  function leer() {
    try {
      const guardado = JSON.parse(localStorage.getItem(LLAVE));
      return Array.isArray(guardado) ? guardado : [...INICIALES];
    } catch {
      return [...INICIALES];
    }
  }
  function guardar(lista) {
    localStorage.setItem(LLAVE, JSON.stringify(lista));
  }

  let carreras = leer();

  // ---- Utilidades ----
  function escapar(texto) {
    const d = document.createElement("div");
    d.textContent = texto;
    return d.innerHTML;
  }

  function avisar(texto, esError = false) {
    mensaje.textContent = texto;
    mensaje.className = esError ? "msg error" : "msg ok";
    mensaje.hidden = false;
    setTimeout(() => (mensaje.hidden = true), 3000);
  }

  function abrirForm(indice = "") {
    inputIndice.value = indice;
    if (indice === "") {
      titulo.textContent = "Registrar carrera";
      inputNombre.value = "";
    } else {
      titulo.textContent = "Editar carrera";
      inputNombre.value = carreras[indice];
    }
    formWrap.hidden = false;
    inputNombre.focus();
  }

  function cerrarForm() {
    form.reset();
    inputIndice.value = "";
    formWrap.hidden = true;
  }

  // ---- Pintar tabla ----
  function pintar() {
    total.textContent = `${carreras.length} ${carreras.length === 1 ? "registrada" : "registradas"}`;

    if (!carreras.length) {
      tabla.innerHTML = `<tr><td colspan="3">Aún no hay carreras registradas.</td></tr>`;
      return;
    }

    tabla.innerHTML = carreras
      .map(
        (nombre, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapar(nombre)}</td>
          <td class="acc-fila">
            <button class="btn sec mini" type="button" data-editar="${i}">Editar</button>
            <button class="btn peligro mini" type="button" data-eliminar="${i}">Eliminar</button>
          </td>
        </tr>`
      )
      .join("");
  }

  // ---- Eventos ----
  $("btn-nueva-carrera").addEventListener("click", () => abrirForm());
  $("cancelar-carrera").addEventListener("click", cerrarForm);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = inputNombre.value.trim();
    if (!nombre) return;

    const indice = inputIndice.value;
    const repetida = carreras.some(
      (c, i) => c.toLowerCase() === nombre.toLowerCase() && String(i) !== indice
    );
    if (repetida) {
      avisar("Esa carrera ya está registrada.", true);
      return;
    }

    if (indice === "") {
      carreras.push(nombre);
      avisar("Carrera registrada correctamente.");
    } else {
      carreras[indice] = nombre;
      avisar("Carrera actualizada correctamente.");
    }

    guardar(carreras);
    cerrarForm();
    pintar();
  });

  tabla.addEventListener("click", (e) => {
    const btnEditar = e.target.closest("[data-editar]");
    const btnEliminar = e.target.closest("[data-eliminar]");

    if (btnEditar) {
      abrirForm(btnEditar.dataset.editar);
    } else if (btnEliminar) {
      const i = Number(btnEliminar.dataset.eliminar);
      if (confirm(`¿Eliminar la carrera "${carreras[i]}"?`)) {
        carreras.splice(i, 1);
        guardar(carreras);
        pintar();
        avisar("Carrera eliminada.");
      }
    }
  });

  pintar();
})();