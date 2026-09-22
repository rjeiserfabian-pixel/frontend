import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Escucha en todas las interfaces de red (requerido para Ngrok)
    host: true,
    // Permite conexiones desde cualquier host externo (Ngrok, red local, etc.)
    // En Vite 8 debe ser booleano `true`, no el string 'all'
    allowedHosts: true,
    // Proxy: redirige peticiones al backend Django (puerto 8000)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // /media/* → archivos subidos por el usuario (logos, avatares)
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
