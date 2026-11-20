import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/storage': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/leaflet')) {
            return 'vendor-leaflet';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('src/pages/admin/')) {
            return 'area-admin';
          }
          if (id.includes('src/pages/intelligence/')) {
            return 'area-intelligence';
          }
          if (id.includes('src/pages/user/')) {
            return 'area-user';
          }
          if (id.includes('src/pages/public/')) {
            return 'area-public';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
