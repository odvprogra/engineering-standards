import { expect, test } from "@playwright/test";

// The journey reaches a service started from a compose file, as a web app's journeys reach its API.
test("the service started by compose answers in the browser", async ({ page }) => {
  await page.goto("/health/ready");

  await expect(page.locator("body")).toContainText('"status": "ok"');
});
