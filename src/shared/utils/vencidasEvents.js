// Eventos ligeros (sin librerías, solo window.dispatchEvent/addEventListener)
// para que las campanitas de "cuentas vencidas" del header se refresquen
// justo después de una acción que pudo cambiarlas (un pago o un cobro),
// en vez de depender solo del refresco periódico por intervalo.
export const EVENTO_COBRAR_VENCIDAS_CAMBIO = 'cobrar-vencidas:cambio';
export const EVENTO_PAGAR_VENCIDAS_CAMBIO = 'pagar-vencidas:cambio';

export const notificarCobroRegistrado = () => {
  window.dispatchEvent(new Event(EVENTO_COBRAR_VENCIDAS_CAMBIO));
};

export const notificarPagoRegistrado = () => {
  window.dispatchEvent(new Event(EVENTO_PAGAR_VENCIDAS_CAMBIO));
};
