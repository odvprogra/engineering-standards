import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// Browser mode, as Storybook's Vitest addon runs stories: the tests need a real Chromium.
export default defineConfig({
  test: {
    include: ["tests/*.test.ts"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
  },
});
