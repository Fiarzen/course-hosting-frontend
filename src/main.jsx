import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { LeavesCollectedProvider } from './context/LeavesCollectedContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <LeavesCollectedProvider>
        <App />
      </LeavesCollectedProvider>
    </AuthProvider>
  </React.StrictMode>,
)

