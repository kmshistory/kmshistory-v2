import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './shared/styles/globals.css' // Material Icons, Font Awesome, 커스텀 클래스 (dark-gradient-bg 등)
import './index.css' // Tailwind CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
