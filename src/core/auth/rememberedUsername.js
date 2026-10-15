const STORAGE_KEY = 'taller360.rememberedUsername';

// Esta preferencia guarda solo el usuario; no modifica la sesión.
export const rememberedUsername = {
  get: () => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  },
  save: (username) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, username);
    } catch {
      // Si el navegador bloquea el almacenamiento, el login sigue funcionando.
    }
  },
  clear: () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // La preferencia es opcional y no debe interrumpir el formulario.
    }
  },
};
