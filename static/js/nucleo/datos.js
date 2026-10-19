// en datos.js: el unico archivo que toca el almacenamiento
// ahorita todo es local de prueba y cuando ya este la  base de datos solo se VA ACAMBIAR ESTE ARCHIVO
// y a las pantallas no les pasa nada, porque siempre piden las cosas con estas funciones

// leer, saca una lista guardada y si no hay nada o hay error regresa []
export const leer = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };

// guardar, guarda una lista con el nombre k
export const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// la sesión es el usuario que inició sesión con nombre, correo y rol y  null = nadie
export const obtenerSesion = () => { try { return JSON.parse(localStorage.getItem("sesion")); } catch { return null; } };
export const actualizarSesion = s => localStorage.setItem("sesion", JSON.stringify(s));
export const cerrarSesion = () => localStorage.removeItem("sesion");

// preferencias peques, ej. si el menú estaba oculto, con un valor guarda y sin valor lee
export const preferencia = (k, v) => v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v);

// cambiarTema, pone el tema en el <html> y lo recuerda como claro, oscuro o negro
export const cambiarTema = t => { document.documentElement.dataset.tema = t; localStorage.setItem("tema", t); };