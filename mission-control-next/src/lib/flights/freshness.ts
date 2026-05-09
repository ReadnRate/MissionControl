import type { PriceReference, FreshnessLevel } from "./types";
import { freshnessFor } from "./types";

export function pricesByOption(
  prices: PriceReference[],
): Record<number, PriceReference[]> {
  const m: Record<number, PriceReference[]> = {};
  for (const p of prices) {
    if (p.flight_option_id == null) continue;
    if (!m[p.flight_option_id]) m[p.flight_option_id] = [];
    m[p.flight_option_id].push(p);
  }
  return m;
}

export function daysSince(date: string): number {
  const then = new Date(date).getTime();
  const now = Date.now();
  return Math.floor((now - then) / 86_400_000);
}

export interface FreshnessInfo {
  level: FreshnessLevel;
  daysSince: number | null;
  lastObserved: string | null;
  source: string | null;
}

export function freshnessForOption(
  optionId: number,
  byOption: Record<number, PriceReference[]>,
): FreshnessInfo {
  const entries = byOption[optionId];
  if (!entries || entries.length === 0) {
    return { level: "none", daysSince: null, lastObserved: null, source: null };
  }
  const latest = entries.reduce((acc, p) =>
    new Date(p.date_observed) > new Date(acc.date_observed) ? p : acc,
  );
  const d = daysSince(latest.date_observed);
  return {
    level: freshnessFor(d),
    daysSince: d,
    lastObserved: latest.date_observed,
    source: latest.source,
  };
}
