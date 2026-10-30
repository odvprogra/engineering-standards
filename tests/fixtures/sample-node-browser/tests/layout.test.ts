import { expect, test } from "vitest";

// Layout exists only in a real browser: jsdom and happy-dom report every box as 0 × 0.
test("runs in a browser that lays out the page", () => {
  const box = document.createElement("div");
  box.style.width = "120px";
  box.style.height = "40px";
  document.body.append(box);

  expect(box.getBoundingClientRect()).toMatchObject({ width: 120, height: 40 });
  expect(navigator.userAgent).toMatch(/Chrome/);
});
