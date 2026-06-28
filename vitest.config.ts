import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Minimal Vitest setup for the AURÉLLE unit + property tests.
 *
 * The `@/*` alias mirrors `tsconfig.json` so test files can import application
 * modules the same way the app does. Tests run in the Node environment because
 * the targeted logic (e.g. `recommendSize`) is pure and framework-free.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd()),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
});
