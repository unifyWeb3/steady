import { chromium } from "playwright-core";
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox","--disable-setuid-sandbox"] });
const BASE = "https://somnia-snowy.vercel.app";
async function shot(name, url, vp){
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e=>errs.push("pageerror:"+e.message.slice(0,150)));
  page.on("console", m=>{ if(m.type()==="error") errs.push("console:"+m.text().slice(0,150)); });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(6000);
  console.log(`[${name}] title:`, await page.title());
  console.log(`[${name}] errors:`, errs.length ? errs.slice(0,5) : "none");
  await page.screenshot({ path: `test-results/prod-${name}.png`, timeout: 10000 }).catch(e=>console.log(`[${name}] shot skipped`, e.message.slice(0,80)));
  await ctx.close();
}
await shot("home-1280", BASE+"/", { width:1280, height:800 });
await shot("home-375", BASE+"/", { width:375, height:812 });
await shot("terminal-1280", BASE+"/terminal", { width:1280, height:800 });
await shot("terminal-375", BASE+"/terminal", { width:375, height:812 });
await browser.close();
console.log("smoke done");
