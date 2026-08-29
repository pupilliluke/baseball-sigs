import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Only split out libraries with no React imports; splitting React away
        // from @react-three/fiber breaks chunk init order (blank page).
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('node_modules/three')) return 'three' // three + three-stdlib
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase'
        },
      },
    },
  },
})
