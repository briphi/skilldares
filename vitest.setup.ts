import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 26 exposes inert `localStorage`/`sessionStorage` globals that shadow
// jsdom's. Force jsdom's working Storage onto globalThis so tests can use them.
const jsdomGlobal = (globalThis as { jsdom?: { window: Window } }).jsdom;
if (jsdomGlobal?.window) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: jsdomGlobal.window.localStorage,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: jsdomGlobal.window.sessionStorage,
    writable: true,
    configurable: true,
  });
}

// jsdom doesn't implement matchMedia. Stub it to always report
// prefers-reduced-motion: reduce so animation hooks (useCountUp,
// future motion hooks) snap to their final values in tests instead
// of running rAF loops. Individual tests can override via
// vi.stubGlobal('matchMedia', ...) when they need to exercise the
// animation path.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// RTL's auto-cleanup only fires when `globals: true`. We run with explicit
// globals off, so unmount each render between tests manually.
afterEach(() => {
  cleanup();
});
