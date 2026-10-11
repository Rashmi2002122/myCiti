import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { PWAInstallProvider } from './context/PWAInstallContext'
import { registerSW } from 'virtual:pwa-register'

// Register service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New myCiti version available.');
  },
  onOfflineReady() {
    console.log('myCiti is ready for offline use.');
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
