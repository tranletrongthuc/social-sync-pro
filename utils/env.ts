export const getEnv = (key: string): string | undefined => {
  // For browser/Vite environment
  if (typeof window !== 'undefined' && (window as any).import && (window as any).import.meta && (window as any).import.meta.env) {
    return (window as any).import.meta.env[key];
  }
  // Fallback for Node.js environment (e.g., Jest tests)
  // This assumes that if running in Node.js, environment variables might be directly accessible
  // or mocked on `process.env` or a global mock object.
  // For Jest, we've set up `global.import_meta_env_mock` in jest.setup.js
  if (typeof global !== 'undefined' && (global as any).import_meta_env_mock) {
    return (global as any).import_meta_env_mock[key];
  }
  return undefined;
};