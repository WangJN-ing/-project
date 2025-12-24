import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['appfig.png', 'appfig-192.png', 'appfig-512.png'],
      manifest: {
        name: '-PROJECT',
        short_name: '-PROJECT',
        description: 'Hard Sphere Lab app',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0b0b0b',
        icons: [
          {
            src: '/appfig-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/appfig-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    target: 'es2015', // Increases compatibility for older Android phones
  }
});
