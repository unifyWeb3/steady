// lib/steady/discipline.ts - typed facade for the shipped browser helper

import {
  deriveDiscipline as deriveDisciplineBrowser,
  shouldBlockForCooldown as shouldBlockForCooldownBrowser,
} from "./discipline.js";

export type DisciplineState = {
  consecutiveLosses: number;
  cooldownUntilMs: number | null; // epoch ms, null if not cooling
  cooldownKey?: string | null;
  blocked: boolean;
  reason?: string;
  resumeInSec?: number;
};

export type DisciplineCall = {
  won: boolean;
  void?: boolean;
  voided?: boolean;
  eventKey?: string;
  fillId?: string;
  id?: string;
  txHash?: string;
  timestamp?: string | number;
  blockNumber?: string | number;
  logIndex?: string | number;
};

export function deriveDiscipline(
  calls: DisciplineCall[],
  nowMs: number = Date.now(),
  existingCooldownMs: number | null = null,
  lastCooldownKey: string | null = null,
): DisciplineState {
  return deriveDisciplineBrowser(calls, nowMs, existingCooldownMs, lastCooldownKey) as DisciplineState;
}

export function shouldBlockForCooldown(
  calls: DisciplineCall[],
  cooldownUntilMs: number | null,
  nowMs = Date.now(),
  lastCooldownKey: string | null = null,
): boolean {
  return shouldBlockForCooldownBrowser(calls, cooldownUntilMs, nowMs, lastCooldownKey);
}
