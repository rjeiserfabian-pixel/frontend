// Helpers para leer los errores que devuelve el backend (formato del manejador
// de excepciones de apps.seguridad), compartidos entre módulos.

/** Extrae el primer mensaje legible de la respuesta de error del backend. */
export const mensajeError = (error, fallback = 'Ocurrió un error inesperado') => {
  const data = error?.response?.data;
  const primero = (valor) => {
    if (!valor) return null;
    if (typeof valor === 'string') return valor;
    if (Array.isArray(valor)) return primero(valor[0]);
    if (typeof valor === 'object') {
      for (const v of Object.values(valor)) {
        const msg = primero(v);
        if (msg) return msg;
      }
    }
    return null;
  };
  return primero(data?.errores) || primero(data?.detail) || data?.mensaje || fallback;
};

/** Devuelve { campo: mensaje } para mostrar errores de validación bajo cada input. */
export const erroresPorCampo = (error) => {
  const errores = error?.response?.data?.errores;
  if (!errores || typeof errores !== 'object' || Array.isArray(errores)) return {};
  return Object.fromEntries(
    Object.entries(errores).map(([campo, v]) => [campo, Array.isArray(v) ? v[0] : String(v)])
  );
};
