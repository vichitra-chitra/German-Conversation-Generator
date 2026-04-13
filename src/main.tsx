import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ padding: 20, fontFamily: 'monospace', color: 'red' }}>
      <h2>App crashed:</h2>
      <pre>{error.message}</pre>
      <pre>{error.stack}</pre>
    </div>
  );
}

class ErrorBoundary extends React.Component
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    return this.state.error 
      ? <ErrorFallback error={this.state.error} />
      : this.props.children;
  }
}

import React from 'react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
