import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "on",
    video: "retain-on-failure",
  },
  webServer: {
    command: "node serve.mjs",
    url: "http://localhost:5173/",
    reuseExistingServer: true,
    timeout: 15000,
  },
});
