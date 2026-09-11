// Safe rendering helpers for untrusted indexer and wallet values.
export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function isHexHash(value) {
  return /^0x[0-9a-fA-F]{64}$/.test(String(value || ""));
}

export function safeExplorerTx(value) {
  return isHexHash(value)
    ? `https://shannon-explorer.somnia.network/tx/${String(value)}`
    : "https://shannon-explorer.somnia.network";
}
