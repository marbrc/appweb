
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getAsignaturas, setAsignaturas } from "/static/js/nucleo/datos.js";

const CLAVE = "admin_asignaturas";

const leer = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || [];
  } catch {
    return [];
  }
};

const guardar = v =>
  localStorage.setItem(CLAVE, JSON.stringify(v));

let cont = null;
let editando = -1;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  buscar("#s-nuevo", cont).onclick = () => abrirForm(-1);

  buscar("#s-cancelar", cont).onclick = () => {
    buscar("#s-form", cont).hidden = true;
  };

  buscar("#s-form", cont).onsubmit = e => {
    e.preventDefault();

    const d = Object.fromEntries(new FormData(e.target));

    const nombre = (d.nombre || "").trim();
    const carrera = (d.carrera || "").trim();
    const cuatrimestre = Number(d.cuatrimestre);

    // Validar nombre obligatorio
    if (!nombre) {
      alert("El nombre de la asignatura es obligatorio.");
      e.target.elements.nombre.focus();
      return;
    }

    // Validar primera letra mayúscula
    if (!/^\p{Lu}/u.test(nombre)) {
      alert(
        "La asignatura debe comenzar con mayúscula. Ejemplo: Programación."
      );
      e.target.elements.nombre.focus();
      return;
    }

    // Validar carrera obligatoria
    const carrerasPermitidas = [
      "Desarrollo de Software",
      "Entornos virtuales",
      "Mecatrónica"
    ];

    if (!carrerasPermitidas.includes(carrera)) {
      alert("Debes seleccionar una carrera válida.");
      e.target.elements.carrera.focus();
      return;
    }

    // Validar cuatrimestre obligatorio, del 1 al 12
    if (
      !d.cuatrimestre ||
      !Number.isInteger(cuatrimestre) ||
      cuatrimestre < 1 ||
      cuatrimestre > 12
    ) {
      alert("Debes seleccionar un cuatrimestre del 1 al 12.");
      e.target.elements.cuatrimestre.focus();
      return;
    }

    const lista = leer();

    const item = {
      nombre,
      carrera,
      cuatrimestre
    };

    if (editando >= 0) {
      lista[editando] = item;
    } else {
      lista.push(item);
    }

    guardar(lista);

    e.target.reset();
    buscar("#s-form", cont).hidden = true;

    dibujar();
  };

  buscar("#s-tabla", cont).onclick = e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");

    if (ed) abrirForm(+ed.dataset.ed);

    if (del && confirm("¿Eliminar esta asignatura?")) {
      const lista = leer();
      lista.splice(+del.dataset.del, 1);
      guardar(lista);
      dibujar();
    }
  };

  dibujar();
}

function abrirForm(i) {
  editando = i;

  const f = buscar("#s-form", cont);
  f.hidden = false;

  if (i >= 0) {
    const a = leer()[i];

    f.elements.nombre.value = a.nombre;
    f.elements.carrera.value = a.carrera;
    f.elements.cuatrimestre.value = a.cuatrimestre;
  } else {
    f.reset();
  }

  f.elements.nombre.focus();
}

function dibujar() {
  const lista = leer();

  buscar("#s-tabla", cont).innerHTML = lista.length
    ? lista.map((a, i) => `
        <tr>
          <td>${a.nombre}</td>
          <td>${a.carrera}</td>
          <td>${a.cuatrimestre}°</td>
          <td class="acciones-fila">
            <button class="mini" type="button" data-ed="${i}">
              Editar
            </button>
            <button class="mini rojo" type="button" data-del="${i}">
              Eliminar
            </button>
          </td>
        </tr>
      `).join("")
    : `<tr><td colspan="4" class="vacio">Todavía no hay asignaturas.</td></tr>`;
}
