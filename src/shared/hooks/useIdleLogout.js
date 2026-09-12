import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

// Ejecuta onIdle si no detecta actividad del usuario durante timeoutMs.
// Usado para cerrar sesión automáticamente en PCs compartidas del taller.
export function useIdleLogout(timeoutMs, onIdle) {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    let timer = setTimeout(() => onIdleRef.current(), timeoutMs);

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onIdleRef.current(), timeoutMs);
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer));

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [timeoutMs]);
}
