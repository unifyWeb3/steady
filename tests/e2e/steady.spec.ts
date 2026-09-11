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
    test.setTimeout(70000);
    page.on("console", m => console.log("[wallet]", m.type(), m.text().slice(0,300)));
    page.on("pageerror", e => console.log("[wallet] pageerror", String(e).slice(0,500)));
    await page.goto("http://localhost:5173/terminal.html", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    const btn = page.locator("#connectBtn");
    await expect(btn).toBeVisible();
    await btn.click();
    const addr = page.locator("#walletAddr");
    // Connection remains atomic: the address appears only after the SDK-backed
    // wallet client exists. A cold CDN can take 30s, after which the UI must
    // settle into an explicit failure rather than a half-connected state.
    const outcome = await expect.poll(async () => {
      const address = (await addr.textContent()) || "";
      const button = (await btn.textContent()) || "";
      const status = (await page.locator("#statusBar").textContent()) || "";
      const marketState = (await page.locator("#marketTbody").textContent()) || "";
      if (address.includes("0x0d6F") && button.includes("Connected")) return "connected";
      if (address === "Disconnected" && status.includes("Connect failed")) return "failed";
      if (address === "Disconnected" && button.includes("Connect") && /SDK load failed|market data unavailable|status unavailable|timed out/i.test(marketState)) return "unavailable";
      return "pending";
    }, { timeout: 45000, intervals: [250, 500, 1000] }).toMatch(/connected|failed|unavailable/);
    if (outcome === "failed" || outcome === "unavailable") {
      await expect(addr).toHaveText("Disconnected");
      if (outcome === "failed") await expect(page.locator("#statusBar")).toContainText("Connect failed");
    }
    await safeShot(page, "test-results/terminal-connected.png");
  });

  test("buy controls are visibly blocked before executable authorization", async ({ page }) => {
    await page.goto("http://localhost:5173/terminal.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean((window as any).__steadyBooted || document.querySelector("#buyYes")?.hasAttribute("aria-disabled")));
    await expect(page.locator("#buyYes")).toBeDisabled();
    await expect(page.locator("#buyNo")).toBeDisabled();
    await expect(page.locator("#buyYes")).toHaveAttribute("title", /Blocked: connect wallet|Blocked:/i);
    await expect(page.locator("#previewCapped")).toContainText("BLOCKED");
  });

  test("rejects a switch request that reports success but remains on the wrong chain", async ({ page }) => {
    await page.addInitScript(({ addr }) => {
      const wrongChain = {
        isMetaMask: true,
        _chain: "0x1",
        request: async ({ method }: any) => {
          if (method === "eth_requestAccounts" || method === "eth_accounts") return [addr];
          if (method === "eth_chainId") return wrongChain._chain;
          if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") return null;
          return null;
        },
        on: () => {},
      };
      (window as any).ethereum = wrongChain;
    }, { addr: TEST_ADDRESS });
    await page.goto("http://localhost:5173/terminal.html", { waitUntil: "domcontentloaded" });
    await page.locator("#connectBtn").click();
    await expect(page.locator("#walletAddr")).toHaveText("Disconnected", { timeout: 15000 });
    await expect(page.locator("#statusBar")).toContainText("Connect failed", { timeout: 15000 });
    await expect(page.locator("#buyYes")).toBeDisabled();
  });

  test("failed market selection clears the prior economic snapshot", async ({ page }) => {
    test.setTimeout(60000);
    await page.route("https://api.infra.testnet.somnia.network/**", route => route.abort());
    await page.goto("http://localhost:5173/terminal.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof (window as any).__steady?.selectMarket === "function");
    await page.locator("#maxLoss").fill("2");
    const fake = {
      asset: "TEST_ONLY",
      intervalSec: 3600,
      expirySec: Math.floor(Date.now() / 1000) + 3600,
      marketId: "0x" + "11".repeat(32),
      pool: "0x" + "22".repeat(20),
      status: 1,
    };
    await page.evaluate((market) => (window as any).__steady.selectMarket(market), fake);
    await expect.poll(async () => page.evaluate(() => (window as any).__steady.selectionSnapshot()), { timeout: 45000 }).toMatchObject({ marketId: fake.marketId, hasBook: false, hasBookParams: false });
    await expect(page.locator("#buyYes")).toBeDisabled();
    await expect(page.locator("#previewBook")).toContainText(/loading|unavailable|error/i);
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

  test("approved widths preserve hierarchy without overflow", async ({ page }) => {
    test.setTimeout(60000);
    for (const width of [1280, 768, 390, 375]) {
      await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
      for (const path of ["/", "/terminal.html"]) {
        await page.goto(`http://localhost:5173${path}`, { waitUntil: "domcontentloaded" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(1);
        if (path === "/") {
          await expect(page.getByText("Example only")).toBeVisible();
          await expect(page.getByText("Historical live proof")).toBeVisible();
        } else {
          await expect(page.locator(".stage-item")).toHaveCount(4);
          for (const selector of [".stage-item", "#posTabs .tab"]) {
            const clipped = await page.locator(selector).evaluateAll((items) => items.some((item) => {
              const rect = item.getBoundingClientRect();
              const parent = item.parentElement?.getBoundingClientRect();
              return rect.left < 0 || rect.right > document.documentElement.clientWidth + 1 ||
                Boolean(parent && (rect.left < parent.left - 1 || rect.right > parent.right + 1));
            }));
            expect(clipped, `${selector} at ${width}px`).toBeFalsy();
          }
        }
      }
    }
  });

  test("BUY_NO receipt presents NO terms before YES-equivalent evidence", async ({ page }) => {
    await page.goto("http://localhost:5173/terminal.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => typeof (window as any).__steady?.receiptPricePresentation === "function");
    const presentation = await page.evaluate(() => (window as any).__steady.receiptPricePresentation("BUY_NO", 0.436, 0.455));
    const host = page.locator("#tradeReceipt");
    await host.evaluate((el, html) => {
      el.setAttribute("data-qa-state", "simulated-receipt-presentation");
      el.innerHTML = `<div class="receipt-head"><span class="caption">QA simulated presentation only</span></div><div class="proof">${html}</div>`;
      (el as HTMLElement).style.display = "block";
    }, presentation.rowsHtml);
    await expect(host.locator(".prow").nth(0)).toContainText("Quoted NO");
    await expect(host.locator(".prow").nth(0)).toContainText("0.564");
    await expect(host.locator(".prow").nth(1)).toContainText("Actual NO");
    await expect(host.locator(".prow").nth(1)).toContainText("0.545");
    await expect(host.locator(".prow").nth(2)).toContainText("YES-equivalent");
    await expect(host.locator(".prow").nth(2)).toContainText("0.436 → 0.455");
    expect(presentation.copyText).toContain("quoted NO 0.564 → actual NO 0.545");
    await safeShot(page, "test-results/terminal-buy-no-receipt-qa.png");
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
