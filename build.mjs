import fs from "fs";
import path from "path";
import { getBrowserConfig } from "./lib/config/browser.js";

const appRoot = path.resolve("app");
const distRoot = path.resolve("dist");
fs.rmSync(distRoot, { recursive: true, force: true });
fs.mkdirSync(distRoot, { recursive: true });
for (const entry of fs.readdirSync(appRoot)) {
  fs.cpSync(path.join(appRoot, entry), path.join(distRoot, entry), { recursive: true });
}
const runtimeConfig = getBrowserConfig({
  NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  NEXT_PUBLIC_INDEXER_URL: process.env.NEXT_PUBLIC_INDEXER_URL,
  NEXT_PUBLIC_WS_RPC_URL: process.env.NEXT_PUBLIC_WS_RPC_URL,
  NEXT_PUBLIC_RPC_HTTP_URL: process.env.NEXT_PUBLIC_RPC_HTTP_URL,
});
fs.writeFileSync(
  path.join(distRoot, "runtime-config.js"),
  `globalThis.__STEADY_CONFIG = Object.freeze(${JSON.stringify(runtimeConfig)});\n`,
);
const browserModules = [
  "lib/steady/trade-intent.js",
  "lib/steady/scoring.js",
  "lib/steady/discipline.js",
  "lib/steady/fill-attribution.js",
  "lib/steady/trade-reconciliation.js",
  "lib/steady/position-state.js",
  "lib/steady/dom.js",
  "lib/steady/redemption-state.js",
  "lib/steady/request-generation.js",
  "lib/config/browser.js",
];
for (const relative of browserModules) {
  const source = path.resolve(relative);
  const target = path.join(distRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
console.log("build done");
