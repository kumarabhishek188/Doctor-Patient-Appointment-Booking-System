import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy requests starting with /booking and /user to your backend
      '/booking': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/user': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/reviews': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/notifications': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
