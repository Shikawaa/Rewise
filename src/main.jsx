import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ConfigProvider } from 'antd'
import frFR from 'antd/locale/fr_FR'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={frFR}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
