import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // Permite que el servidor sea accesible fuera del contenedor
    port: 5173,        // El puerto que mapeaste en tu docker-compose
    watch: {
      usePolling: true, // ¡CRUCIAL! Hace que Vite detecte cambios de archivos en Docker/Windows
    },
    hmr: {
      clientPort: 5173, // Evita los errores de WebSocket que estabas viendo
    },
  },
})