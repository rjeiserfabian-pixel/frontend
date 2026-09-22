/**
 * getMediaUrl - Convierte la ruta de un archivo de media del backend en una URL accesible.
 *
 * Django guarda en la BD rutas relativas como 'empresa/Omega.png' o 'avatars/user.jpg'.
 * La MEDIA_URL de Django es '/media/', así que la URL completa es '/media/empresa/Omega.png'.
 * El proxy de Vite redirige '/media/*' al backend en puerto 8000, funcionando
 * tanto en desarrollo local como a través de Ngrok.
 *
 * @param {string|null} path - La ruta del archivo tal como viene del backend
 * @returns {string|null} - La URL usable por el navegador
 */
export function getMediaUrl(path) {
  if (!path) return null;
  // Si ya es una URL absoluta (http/https), extraer solo la parte del path
  // para que pase por el proxy de Vite y funcione también en Ngrok
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      return url.pathname; // Ej: /media/empresa/Omega.png
    } catch {
      return path;
    }
  }
  // Si ya tiene el prefijo /media/, devolverla tal cual
  if (path.startsWith('/media/')) return path;
  // Si es ruta relativa como 'empresa/Omega.png' → '/media/empresa/Omega.png'
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `/media/${cleanPath}`;
}
