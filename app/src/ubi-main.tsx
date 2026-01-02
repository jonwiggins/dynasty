import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import UBIApp from './UBIApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UBIApp />
  </StrictMode>,
)
