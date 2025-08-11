import 'dotenv/config';

// Mock window.import.meta.env for tests
if (typeof window === 'undefined') {
  Object.defineProperty(global, 'window', {
    value: {},
    writable: true,
  });
}

if (typeof window.import === 'undefined') {
  Object.defineProperty(window, 'import', {
    value: {},
    writable: true,
  });
}

if (typeof window.import.meta === 'undefined') {
  Object.defineProperty(window.import, 'meta', {
    value: {},
    writable: true,
  });
}

Object.defineProperty(window.import.meta, 'env', {
  value: process.env,
  writable: true,
  configurable: true,
});