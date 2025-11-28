import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import OfflineIndicator from './components/OfflineIndicator.jsx'
// import registerServiceWorker from './utils/registerServiceWorker'

// Register service worker for PWA (uncomment when icons are ready)
// registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
      <InstallPrompt />
      <OfflineIndicator />
    </HelmetProvider>
  </StrictMode>,
)
