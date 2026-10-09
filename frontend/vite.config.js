import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@':           resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages':      resolve(__dirname, './src/pages'),
      '@hooks':      resolve(__dirname, './src/hooks'),
      '@store':      resolve(__dirname, './src/store'),
      '@api':        resolve(__dirname, './src/api'),
      '@utils':      resolve(__dirname, './src/utils'),
      '@context':    resolve(__dirname, './src/context'),
      '@assets':     resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:       'http://localhost:5000',
        changeOrigin: true,
        secure:       false,
      },
    },
  },
  build: {
    outDir:    'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react/'))    return 'vendor'
          if (id.includes('react-router-dom'))                       return 'router'
          if (id.includes('framer-motion'))                          return 'motion'
          if (id.includes('recharts'))                               return 'charts'
          if (id.includes('@tanstack/react-query'))                  return 'query'
          if (id.includes('lucide-react') || id.includes('/clsx/')) return 'ui'
        },
      },
    },
  },
})
