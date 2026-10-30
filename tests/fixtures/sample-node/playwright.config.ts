import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    // sample-web's compose stack, started by the workflow before the journeys.
    baseURL: "http://localhost:8000",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
