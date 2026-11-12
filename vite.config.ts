import { defineConfig } from 'vite';

export default defineConfig({
  base: '/thai-word-defense/',
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
  },
  server: { host: '0.0.0.0' },
});
