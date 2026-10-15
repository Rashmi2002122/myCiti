import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon.ico'],
      manifest: {
        name: 'myCiti - India Pandals, Melas & Events Guide',
        short_name: 'myCiti',
        description: 'Explore Pandals, Melas, Offers and Inaugurations across India on an interactive offline-ready map.',
        theme_color: '#2f7bff',
        background_color: '#cfe7ff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        id: '/',
        categories: ['travel', 'events', 'lifestyle', 'navigation'],
        icons: [
          {
            src: '/icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache static app assets
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,ico,mjs}'],
        runtimeCaching: [
          // 1. Cache OpenStreetMap Map Tiles
          {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles-cache',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 1b. Cache OpenFreeMap Vector Assets
          {
            urlPattern: /^https:\/\/tiles\.openfreemap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'openfreemap-cache',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 2. Cache Last Active Listings API Response
          {
            urlPattern: /\/api\/listings.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-listings-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 3. Cache Unsplash / Upload Images
          {
            urlPattern: /(?:https:\/\/images\.unsplash\.com\/.*|\/uploads\/.*)/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'listings-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 14, // 14 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
