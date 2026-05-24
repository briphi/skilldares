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
