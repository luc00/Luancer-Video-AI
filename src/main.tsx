import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initPerformanceTracking } from './utils/webVitals';

if (import.meta.env.DEV) {
  initPerformanceTracking();
}

createRoot(document.getElementById('root')!).render(<App />);
