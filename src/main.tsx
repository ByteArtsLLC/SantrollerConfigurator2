import ReactDOM from 'react-dom/client';

async function start() {
  // The desktop app needs navigator.hid in place before the app (and its store) is loaded
  if ('isTauri' in window) {
    const { installDesktop } = await import('./desktop');
    await installDesktop();
  }
  const { default: App } = await import('./App');
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
}

void start();
