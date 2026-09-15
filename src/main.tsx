// Iterator Helpers (Iterator.prototype.toArray/.map/.filter/...) only shipped in
// Safari 18.4 (March 2025) and Firefox 131 — react-data-grid calls .toArray() on a
// plain generator, which crashes the whole app with "toArray is not a function" on
// any older Safari/iOS. Must be the very first import so the prototype is patched
// before react-data-grid (or anything else) runs.
import 'core-js/actual/iterator';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
