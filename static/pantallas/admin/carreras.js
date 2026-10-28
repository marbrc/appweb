
import { buscar } from "/static/js/nucleo/utiles.js";

export function iniciar(cont) {
  const tabla = buscar("#tabla-carreras", cont);
  const formulario = buscar("#formulario-carrera", cont);
  const form = buscar("#form-carrera", cont);
  const nombre = buscar("#nombre-carrera", cont);
  const indice = buscar("#indice-carrera", cont);
  const mensaje = buscar("#mensaje-carreras", cont);
  const total = buscar("#total-carreras", cont);
  const titulo = buscar("#titulo-formulario", cont);

  // Carreras de ejemplo para comenzar
  let carreras = [
    "Desarrollo de Software",
    "Entornos Virtuales",
    "Mecatrónica"
  ];

  function avisar(texto, correcto = true) {
    mensaje.textContent = texto;
    mensaje.className = correcto ? "ok" : "err";
    mensaje.hidden = false;
  }

  function dibujar() {
    total.textContent = carreras.length +
      (carreras.length === 1 ? " carrera" : " carreras");

    if (carreras.length === 0) {
      tabla.innerHTML = `
        <tr>
          <td colspan="3">No hay carreras registradas.</td>
        </tr>`;
      return;
    }

    tabla.innerHTML = carreras.map((carrera, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapar(carrera)}</td>
        <td>
          <button class="mini"
            data-accion="editar" data-indice="${i}">
            Editar
          </button>
          <button class="mini rojo"
            data-accion="eliminar" data-indice="${i}">
            Eliminar
          </button>
        </td>
      </tr>
    `).join("");
  }

  // Evita interpretar el nombre escrito como código HTML
  function escapar(texto) {
    return texto.replace(/[&<>"']/g, letra => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[letra]);
  }

  function abrirFormulario(i = "") {
    form.reset();
    indice.value = i;
    titulo.textContent = i === ""
      ? "Registrar carrera"
      : "Editar carrera";

    if (i !== "") {
      nombre.value = carreras[Number(i)];
    }

    formulario.hidden = false;
    mensaje.hidden = true;
    nombre.focus();
  }

  buscar("#btn-nueva-carrera", cont).addEventListener("click", () => {
    abrirFormulario();
  });

  buscar("#cancelar-carrera", cont).addEventListener("click", () => {
    formulario.hidden = true;
    form.reset();
  });

  form.addEventListener("submit", e => {
    e.preventDefault();

    const texto = nombre.value.trim();
    const i = indice.value;

    if (!texto) {
      avisar("Escribe el nombre de la carrera.", false);
      return;
    }

    const repetida = carreras.some((c, posicion) =>
      c.toLocaleLowerCase() === texto.toLocaleLowerCase() &&
      posicion !== Number(i)
    );

    if (repetida) {
      avisar("Esa carrera ya está registrada.", false);
      return;
    }

    if (i === "") {
      carreras.push(texto);
      avisar("Carrera registrada correctamente.");
    } else {
      carreras[Number(i)] = texto;
      avisar("Carrera actualizada correctamente.");
    }

    formulario.hidden = true;
    form.reset();
    dibujar();
  });

  tabla.addEventListener("click", e => {
    const boton = e.target.closest("[data-accion]");

    if (!boton) return;

    const i = Number(boton.dataset.indice);

    if (boton.dataset.accion === "editar") {
      abrirFormulario(String(i));
    }

    if (boton.dataset.accion === "eliminar") {
      const carrera = carreras[i];

      if (confirm(`¿Deseas eliminar la carrera "${carrera}"?`)) {
        carreras.splice(i, 1);
        dibujar();
        avisar("Carrera eliminada correctamente.");
      }
    }
  });

  dibujar();
}
