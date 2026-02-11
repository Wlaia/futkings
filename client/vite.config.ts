import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Futkings',
        short_name: 'Futkings',
        description: 'Gestão de Campeonatos e Times de Futebol',
        theme_color: '#000000',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'Favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'Favicon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'Favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})

