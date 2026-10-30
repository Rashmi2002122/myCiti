import L from 'leaflet'
if (typeof window !== 'undefined') {
  window.L = L
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { PWAInstallProvider } from './context/PWAInstallContext'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with auto-update
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New myCite version available. Updating immediately...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('myCite is ready for offline use.');
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PWAInstallProvider>
        <App />
      </PWAInstallProvider>
    </AuthProvider>
  </StrictMode>,
)
