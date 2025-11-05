import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Enable more aggressive code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'lucide-icons': ['lucide-react'],
          'recharts': ['recharts'],
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    // Enable source maps for debugging but smaller inline maps
    sourcemap: false,
    // Minify with esbuild (faster than terser)
    minify: 'esbuild',
    target: 'es2015',
  },
  // Enable dependency pre-bundling optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
})
