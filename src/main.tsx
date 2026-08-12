import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './app/index.css';

// Registrar service worker para PWA (ruta relativa para GitHub Pages)
if ('serviceWorker' in navigator) {
navigator.serviceWorker.register('sw.js').catch((error) => {
    console.log('SW registration failed:', error);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
