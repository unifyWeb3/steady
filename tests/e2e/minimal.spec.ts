import { test, expect } from "@playwright/test";
test("minimal", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await page.waitForTimeout(2000);
  const title = await page.title();
  console.log("title", title);
  await expect(page.locator("body")).toContainText("STEADY");
  await page.screenshot({ path: "test-results/minimal.png", fullPage: true });
});
