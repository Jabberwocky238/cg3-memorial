import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from "@cloudflare/vite-plugin";
import path from 'node:path'
import type { Plugin } from 'rollup'
import { minify as terserMinify } from 'terser'

// 仅压缩非 arweave 的 chunk
function conditionalTerser(): Plugin {
  return {
    name: 'conditional-terser',
    async renderChunk(code, chunk) {
      // 跳过包含 arweave 的 chunk
      if (chunk.name === 'arweave' || Object.keys(chunk.modules).some(m => m.includes('node_modules/arweave'))) {
        return null
      }
      const result = await terserMinify(code, {
        compress: true,
        mangle: true,
        module: true,
        sourceMap: true,
        format: { comments: false },
      })
      return { code: result.code || code, map: result.map as any }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@@': path.resolve(__dirname, 'src/components'),
    },
  },
  build: {
    // 关闭 Vite 自带压缩，改用自定义插件实现“排除 arweave”
    minify: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // 将 arweave 放进独立 chunk
        manualChunks(id) {
          if (id.includes('node_modules/arweave')) {
            return 'arweave'
          }
        },
      },
      plugins: [conditionalTerser()],
    },
  },
})