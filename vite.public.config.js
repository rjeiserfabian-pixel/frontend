import { defineConfig, mergeConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import baseConfig from './vite.config.js';

export default mergeConfig(baseConfig, defineConfig({
  build: {
    outDir: 'dist-public',
    sourcemap: false,
    rollupOptions: { input: fileURLToPath(new URL('./public.html', import.meta.url)) },
  },
}));
