import "@testing-library/jest-dom";

// Suppress noisy console.error in tests unless explicitly tested
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("[ErrorBoundary]")) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
