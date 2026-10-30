import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      // lcov is what the workflow uploads to Codecov.
      reporter: ["text", "lcov"],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
});
