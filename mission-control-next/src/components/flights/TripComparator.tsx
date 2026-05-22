"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Plane, Tag } from "lucide-react";
import type { FlightOption } from "@/lib/flights/types";
import { computeStrategies, type TripStrategy } from "@/lib/flights/comparator";

const KIND_LABEL: Record<TripStrategy["kind"], string> = {
  direct_cun: "Direct depuis Cancún",
  two_ticket_via_yul: "Via Montréal (2 billets)",
  from_yul: "Depuis Montréal",
};

const KIND_TONE: Record<TripStrategy["kind"], string> = {
  direct_cun: "bg-cyan-500/10 text-cyan-300",
  two_ticket_via_yul: "bg-violet-500/10 text-violet-300",
  from_yul: "bg-amber-500/10 text-amber-300",
};

const MODIF_TONE: Record<TripStrategy["modifiability"], { label: string; cls: string }> = {
  all_modifiable: {
    label: "modifiable",
    cls: "bg-emerald-500/10 text-emerald-300",
  },
  mixed: { label: "partiel", cls: "bg-amber-500/10 text-amber-300" },
  non_modifiable: { label: "figé", cls: "bg-rose-500/10 text-rose-300" },
  unknown: { label: "à vérifier", cls: "bg-slate-700/40 text-slate-400" },
};

interface Props {
  options: FlightOption[];
}

export function TripComparator({ options }: Props) {
  const [onlyModifiable, setOnlyModifiable] = useState(false);
  const [onlyLargeBody, setOnlyLargeBody] = useState(false);

  const strategies = useMemo(() => computeStrategies(options), [options]);

  const filtered = useMemo(
    () =>
      strategies.filter((s) => {
        if (onlyModifiable && s.modifiability === "non_modifiable") return false;
        if (onlyLargeBody && !s.largeBodyAllLongHaul) return false;
        return true;
      }),
    [strategies, onlyModifiable, onlyLargeBody],
  );

  const cheapest = filtered[0]?.totalMin;

  return (
    <section className="rounded-xl border border-slate-800/60 bg-slate-900/40">
      <header className="p-5 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Comparateur trip total
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total CAD pour rejoindre Da Nang. Combinaisons 2 billets calculées
            automatiquement à partir du meilleur CUN→YUL.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle on={onlyModifiable} setOn={setOnlyModifiable}>
            Exclure non modifiables
          </Toggle>
          <Toggle on={onlyLargeBody} setOn={setOnlyLargeBody}>
            Long-courrier large-body uniquement
          </Toggle>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-wider uppercase text-slate-500 border-b border-slate-800/60">
              <th className="text-left p-3 font-medium">Stratégie</th>
              <th className="text-left p-3 font-medium">Trajet</th>
              <th className="text-right p-3 font-medium">Prix CAD</th>
              <th className="text-right p-3 font-medium">Durée</th>
              <th className="text-left p-3 font-medium">Modif.</th>
              <th className="text-left p-3 font-medium">Avion</th>
              <th className="text-right p-3 font-medium">Billets</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const isCheapest = s.totalMin === cheapest;
              const modif = MODIF_TONE[s.modifiability];
              return (
                <tr
                  key={s.key}
                  className="border-b border-slate-800/30 hover:bg-slate-800/30"
                >
                  <td className="p-3">
                    <span
                      className={`inline-block text-[10px] tracking-wider uppercase font-medium px-2 py-0.5 rounded ${KIND_TONE[s.kind]}`}
                    >
                      {KIND_LABEL[s.kind]}
                    </span>
                  </td>
                  <td className="p-3 text-slate-200 max-w-md">
                    <div className="font-medium">{s.label}</div>
                    {s.legs.length > 1 && (
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        {s.legs.map((leg, i) => (
                          <span key={leg.id} className="flex items-center gap-1.5">
                            <Plane size={10} />
                            <span className="font-mono">
                              {leg.airlines.join("/")}
                            </span>
                            {i < s.legs.length - 1 && (
                              <ArrowRight size={10} className="opacity-50" />
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {s.totalConfirmed ? (
                      <div className="text-cyan-400 text-base font-light">
                        {s.totalConfirmed.toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-slate-100">
                        {s.totalMin.toLocaleString()}
                        <span className="text-slate-500 mx-1">–</span>
                        {s.totalMax.toLocaleString()}
                      </div>
                    )}
                    {isCheapest && (
                      <div className="inline-flex items-center gap-1 text-[10px] tracking-wider uppercase text-emerald-300 mt-1">
                        <Tag size={9} /> meilleur prix
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums text-slate-300">
                    {s.durationHours ? `${s.durationHours}h` : "..."}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block text-[10px] tracking-wider uppercase font-medium px-2 py-0.5 rounded ${modif.cls}`}
                    >
                      {modif.label}
                    </span>
                  </td>
                  <td className="p-3">
                    {s.largeBodyAllLongHaul ? (
                      <span className="text-[10px] tracking-wider uppercase text-emerald-300">
                        large-body
                      </span>
                    ) : (
                      <span className="text-[10px] tracking-wider uppercase text-amber-300">
                        mixte
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right text-slate-300">
                    {s.ticketCount}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="p-6 text-center text-slate-500 text-sm italic"
                >
                  Aucune stratégie ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Toggle({
  on,
  setOn,
  children,
}: {
  on: boolean;
  setOn: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => setOn(!on)}
      className={`text-[10px] tracking-wider uppercase font-medium px-3 py-1.5 rounded border transition-colors ${
        on
          ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200"
          : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}
