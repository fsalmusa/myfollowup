import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' -> relative asset paths so GitHub Pages (project pages at
// https://<user>.github.io/<repo>/) loads correctly from any subpath.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
