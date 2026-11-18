// /static/js/nucleo/filtro.js
// la barrita de búsqueda de las pantallas del admin.
// busca sin importar mayúsculas ni acentos: "calculo" sí encuentra "Cálculo".

// normalizar, deja el texto comparable (minúsculas y sin acentos)
export const normalizar = v => String(v ?? "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

// filtrar, regresa [[elemento, índiceReal], ...] para no perder el índice original
// (las tablas usan data-ed / data-del con el índice de la lista completa)
export function filtrar(lista, texto, campos) {
  const q = normalizar(texto).trim();
  return (lista || [])
    .map((item, i) => [item, i])
    .filter(([item]) => !q || normalizar(campos(item)).includes(q));
}

// conectar, redibuja cada vez que escriben o le pican a la X del buscador
export function conectar(input, dibujar) {
  if (!input) return;
  input.addEventListener("input", dibujar);
  input.addEventListener("search", dibujar);
}

// cuenta, el textito del encabezado: "3 de 25" cuando hay búsqueda, si no el total normal
export function cuenta(visibles, total, singular, plural) {
  const nombre = Number(total) === 1 ? singular : plural;
  if (Number(visibles) === Number(total)) return `${total} ${nombre}`;
  return `${visibles} de ${total} ${nombre}`;
}
