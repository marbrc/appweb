// /static/pantallas/docente/resultados.js
import { buscar } from "/static/js/nucleo/utiles.js";
import { pintarIconos } from "/static/js/nucleo/iconos.js";
import { evaluacionesDelDocenteConEjemplo, PREG } from "./datos-docente.js";

let cont = null;

const ESTILOS = `
#r-barras {
  display: flex; align-items: stretch; gap: 2rem;
  margin: 1.5rem 0; padding: 1rem;
  background: #fff; border: 1px solid #ddd; border-radius: 8px; color: #333;
}
#r-barras .grafica-area { display: flex; flex: 1; position: relative; padding-left: 28px; }
#r-barras .y-axis {
  position: absolute; left: -8px; top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  font-size: .8rem; color: #666; white-space: nowrap;
}
#r-barras .ticks {
  display: flex; flex-direction: column; justify-content: space-between;
  margin-top: 30px; height: 140px; padding-right: 6px;
  font-size: .7rem; text-align: right; color: #333;
}
#r-barras .grafica-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
#r-barras .fila-vals, #r-barras .fila-nums { display: flex; }
#r-barras .val-cel { flex: 1; text-align: center; font-size: .75rem; color: #333; }
#r-barras .fila-vals { height: 30px; align-items: center; }
#r-barras .val-top { border: 1px solid #999; background: #fff; padding: 1px 4px; font-weight: 700; }
#r-barras .cols-container {
  display: flex; height: 140px; border: 1px solid #666;
  background-image: linear-gradient(to top, #ddd 1px, transparent 1px);
  background-size: 100% 20%;
}
#r-barras .col { flex: 1; display: flex; align-items: flex-end; justify-content: center; }
#r-barras .col i { display: block; width: 80%; border: 1px solid #444; }
#r-barras .fila-nums { margin-top: 4px; }
#r-barras .x-axis { text-align: center; font-size: .85rem; margin-top: 4px; color: #333; }
#r-barras .promedio-lateral {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-width: 120px; gap: .8rem;
}
#r-barras .promedio-lateral .lbl {
  font-size: .85rem; color: #666; text-transform: uppercase;
  text-align: center; letter-spacing: 1px;
}
#r-barras .caja-prom {
  font-size: 2rem; font-weight: 800; padding: .5rem 1.2rem;
  border: 2px solid #333; background: #fff; color: #333;
  box-shadow: 3px 3px 0 #999;
}
`;

export function iniciar(contenedor) {
  cont = contenedor;
  pintarIconos(cont);

  // Inyecta los estilos de la gráfica (una sola vez)
  if (!document.getElementById("estilos-resultados")) {
    const st = document.createElement("style");
    st.id = "estilos-resultados";
    st.textContent = ESTILOS;
    document.head.appendChild(st);
  }

  const evals = evaluacionesDelDocenteConEjemplo();

  const materias = [...new Set(evals.map(e => e.materia))];
  buscar("#r-materia", cont).innerHTML =
    `<option value="">Todas las materias</option>` +
    materias.map(m => `<option>${m}</option>`).join("");

  buscar("#r-materia", cont).addEventListener("change", pintar);
  pintar();

  function pintar() {
    const materia = buscar("#r-materia", cont).value;
    const filtradas = materia ? evals.filter(e => e.materia === materia) : evals;

    if (!filtradas.length) {
      buscar("#res-info", cont).textContent = "Todavía no tienes evaluaciones.";
      buscar("#r-promedio", cont).textContent = "0.0";
      buscar("#r-barras", cont).innerHTML = "";
      buscar("#r-tabla", cont).innerHTML = "";
      return;
    }

    buscar("#res-info", cont).textContent =
      `${filtradas.length} evaluación(es) · ${materia || "todas las materias"}`;

    // El promedio general va a la derecha de la gráfica
    buscar(".promedio-grande", cont).style.display = "none";

    const promGeneral =
      filtradas.reduce((a, e) => a + e.promedio, 0) / filtradas.length;

    const proms = Array.from({ length: PREG.length }, (_, i) => {
      const validas = filtradas.filter(
        e => e.calificaciones && e.calificaciones[i] !== undefined
      );
      if (!validas.length) return 0;
      const suma = validas.reduce((a, e) => a + (e.calificaciones[i] || 0), 0);
      return suma / validas.length;
    });

    const tonos = ["#999", "#ccc", "#fff", "#eee", "#fff", "#bbb",
                   "#aaa", "#ddd", "#ccc", "#fff", "#bbb", "#333"];

    const vals = proms.map(v =>
      `<div class="val-cel"><span class="val-top">${v.toFixed(1)}</span></div>`
    ).join("");

    // Escala 5 a 10 -> 0% a 100%
    const cols = proms.map((v, i) => {
      const pct = Math.min(Math.max((v - 5) / 5 * 100, 0), 100);
      return `<div class="col"><i style="height:${pct}%;background:${tonos[i % tonos.length]}"></i></div>`;
    }).join("");

    const nums = proms.map((_, i) => `<b class="val-cel">${i + 1}</b>`).join("");
    const ticks = [10, 9, 8, 7, 6, 5].map(t => `<span>${t}</span>`).join("");

    buscar("#r-barras", cont).innerHTML = `
      <div class="grafica-area">
        <span class="y-axis">Puntuación</span>
        <div class="ticks">${ticks}</div>
        <div class="grafica-main">
          <div class="fila-vals">${vals}</div>
          <div class="cols-container">${cols}</div>
          <div class="fila-nums">${nums}</div>
          <div class="x-axis">Preguntas</div>
        </div>
      </div>
      <div class="promedio-lateral">
        <span class="lbl">Promedio<br>General</span>
        <div class="caja-prom">${promGeneral.toFixed(1)}</div>
      </div>`;

    buscar("#r-tabla", cont).innerHTML = PREG.map((q, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${q}</td>
        <td><b>${proms[i].toFixed(1)}</b></td>
      </tr>`).join("");
  }
}