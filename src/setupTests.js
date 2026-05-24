import '@testing-library/jest-dom';

// jsdom 29 doesn't always expose a fully functional localStorage — provide a reliable in-memory mock.
const createStorage = () => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] ?? null,
  };
};

Object.defineProperty(globalThis, 'localStorage', { value: createStorage(), writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: createStorage(), writable: true });
