import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    open: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-charts';
          if (id.includes('node_modules/react-datepicker')) return 'vendor-datepicker';
          if (id.includes('node_modules/react-router')) return 'vendor-router';
          if (id.includes('node_modules/axios')) return 'vendor-http';
          if (id.includes('node_modules/bootstrap') || id.includes('node_modules/react-bootstrap')) return 'vendor-bootstrap';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler') || id.includes('node_modules/redux') || id.includes('node_modules/react-redux')) return 'vendor-react';
          if (id.includes('node_modules/styled-components') || id.includes('node_modules/@emotion')) return 'vendor-styled';
          if (id.includes('node_modules/react-toastify')) return 'vendor-toastify';
          if (id.includes('node_modules/react-icons')) return 'vendor-icons';
          if (id.includes('node_modules/@tanstack') || id.includes('node_modules/react-query')) return 'vendor-query';
        },
      },
    },
  },
})
