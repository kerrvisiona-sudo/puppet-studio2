import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.indexOf('node_modules') === -1) return
          if (id.indexOf('/three/examples/') !== -1 || id.indexOf('/three-stdlib/') !== -1) {
            return 'vendor-three-extras'
          }
          if (id.indexOf('/troika-three-text/') !== -1) {
            return 'vendor-three-text'
          }
          if (id.indexOf('/three/') !== -1) {
            return 'vendor-three-core'
          }
          if (id.indexOf('@react-three') !== -1) {
            return 'vendor-r3f'
          }
          if (id.indexOf('/react/') !== -1 || id.indexOf('/react-dom/') !== -1 || id.indexOf('/scheduler/') !== -1) {
            return 'vendor-react'
          }
          if (id.indexOf('/zustand/') !== -1) {
            return 'vendor-state'
          }
          return 'vendor'
        },
      },
    },
  },
})
