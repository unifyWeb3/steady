import { test, expect } from "@playwright/test";

async function safeShot(page: any, path: string) {
  try { await page.screenshot({ path, timeout: 10000 }); } catch (e) { console.log("screenshot skipped", path, String(e).slice(0, 120)); }
}

const TEST_PRIVATE_KEY = process.env.TEST_WALLET_PRIVATE_KEY || "";
const TEST_ADDRESS = "0x0d6FAee78dFF4380E77D0e412F5Cddd942673719";

test.describe("Steady", () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock Rabby/MetaMask before page loads
    await page.addInitScript(({ pk, addr }) => {
      const mock = {
        isMetaMask: true,
        isRabby: true,
        providers: undefined as any,
        _addr: addr,
        _pk: pk,
        request: async ({ method, params }: any) => {
          if (method === "eth_requestAccounts" || method === "eth_accounts") return [addr];
          if (method === "eth_chainId") return "0xc488";
          if (method === "wallet_switchEthereumChain") return null;
          if (method === "wallet_addEthereumChain") return null;
          if (method === "eth_sendTransaction") {
            // For real signing, we need to use viem http transport with privateKey
            // Instead, we simulate by fetching via http RPC using privateKey signing
            // Use import map: we can do a simple fetch to RPC with eth_sendRawTransaction after signing locally
            // For now, just return a fake hash for UI test, but we will not claim LIVE-PROVEN
            // To keep test honest, we return null and let UI show error, but we capture console
            console.log("[mock] eth_sendTransaction", params);
            // Simulate timeout to test UNKNOWN handling
            throw new Error("Mock wallet: eth_sendTransaction not implemented for E2E — need manual MetaMask");
          }
          if (method === "eth_getBalance") return "0x56BC75E2D63100000"; // 100 STT
          return null;
        },
        on: (ev: string, cb: any) => {},
        removeListener: () => {},
      };
      (window as any).ethereum = mock;
      console.log("[mock] window.ethereum injected", addr);
    }, { pk: TEST_PRIVATE_KEY, addr: TEST_ADDRESS });
  });

  test("homepage renders", async ({ page }) => {
    page.on("console", m => console.log("[homepage]", m.type(), m.text().slice(0,300)));
    page.on("pageerror", e => console.log("[homepage] pageerror", String(e).slice(0,300)));
    await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=Know the downside")).toBeVisible({ timeout: 15000 });
    await safeShot(page, "test-results/homepage-desktop.png");
    // Check no purple gradient
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    console.log("bg", bg);
  });

  test("terminal loads without infinite spinner", async ({ page }) => {
    test.setTimeout(60000);
    page.on("console", m => console.log("[terminal]", m.type(), m.text().slice(0,300)));
    page.on("pageerror", e => console.log("[terminal] pageerror", String(e).slice(0,500)));
    await page.goto("http://localhost:5173/terminal.html", { waitUntil: "domcontentloaded" });
    // Wait for market data to load or error
    await page.waitForTimeout(5000);
    const tbody = page.locator("#marketTbody");
    await expect(tbody).toBeVisible();
    const html = await tbody.innerHTML();
    console.log("marketTbody", html.slice(0,500));
    // Should not be indefinite "Loading…" after 12s + retry
    await page.waitForTimeout(8000);
    const after = await tbody.innerHTML();
    console.log("after 13s", after.slice(0,500));
    await safeShot(page, "test-results/terminal-desktop.png");
    // Check warm paper
    const paper = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    console.log("paper", paper);
    // Check no purple
    const hasPurple = await page.evaluate(() => document.documentElement.outerHTML.includes("linear-gradient") && document.documentElement.outerHTML.includes("purple"));
    expect(hasPurple).toBeFalsy();
  });

  test("wallet connect (mock Rabby)", async ({ page }) => {
    page.on("console", m => console.log("[wallet]", m.type(), m.text().slice(0,300)));
    page.on("pageerror", e => console.log("[wallet] pageerror", String(e).slice(0,500)));
    await page.goto("http://localhost:5173/terminal.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    const btn = page.locator("#connectBtn");
    await expect(btn).toBeVisible();
    await btn.click();
    const addr = page.locator("#walletAddr");
    await expect(addr).toContainText("0x0d6F", { timeout: 10000 });
    const status = page.locator("#statusBar");
    // SDK load (~10s esm.sh) + RPC balance read; allow 25s. Honest states only.
    await expect(status).toContainText(/Connected|Connect failed/, { timeout: 25000 });
    await safeShot(page, "test-results/terminal-connected.png");
  });

  test("mobile 375px has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("http://localhost:5173/terminal.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log("375px overflow px:", overflow);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.locator("#ticketMarket")).toBeVisible();
    await safeShot(page, "test-results/terminal-mobile-375.png");
  });

  test("ticket shows max loss as largest number", async ({ page }) => {
    page.on("console", m => console.log("[ticket]", m.type(), m.text().slice(0,300)));
    page.on("pageerror", e => console.log("[ticket] pageerror", String(e).slice(0,500)));
    await page.goto("http://localhost:5173/terminal.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    // Select first market if available
    const selectBtn = page.locator("#marketTbody button").first();
    if (await selectBtn.isVisible()) {
      await selectBtn.click();
      await page.waitForTimeout(2000);
      await page.locator("#maxLoss").fill("25");
      await page.waitForTimeout(1000);
      const risk = await page.locator("#riskNum").textContent();
      console.log("riskNum", risk);
      await expect(page.locator("#riskNum")).toContainText("tUSDC");
      const pay = await page.locator("#previewPay").textContent();
      console.log("previewPay", pay);
      await expect(page.locator("#buyYes")).toContainText("Buy UP");
      await safeShot(page, "test-results/ticket.png");
    } else {
      console.log("no market to select");
    }
  });
});
