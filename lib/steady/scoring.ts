// lib/steady/scoring.ts — Brier + Edge pure, no SDK
// Must return "insufficient history" honestly
import { computeScore as computeScoreBrowser, brierLabel as brierLabelBrowser } from "./scoring.js";

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
  return computeScoreBrowser(calls, minN) as Score;
}

export function brierLabel(brier: number | null): string {
  return brierLabelBrowser(brier);
}
