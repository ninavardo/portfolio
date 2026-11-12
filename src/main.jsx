import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/unbounded/500.css'
import '@fontsource/unbounded/700.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/noto-sans-georgian/500.css'
import '@fontsource/noto-sans-georgian/700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
