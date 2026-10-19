// en utiles.js: las dos abreviaturas de siempre y ahora para usarlas en tds los archivos

// buscar, encuentra un elemento s es el selector y r es donde lo busco
export const buscar = (s, r = document) => r.querySelector(s);

// buscarTodos encuentra todoos y los pasa a una lista normal para poder usar forEach
export const buscarTodos = (s, r = document) => [...r.querySelectorAll(s)];