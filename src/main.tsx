import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import html2canvas from 'html2canvas';
import App from './App.tsx';
import './index.css';

// Attach html2canvas globally for receipt photo capture
(window as any).html2canvas = html2canvas;

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}


