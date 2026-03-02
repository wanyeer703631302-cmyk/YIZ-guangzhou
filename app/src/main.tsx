import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
    <Toaster position="top-center" richColors />
  </AuthProvider>
)
