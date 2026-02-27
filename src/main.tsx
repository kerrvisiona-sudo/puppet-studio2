// Suppress THREE.Clock deprecation warning emitted by @react-three/fiber internals.
// R3F 9.5.0 still uses THREE.Clock; remove this once R3F migrates to THREE.Timer.
const _origWarn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) return
  _origWarn(...args)
}

import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import './styles.css'
import './core/app-commanding/commandDefinitions' // Initialize command registry

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
