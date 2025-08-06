// This file contains polyfills to make Node.js-specific libraries work in the browser.

// Polyfill for 'fs' module to prevent AWS SDK from crashing in browser environments.
// This is a workaround for environments where the SDK incorrectly attempts to access
// the filesystem. It simulates a "file not found" error, which the SDK can handle
// gracefully, allowing it to proceed with the explicitly provided credentials.
// This is applied unconditionally to override any partial polyfills from the environment (e.g., unenv).

type Callback = (err: Error | null, data: null) => void;

const fsPolyfill = {
    // @ts-ignore
    readFile: (path: string, options: object | Callback, callback?: Callback) => {
        const cb = typeof options === 'function' ? options : callback;
        if (typeof cb !== 'function') {
            console.error("fs.readFile polyfill called without a callback.");
            return;
        }
        const err = new Error(`ENOENT: no such file or directory, open '${path}'`);
        // @ts-ignore
        err.code = 'ENOENT';
        // Defer the callback to simulate async I/O.
        setTimeout(() => cb(err, null), 0);
    },
    // @ts-ignore
    readFileSync: (path: string, options?: any) => {
        const err = new Error(`ENOENT: no such file or directory, open '${path}'`);
        // @ts-ignore
        err.code = 'ENOENT';
        throw err;
    },
};

// Forcefully override any existing 'fs' polyfill on the global object.
// @ts-ignore
globalThis.fs = fsPolyfill;

// Polyfill for 'process.env' to allow setting environment variables at runtime in the browser console.
// This is necessary for services that read credentials dynamically.
// We must attach it to `window` so it's globally available.
if (typeof (window as any).process === 'undefined') {
  (window as any).process = {};
}
if (typeof (window as any).process.env === 'undefined') {
  (window as any).process.env = {};
}
