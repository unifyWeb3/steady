// Browser-safe scoring domain. Binary fill prices arrive in YES terms.
export const ONE_6 = 1_000_000n;
export const MIN_SETTLED_CALLS = 5;

function rawBigInt(value, label) {
  try { return BigInt(value); } catch { throw new Error(`${label} is not a valid integer`); }
}

// Convert protocol YES probability into the probability of the traded outcome.
export function outcomeProbabilityFromYesPrice(fillPriceRaw, side) {
  const raw = rawBigInt(fillPriceRaw, "fill price");
  if (raw < 0n || raw > ONE_6) throw new Error("fill price must be within [0, 1]");
  if (side === "BUY_YES") return Number(raw) / 1e6;
  if (side === "BUY_NO") return Number(ONE_6 - raw) / 1e6;
  throw new Error(`Unsupported binary side ${String(side)}`);
}

export function settledCallFromFill({ fillPriceRaw, side, won, voided = false }) {
  return {
    priceProb: outcomeProbabilityFromYesPrice(fillPriceRaw, side),
    won: Boolean(won),
    void: Boolean(voided),
  };
}

export function computeScore(calls, minN = MIN_SETTLED_CALLS) {
  const settled = (Array.isArray(calls) ? calls : []).filter((call) => !call?.void);
  const n = settled.length;
  if (n < minN) {
    return {
      n,
      wins: settled.filter((call) => call.won).length,
      losses: settled.filter((call) => !call.won).length,
      brier: null,
      edge: null,
      winRate: null,
      avgPrice: null,
      sufficient: false,
      last5: settled.slice(-5).map((call) => call.won),
    };
  }
  let brierSum = 0;
  let priceSum = 0;
  let wins = 0;
  for (const call of settled) {
    const outcome = call.won ? 1 : 0;
    brierSum += (call.priceProb - outcome) ** 2;
    priceSum += call.priceProb;
    if (call.won) wins += 1;
  }
  const brier = brierSum / n;
  const avgPrice = priceSum / n;
  const winRate = wins / n;
  return { n, wins, losses: n - wins, brier, edge: winRate - avgPrice, winRate, avgPrice, sufficient: true, last5: settled.slice(-5).map((call) => call.won) };
}

export function brierLabel(brier) {
  if (brier === null || brier === undefined) return "Need 5 settled";
  if (brier < 0.15) return "Sharp";
  if (brier < 0.25) return "Steady";
  if (brier < 0.33) return "Drifting";
  return "Tilting";
}
