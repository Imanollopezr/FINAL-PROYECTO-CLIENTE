import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, new URL('.', import.meta.url).pathname, '')
  
  return {
    plugins: [react()],
    define: {
      // Configuración para que next-auth funcione con Vite
      'process.env.NEXTAUTH_URL': JSON.stringify(env.NEXTAUTH_URL),
      'process.env.NEXTAUTH_SECRET': JSON.stringify(env.NEXTAUTH_SECRET),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID),
      'process.env.GOOGLE_CLIENT_SECRET': JSON.stringify(env.GOOGLE_CLIENT_SECRET),
      'process.env.GITHUB_CLIENT_ID': JSON.stringify(env.GITHUB_CLIENT_ID),
      'process.env.GITHUB_CLIENT_SECRET': JSON.stringify(env.GITHUB_CLIENT_SECRET),
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      // Forzar el puerto 5000 para NextAuth
      '__NEXTAUTH_INTERNAL_URL': JSON.stringify('http://localhost:5000'),
    },
    envDir: '.',
    envPrefix: ['VITE_'],
    build: {
      // Optimizaciones para reducir el tamaño del bundle
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['bootstrap', 'react-bootstrap', 'framer-motion'],
            charts: ['chart.js', 'react-chartjs-2', 'recharts'],
            icons: ['react-icons', 'lucide-react', '@fortawesome/react-fontawesome'],
            utils: ['axios', 'date-fns', 'crypto-js', 'uuid'],
          },
          // Comprimir archivos CSS y JS
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        }
      },
      // Configuraciones de compresión
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false, // Desactivar para builds más rápidos
      sourcemap: false, // Desactivar sourcemaps en producción
    },
    optimizeDeps: {
      // Volver al comportamiento estándar de Vite para prebundle
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    server: {
      port: 5176,
      strictPort: false,
      host: true,
      // Configuraciones para reducir el uso de memoria
      hmr: {
        overlay: false
      },
      proxy: (() => {
        // Usar variables cargadas por Vite (loadEnv) en vez de process.env
        // Backend en dev: 8091
        const target = 'http://localhost:8091';
        return {
          '/api/auth': {
            target,
            changeOrigin: true,
            secure: false,
          },
          // Soportar rutas con mayúsculas usadas por el frontend
          '/api/Auth': {
            target,
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api\/Auth/, '/api/auth'),
          },
          '/api/usuarios': {
            target,
            changeOrigin: true,
            secure: false,
          },
          '/api/Usuarios': {
            target,
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api\/Usuarios/, '/api/usuarios'),
          },
          '/api/ventas': {
            target,
            changeOrigin: true,
            secure: false,
          },
          '/api/Ventas': {
            target,
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api\/Ventas/, '/api/ventas'),
          },
          '/api/ventas/cliente': {
            target,
            changeOrigin: true,
            secure: false,
          },
          '/api': {
            target,
            changeOrigin: true,
            secure: false,
          },
        };
      })(),
    },
  }
})
