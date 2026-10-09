import { useEffect, useState } from 'react';

/** Devuelve `value` solo después de que deje de cambiar durante `delay` ms. */
export default function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
