// /static/pantallas/admin/carreras.js
import { buscar, avisar, confirmar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { getCarreras, setCarreras, alCambiarDatos, getGrupos, setGrupos, refrescarDatos } from "/static/js/nucleo/datos.js";

let cont = null;
let editando = -1;
let desuscribir = null;

const limpiar = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);
  editando = -1;

  const btnNuevo = buscar("#c-nuevo", cont);
  const form = buscar("#c-form", cont);
  const btnCancelar = buscar("#c-cancelar", cont);
  const tabla = buscar("#c-tabla", cont);
  const titulo = buscar("#c-titulo", cont);

  if (!btnNuevo || !form || !btnCancelar || !tabla) {
    console.error("Faltan elementos en el HTML de carreras. Revisa los IDs.");
    return;
  }

  btnNuevo.onclick = () => abrirForm(-1);
  btnCancelar.onclick = () => { form.reset(); form.hidden = true; editando = -1; };

  // limpia lo que escriben: quita lo que no sea letra y pone la primera en mayuscula
  // (esto antes estaba en un <script> dentro de carreras.html pero ahi NUNCA se ejecutaba porque el router mete el html con innerHTML)
  form.nombre.addEventListener("input", function () {
    let valor = this.value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "").replace(/\s{2,}/g, " ").slice(0, 60);
    if (valor) valor = valor.charAt(0).toUpperCase() + valor.slice(1);
    this.value = valor;
  });

  form.onsubmit = async e => {
    e.preventDefault();

    // ANTES se ponia todo en minusculas y al editar "Desarrollo de Software Multiplataforma" quedaba diferente a la BD
    const nombre = form.nombre.value.trim().replace(/\s+/g, " ");
    if (!nombre) return;
    if (nombre.length > 60) return avisar("El nombre de la carrera no puede pasar de 60 caracteres.", "err");
    if (!/^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]*$/.test(nombre)) {
      form.nombre.focus();
      return avisar("Debe empezar con mayúscula y solo llevar letras.", "err");
    }

    const lista = getCarreras() || [];
    if (lista.some((c, i) => i !== editando && c.toLowerCase() === nombre.toLowerCase())) {
      form.nombre.focus();
      return avisar(`La carrera "${nombre}" ya está registrada.`, "err");
    }

    if (editando >= 0) lista[editando] = nombre;
    else lista.push(nombre);
    const eraEdicion = editando >= 0;
    form.reset();
    form.hidden = true;
    editando = -1;
    // en la BD los grupos estan ligados por id, asi que al renombrar no hay que tocar los grupos,
    // solo espero a que se guarde y vuelvo a traer todo para que los grupos ya salgan con el nombre nuevo
    await setCarreras(lista);
    await refrescarDatos();
    avisar(eraEdicion ? "Carrera actualizada." : "Carrera registrada.");
    dibujar();
  };

  tabla.onclick = async e => {
    const ed = e.target.closest("[data-ed]");
    const del = e.target.closest("[data-del]");

    if (ed) abrirForm(+ed.dataset.ed);

    if (del) {
      const lista = getCarreras();
      const nombreCarrera = lista[+del.dataset.del];
      const gruposConCarrera = (getGrupos() || []).filter(g => g.carrera === nombreCarrera);

      let mensaje = "Esta acción no se puede deshacer.";
      if (gruposConCarrera.length > 0)
        mensaje = `Esta carrera tiene ${gruposConCarrera.length} grupo(s). Si la eliminas, también se eliminarán esos grupos y sus asignaturas.`;
      if (!await confirmar(mensaje, { titulo: `¿Eliminar "${nombreCarrera}"?`, si: "Eliminar", peligro: true })) return;

      // primero los grupos y DESPUES la carrera, al reves la BD no deja (los grupos apuntan a la carrera)
      if (gruposConCarrera.length > 0) await setGrupos((getGrupos() || []).filter(g => g.carrera !== nombreCarrera));
      lista.splice(+del.dataset.del, 1);
      await setCarreras(lista);
      dibujar();
    }
  };

  if (desuscribir) desuscribir();
  desuscribir = alCambiarDatos("admin_carreras", () => {
    const lista = getCarreras() || [];
    if (editando >= lista.length) {
      form.reset();
      form.hidden = true;
      editando = -1;
    } else if (editando >= 0 && form.hidden === false) {
      form.nombre.value = lista[editando];
    }
    dibujar();
  });

  dibujar();

  function abrirForm(i) {
    editando = i;
    form.hidden = false;
    form.reset();
    titulo.textContent = i >= 0 ? "Editar carrera" : "Nueva carrera";
    if (i >= 0) form.nombre.value = getCarreras()[i];
    form.nombre.focus();
  }

  function dibujar() {
    const lista = getCarreras() || [];
    const grupos = getGrupos() || [];
    
    const total = buscar("#c-total", cont);
    if (total) total.textContent = lista.length + (lista.length === 1 ? " registrada" : " registradas");

    tabla.innerHTML = lista.length
      ? lista.map((c, i) => {
          const qtyGrupos = grupos.filter(g => g.carrera === c).length;
          
          return `
          <tr>
            <td class="sub">${i + 1}</td>
            <td><b>${limpiar(c)}</b></td>
            <td>${qtyGrupos ? `<span class="chip">${qtyGrupos} ${qtyGrupos === 1 ? "grupo" : "grupos"}</span>` : '<span class="sub">Sin grupos</span>'}</td>
            <td class="acciones-fila">
              <button class="mini" type="button" data-ed="${i}">Editar</button>
              <button class="mini rojo" type="button" data-del="${i}">Eliminar</button>
            </td>
          </tr>`;
        }).join("")
      : `<tr><td colspan="4" class="vacio">Todavía no hay carreras. Toca "+ Nueva carrera".</td></tr>`;
  }
}