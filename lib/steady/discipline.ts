// lib/steady/discipline.ts — 2-loss cooldown pure

export type DisciplineState = {
  consecutiveLosses: number;
  cooldownUntilMs: number | null; // epoch ms, null if not cooling
  blocked: boolean;
  reason?: string;
  resumeInSec?: number;
};

const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes per 19-mvp-spec
const LOSS_THRESHOLD = 2;

export function deriveDiscipline(calls: { won: boolean; void?: boolean }[], nowMs: number = Date.now(), existingCooldownMs: number | null = null): DisciplineState {
  // count trailing losses ignoring voids
  const settled = calls.filter((c) => !c.void);
  let streak = 0;
  for (let i = settled.length - 1; i >= 0; i--) {
    if (!settled[i].won) streak++;
    else break;
  }
  // if already cooling, keep it
  if (existingCooldownMs !== null && existingCooldownMs > nowMs) {
    return {
      consecutiveLosses: streak,
      cooldownUntilMs: existingCooldownMs,
      blocked: true,
      reason: `${streak} consecutive losses — cooldown active`,
      resumeInSec: Math.ceil((existingCooldownMs - nowMs) / 1000),
    };
  }
  if (streak >= LOSS_THRESHOLD) {
    const until = nowMs + COOLDOWN_MS;
    return {
      consecutiveLosses: streak,
      cooldownUntilMs: until,
      blocked: true,
      reason: `${streak} consecutive losses — 3 min cooldown`,
      resumeInSec: COOLDOWN_MS / 1000,
    };
  }
  return { consecutiveLosses: streak, cooldownUntilMs: null, blocked: false };
}

export function shouldBlockForCooldown(calls: { won: boolean; void?: boolean }[], cooldownUntilMs: number | null, nowMs = Date.now()): boolean {
  if (cooldownUntilMs && cooldownUntilMs > nowMs) return true;
  const d = deriveDiscipline(calls, nowMs, cooldownUntilMs);
  return d.blocked;
}
