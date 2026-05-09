import type { FlightOption } from "./types";

export type StrategyKind = "direct_cun" | "two_ticket_via_yul" | "from_yul";

export interface TripStrategy {
  key: string;
  kind: StrategyKind;
  label: string;
  legs: FlightOption[];
  totalMin: number;
  totalMax: number;
  totalConfirmed: number | null;
  durationHours: number;
  modifiability: "all_modifiable" | "mixed" | "non_modifiable" | "unknown";
  largeBodyAllLongHaul: boolean;
  ticketCount: number;
  notes: string | null;
}

function aggModif(legs: FlightOption[]): TripStrategy["modifiability"] {
  const set = new Set(legs.map((l) => l.return_modifiable ?? "a_verifier"));
  if (set.has("non_modifiable") && set.size === 1) return "non_modifiable";
  if (set.has("non_modifiable")) return "mixed";
  if (
    [...set].every(
      (v) => v === "oui_gratuit" || v === "oui_avec_frais" || v === "depend_tarif",
    )
  ) {
    return "all_modifiable";
  }
  return "unknown";
}

function priceFor(o: FlightOption): { min: number; max: number; confirmed: number | null } {
  return {
    min: o.price_cad_min,
    max: o.price_cad_max,
    confirmed: o.price_cad_confirmed,
  };
}

function durationOf(o: FlightOption): number {
  return Number(o.total_duration_hours) || 0;
}

export function computeStrategies(options: FlightOption[]): TripStrategy[] {
  const cunDirect = options.filter((o) => o.search_origin === "CUN");
  const cunToYul = options
    .filter((o) => o.search_origin === "CUN_YUL" && o.trip_type !== "round_trip")
    .sort((a, b) => a.price_cad_min - b.price_cad_min);
  const yulToDad = options.filter((o) => o.search_origin === "YUL");
  const cunYulCombos = options.filter(
    (o) => o.search_origin === "CUN_YUL" && o.trip_type === "round_trip",
  );

  const out: TripStrategy[] = [];

  for (const o of cunDirect) {
    const p = priceFor(o);
    out.push({
      key: `direct-${o.id}`,
      kind: "direct_cun",
      label: o.option_name,
      legs: [o],
      totalMin: p.min,
      totalMax: p.max,
      totalConfirmed: p.confirmed,
      durationHours: durationOf(o),
      modifiability: aggModif([o]),
      largeBodyAllLongHaul: !!o.has_largebody_longhaul,
      ticketCount: o.ticket_type === "single_pnr" ? 1 : (o.airlines?.length ?? 1),
      notes: o.notes,
    });
  }

  const bestCunYul = cunToYul[0];
  if (bestCunYul) {
    for (const yul of yulToDad) {
      const total = priceFor(yul);
      const cy = priceFor(bestCunYul);
      out.push({
        key: `combo-${bestCunYul.id}-${yul.id}`,
        kind: "two_ticket_via_yul",
        label: `${bestCunYul.option_name} + ${yul.option_name}`,
        legs: [bestCunYul, yul],
        totalMin: total.min + cy.min,
        totalMax: total.max + cy.max,
        totalConfirmed:
          total.confirmed != null && cy.confirmed != null
            ? total.confirmed + cy.confirmed
            : null,
        durationHours: durationOf(bestCunYul) + durationOf(yul),
        modifiability: aggModif([bestCunYul, yul]),
        largeBodyAllLongHaul:
          !!bestCunYul.has_largebody_longhaul && !!yul.has_largebody_longhaul,
        ticketCount: 2,
        notes: yul.notes,
      });
    }
  }

  for (const c of cunYulCombos) {
    const p = priceFor(c);
    out.push({
      key: `pre-combo-${c.id}`,
      kind: "two_ticket_via_yul",
      label: c.option_name,
      legs: [c],
      totalMin: p.min,
      totalMax: p.max,
      totalConfirmed: p.confirmed,
      durationHours: durationOf(c),
      modifiability: aggModif([c]),
      largeBodyAllLongHaul: !!c.has_largebody_longhaul,
      ticketCount: 2,
      notes: c.notes,
    });
  }

  out.sort((a, b) => a.totalMin - b.totalMin);
  return out;
}
