// lib/steady/scoring.ts — Brier + Edge pure, no SDK
// Must return "insufficient history" honestly

export type SettledCall = {
  priceProb: number; // entry price 0..1 (paid price per contract)
  won: boolean; // true if chosen outcome was winner, false if lost, null if void (exclude)
  void?: boolean;
};

export type Score = {
  n: number;
  wins: number;
  losses: number;
  brier: number | null; // null if <5 settled non-void
  edge: number | null; // winRate - avgPrice, null if <5
  winRate: number | null;
  avgPrice: number | null;
  sufficient: boolean;
  last5: (boolean | null)[]; // true win, false loss, null void
};

export function computeScore(calls: SettledCall[], minN: number = 5): Score {
  const settled = calls.filter((c) => !c.void);
  const n = settled.length;
  const sufficient = n >= minN;
  if (!sufficient) {
    return {
      n,
      wins: settled.filter((c) => c.won).length,
      losses: settled.filter((c) => !c.won).length,
      brier: null,
      edge: null,
      winRate: null,
      avgPrice: null,
      sufficient: false,
      last5: settled.slice(-5).map((c) => c.won),
    };
  }
  let brierSum = 0;
  let priceSum = 0;
  let wins = 0;
  for (const c of settled) {
    const outcome = c.won ? 1 : 0;
    brierSum += (c.priceProb - outcome) ** 2;
    priceSum += c.priceProb;
    if (c.won) wins++;
  }
  const brier = brierSum / n;
  const avgPrice = priceSum / n;
  const winRate = wins / n;
  const edge = winRate - avgPrice;
  return {
    n,
    wins,
    losses: n - wins,
    brier,
    edge,
    winRate,
    avgPrice,
    sufficient: true,
    last5: settled.slice(-5).map((c) => c.won),
  };
}

export function brierLabel(brier: number | null): string {
  if (brier === null) return "Need 5 settled";
  if (brier < 0.15) return "Sharp";
  if (brier < 0.25) return "Steady";
  if (brier < 0.33) return "Drifting";
  return "Tilting";
}
