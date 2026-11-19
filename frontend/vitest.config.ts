import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: [".", "../coverage-index"] } },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts", "../coverage-index/tools/vitest-tests-setup.mjs"],
    reporters: ["default", "../coverage-index/tools/vitest-tests-reporter.mjs"],
    coverage: {
      reportOnFailure: true,
      provider: "istanbul",
      include: ["src/**"],
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "../coverage/js",
      thresholds: { 100: true },
    },
  },
});
