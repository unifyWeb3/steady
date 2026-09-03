// lib/steady/ticket.ts — honest max-loss math, pure, no SDK
// Must be deterministic and testable

export type TicketInput = {
  maxLossHuman: number; // tUSDC human (e.g. 25.00) — the only input Steady asks for
  entryPriceProb: number; // 0..1 (e.g. 0.55)
  tickRaw: bigint; // 1000 on 6-dec
  lotRaw: bigint;
  minQtyRaw: bigint;
  availableBalanceRaw: bigint; // tUSDC raw 1e6
  bookDepthRaw?: bigint; // max quantity available at price (raw lots)
};

export type Ticket = {
  payRaw: bigint; // escrow raw tUSDC (qty * price)
  payoutRaw: bigint; // if win: qty * 1e6
  profitRaw: bigint;
  quantityRaw: bigint; // lot-snapped contracts
  quantityHuman: number;
  entryPriceRaw: bigint;
  entryPriceProb: number;
  maxLossRaw: bigint;
  maxLossHuman: number;
  tickSnapped: boolean;
  cappedBy: "balance" | "depth" | "none";
};

const ONE_6 = 1_000_000n;

export function computeTicket(inp: TicketInput): Ticket | { error: string } {
  if (inp.maxLossHuman <= 0) return { error: "Enter max loss >0" };
  if (inp.entryPriceProb <= 0 || inp.entryPriceProb >= 1) return { error: "Price must be (0,1)" };
  const priceRaw = BigInt(Math.round(inp.entryPriceProb * Number(ONE_6)));
  const snapppedPrice = (priceRaw / inp.tickRaw) * inp.tickRaw;
  if (snapppedPrice <= 0n || snapppedPrice >= ONE_6) return { error: `Price ${snapppedPrice} out of range after tick snap` };
  const maxLossRaw = BigInt(Math.round(inp.maxLossHuman * Number(ONE_6)));
  // max quantity from maxLoss: qty = maxLoss / price (BOY_YES pays price per contract)
  let qtyFromLoss = (maxLossRaw * ONE_6) / snapppedPrice; // keep 6-dec
  // But tUSDC raw: qtyRaw is lots where 1 contract = 1e6? On 6-dec, 1 contract raw qty = 1_000_000? No lot 1000 means 0.001. Need mapping: quantityRaw is lots (1000 per 0.001). So qty contracts = qtyRaw /1e6
  // Simpler: treat quantityRaw as lots directly: qty lots = floor(qtyFromLoss raw /1e6 *? ) — keep integer lots
  // qtyFromLoss is in raw contracts (1e6 =1 contract). Convert to lots: lot=1000 => qtyLots = qtyFromLoss /lot *lot
  let qtyRaw = (qtyFromLoss / inp.lotRaw) * inp.lotRaw;
  let cappedBy: Ticket["cappedBy"] = "none";
  // cap by balance: balance / price
  const qtyFromBalRaw = (inp.availableBalanceRaw * ONE_6) / snapppedPrice;
  const qtyBalSnapped = (qtyFromBalRaw / inp.lotRaw) * inp.lotRaw;
  if (qtyBalSnapped < qtyRaw) {
    qtyRaw = qtyBalSnapped;
    cappedBy = "balance";
  }
  // cap by depth if provided
  if (inp.bookDepthRaw !== undefined) {
    const depthSnapped = (inp.bookDepthRaw / inp.lotRaw) * inp.lotRaw;
    if (depthSnapped < qtyRaw) {
      qtyRaw = depthSnapped;
      cappedBy = "depth";
    }
  }
  if (qtyRaw < inp.minQtyRaw) return { error: `Quantity ${Number(qtyRaw)/1e6} below min ${Number(inp.minQtyRaw)/1e6} — increase max loss or price too high` };
  if (qtyRaw === 0n) return { error: "Quantity rounds to 0 after lot snap — increase max loss" };
  // pay = qty * price /1e6
  const payRaw = (qtyRaw * snapppedPrice) / ONE_6;
  const payoutRaw = qtyRaw; // 1 tUSDC per contract if win (raw = qtyRaw since 1 contract =1e6)
  const profitRaw = payoutRaw - payRaw;
  return {
    payRaw,
    payoutRaw,
    profitRaw,
    quantityRaw: qtyRaw,
    quantityHuman: Number(qtyRaw) / 1e6,
    entryPriceRaw: snapppedPrice,
    entryPriceProb: Number(snapppedPrice) / 1e6,
    maxLossRaw,
    maxLossHuman: inp.maxLossHuman,
    tickSnapped: snapppedPrice !== priceRaw,
    cappedBy,
  };
}

export function formatTicket(t: Ticket): string {
  return `Pay ${(Number(t.payRaw)/1e6).toFixed(2)} → win ${(Number(t.payoutRaw)/1e6).toFixed(2)} if chosen outcome (profit +${(Number(t.profitRaw)/1e6).toFixed(2)}), max loss ${(Number(t.payRaw)/1e6).toFixed(2)}`;
}
