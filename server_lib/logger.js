export function createLogger(req) {
  // Extract the unique ID from the request header, or assign a default if not present.
  const testRunId = req.headers['x-test-run-id'] || 'no-test-id';
  
  return {
    log: (...args) => {
      // Prepend the ID to every log message.
      console.log(`[${testRunId}]`, ...args);
    },
    error: (...args) => {
      // Prepend the ID to every error message.
      console.error(`[${testRunId}]`, ...args);
    },
  };
}