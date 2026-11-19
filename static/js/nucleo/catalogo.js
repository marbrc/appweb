
// carreras, grupos y profesores en un solo lugar para todo el marco
// son los mismos datos que tiene app.js la pg  vieja y cuando ya no se use app.js solo esta esta copia
// Cuando tengan la base de datos esto se cambia por consultas

export const CARRERAS = {
  "Desarrollo de Software": {
    materias: { 1: ["Programación Estructurada", "Calculo de varias variables"], 2: ["Bases de datos", "Ingles"], 3: ["Redes", "Estadística"] },
    grupos: { 1: ["GTRD321", "GTID143"], 2: ["GTID321", "GT1IDW32"], 3: ["GTID456"] }
  },
  "Entornos virtuales": {
    materias: { 1: ["Fisica", "Calculo Diferencial"], 2: ["Redes", "Ingle"] },
    grupos: { 1: ["GTID432"], 2: ["GTID123"] }
  },
  "Mecatrónica": {
    materias: { 1: ["Electrónica", "Física"], 2: ["Programación", "Idioma Extranjero"] },
    grupos: { 1: ["GTID342"], 2: ["GTID341"] }
  }
};

export const PROFESORES = ["Vazquez Juarez Erika", "Sustaita Cruces Daniel", "Rodriguez Garcia Anastacio", "Hernández Monzón Verónica"];

// todosLosGrupo, una lista  grupo, carrera, cuatri  con todos los grupos de todas las carreras
export const todosLosGrupos = () => Object.entries(CARRERAS).flatMap(([carrera, c]) =>
  Object.entries(c.grupos).flatMap(([cuatri, lista]) => lista.map(grupo => ({ grupo, carrera, cuatri }))));