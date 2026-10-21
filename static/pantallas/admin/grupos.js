
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";

// ---------- Almacenamiento local ----------
const CLAVE = "admin_grupos";

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

// ---------- Validaciones ----------
function validarGrupo(clave, carrera, cuatrimestre, lista) {
  const errores = [];

  // La clave debe tener 4 letras mayúsculas y 3 números.
  if (!/^[A-Z]{4}[0-9]{3}$/.test(clave)) {
    errores.push(
      "La clave debe tener 4 letras mayúsculas y 3 números, sin espacios. Ejemplo: GTID321."
    );
  }

  // La carrera debe pertenecer a las opciones disponibles.
  const selectCarrera = buscar('select[name="carrera"]', cont);
  const carrerasDisponibles = Array.from(selectCarrera.options)
    .filter(opcion => opcion.value !== "")
    .map(opcion => opcion.value);

  if (!carrerasDisponibles.includes(carrera)) {
    errores.push("Debes seleccionar una carrera disponible.");
  }

  // La clave no puede repetirse, excepto la del grupo editado.
  const duplicado = lista.some((grupo, indice) =>
    grupo.clave === clave && indice !== editando
  );

  if (duplicado) {
    errores.push("Ya existe un grupo con esa clave.");
  }

  // El cuatrimestre debe ser entero del 1 al 12.
  const numero = Number(cuatrimestre);

  if (
    cuatrimestre === "" ||
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > 12
  ) {
    errores.push(
      "El cuatrimestre debe ser un número entero del 1 al 12."
    );
  }

  return errores;
}

// ---------- Inicio de la pantalla ----------
export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  buscar("#g-nuevo", cont).onclick = () => abrirForm(-1);

  buscar("#g-cancelar", cont).onclick = () => {
    buscar("#g-form", cont).hidden = true;
    buscar("#g-form", cont).reset();
    editando = -1;
  };

  buscar("#g-form", cont).onsubmit = e => {
    e.preventDefault();

    const d = Object.fromEntries(new FormData(e.target));
    const lista = leer();

    // No quitamos espacios automáticamente:
    // cualquier espacio hace que la clave sea inválida.
    const clave = d.clave;
    const carrera = d.carrera;
    const cuatrimestre = d.cuatrimestre;

    const errores = validarGrupo(
      clave,
      carrera,
      cuatrimestre,
      lista
    );

    if (errores.length > 0) {
      alert(errores.join("\n"));
      return;
    }

    const item = {
      clave,
      carrera,
      cuatrimestre: Number(cuatrimestre)
    };

    if (editando >= 0) {
      lista[editando] = item;
    } else {
      lista.push(item);
    }

    guardar(lista);

    e.target.reset();
    e.target.hidden = true;
    editando = -1;

    dibujar();
    alert("Grupo guardado correctamente.");
  };

  // ---------- Editar y eliminar ----------
  buscar("#g-tabla", cont).onclick = e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");

    if (ed) {
      abrirForm(Number(ed.dataset.ed));
    }

    if (del) {
      if (!confirm("¿Eliminar este grupo?")) return;

      const lista = leer();
      lista.splice(Number(del.dataset.del), 1);
      guardar(lista);
      dibujar();
    }
  };

  dibujar();
}

// ---------- Abrir formulario ----------
function abrirForm(i) {
  editando = i;

  const f = buscar("#g-form", cont);
  f.hidden = false;

  if (i >= 0) {
    const grupo = leer()[i];

    f.elements.clave.value = grupo.clave;
    f.elements.carrera.value = grupo.carrera;
    f.elements.cuatrimestre.value = grupo.cuatrimestre;
  } else {
    f.reset();
  }

  f.elements.clave.focus();
}

// ---------- Dibujar tabla ----------
function dibujar() {
  const lista = leer();

  buscar("#g-tabla", cont).innerHTML = lista.length
    ? lista.map((g, i) => `
        <tr>
          <td>${g.clave}</td>
          <td>${g.carrera}</td>
          <td>${g.cuatrimestre}°</td>
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
    : `<tr>
        <td colspan="4" class="vacio">
          Todavía no hay grupos. Toca "+ Nuevo grupo".
        </td>
      </tr>`;
}
