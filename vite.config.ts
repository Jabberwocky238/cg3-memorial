import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from "@cloudflare/vite-plugin";
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@@': path.resolve(__dirname, 'src/components'),
    },
  },
})