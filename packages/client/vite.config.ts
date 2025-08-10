import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    server: {
      deps: {
        inline: ['pinia', 'vue', 'vue-router', 'axios'],
        external: ['@vue/test-utils']
      }
    }
  },
  optimizeDeps: {
    include: ['pinia', 'vue', 'vue-router', 'axios']
  },
  ssr: {
    noExternal: ['pinia', 'vue', 'vue-router']
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://server:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#': path.resolve(__dirname, './types')
    }
  }
})
