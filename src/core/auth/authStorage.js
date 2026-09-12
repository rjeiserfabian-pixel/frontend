// Almacena la sesión en sessionStorage (no localStorage) para que se cierre
// automáticamente al cerrar el navegador, evitando que un usuario distinto
// herede la sesión en una PC compartida.
const STORAGE = window.sessionStorage;

export const authStorage = {
  getAccessToken: () => STORAGE.getItem('accessToken'),
  getRefreshToken: () => STORAGE.getItem('refreshToken'),
  getUser: () => JSON.parse(STORAGE.getItem('user') || '{}'),

  setSession: ({ access, refresh, user }) => {
    STORAGE.setItem('accessToken', access);
    STORAGE.setItem('refreshToken', refresh);
    STORAGE.setItem('user', JSON.stringify(user));
  },
  setAccessToken: (token) => STORAGE.setItem('accessToken', token),
  setUser: (user) => STORAGE.setItem('user', JSON.stringify(user)),

  clear: () => {
    STORAGE.removeItem('accessToken');
    STORAGE.removeItem('refreshToken');
    STORAGE.removeItem('user');
  },
};
