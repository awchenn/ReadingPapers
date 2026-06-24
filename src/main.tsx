import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { debugEvent, installDebugInstrumentation } from './debug/instrumentation';
import './styles.css';

installDebugInstrumentation();
debugEvent('app', 'react-mount-start', { strictMode: true }, 'debug');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
