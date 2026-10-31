import { Component, type ErrorInfo, type ReactNode } from 'react'; import { createRoot } from 'react-dom/client'; import App from './App'; import './styles.css';

class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
 state = { failed: false };
 static getDerivedStateFromError() { return { failed: true }; }
 componentDidCatch(error: Error, info: ErrorInfo) { console.error('Error de interfaz', error, info); }
 render() { return this.state.failed ? <main className="crash-screen"><h1>Algo salió mal</h1><p>La página tuvo un problema inesperado.</p><button className="btn" onClick={() => location.reload()}>Recargar página</button></main> : this.props.children; }
}

createRoot(document.getElementById('root')!).render(<AppBoundary><App /></AppBoundary>);

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(error => console.warn('No se pudo activar el modo sin conexión', error)));
