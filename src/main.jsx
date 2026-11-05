import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// nes.css first so the app's own styles can override it.
import 'nes.css/css/nes.min.css'
import './index.css'
import App from './App.jsx'
import SoundProvider from './audio/SoundProvider.jsx'
import CrtProvider from './display/CrtProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SoundProvider>
        <CrtProvider>
          <App />
        </CrtProvider>
      </SoundProvider>
    </BrowserRouter>
  </StrictMode>,
)
