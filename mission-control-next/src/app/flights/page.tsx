"use client";
import { useMemo, useState } from "react";
import { Plane, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useFlightData } from "@/lib/flights/useFlightData";
import { freshnessForOption, pricesByOption } from "@/lib/flights/freshness";
import { OptionCard } from "@/components/flights/OptionCard";
import { ConstraintsPanel } from "@/components/flights/ConstraintsPanel";
import { TripComparator } from "@/components/flights/TripComparator";
import type { FlightSearchOrigin, FlightTripType } from "@/lib/flights/types";

type OriginFilter = "all" | FlightSearchOrigin;
type TripFilter = "all" | FlightTripType;

export default function FlightsPage() {
  const {
    options,
    segments,
    prices,
    constraints,
    loading,
    error,
    lastRefresh,
    refresh,
    realtimeConnected,
  } = useFlightData();
  const [origin, setOrigin] = useState<OriginFilter>("all");
  const [trip, setTrip] = useState<TripFilter>("all");
  const [hideNonModifiable, setHideNonModifiable] = useState(false);

  const filtered = useMemo(() => {
    let result = options;
    if (origin !== "all") result = result.filter((o) => o.search_origin === origin);
    if (trip !== "all")
      result = result.filter((o) => (o.trip_type ?? "one_way") === trip);
    if (hideNonModifiable)
      result = result.filter((o) => o.return_modifiable !== "non_modifiable");
    return result;
  }, [options, origin, trip, hideNonModifiable]);

  const segmentsByOption = useMemo(() => {
    const m: Record<number, typeof segments> = {};
    for (const s of segments) {
      if (!m[s.flight_option_id]) m[s.flight_option_id] = [];
      m[s.flight_option_id].push(s);
    }
    return m;
  }, [segments]);

  const priceRefsByOption = useMemo(() => pricesByOption(prices), [prices]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const mins = filtered.map((o) => o.price_cad_confirmed ?? o.price_cad_min);
    const maxs = filtered.map((o) => o.price_cad_max);
    const durations = filtered.map((o) => Number(o.total_duration_hours) || 0);
    return {
      count: filtered.length,
      minPrice: Math.min(...mins),
      maxPrice: Math.max(...maxs),
      avgDuration: Math.round(
        durations.reduce((a, b) => a + b, 0) / Math.max(durations.length, 1),
      ),
    };
  }, [filtered]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Plane size={28} className="text-cyan-400 mx-auto animate-pulse" />
          <div className="font-mono text-xs tracking-wider uppercase text-slate-500 mt-3">
            chargement des dossiers de vol
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="font-mono text-sm text-rose-400">erreur : {error}</div>
      </div>
    );
  }

  const sectionsToShow = (Object.keys({ CUN_YUL: 0, CUN: 0, YUL: 0 }) as Array<
    "CUN_YUL" | "CUN" | "YUL"
  >).filter(
    (key) =>
      (origin === "all" || origin === key) &&
      filtered.some((o) => o.search_origin === key),
  );

  const SECTION_META: Record<
    "CUN_YUL" | "CUN" | "YUL",
    { title: string; subtitle: string; code: string }
  > = {
    CUN_YUL: {
      title: "Positionnement",
      subtitle: "vol de",
      code: "CUN → YUL",
    },
    CUN: { title: "Cancún", subtitle: "depuis", code: "CUN → DAD" },
    YUL: { title: "Montréal", subtitle: "depuis", code: "YUL → DAD" },
  };

  return (
    <div className="min-h-screen px-6 py-8 md:px-10 md:py-10 space-y-8">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Plane size={16} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-wider uppercase text-cyan-400">
              dossier de vol · été 2026
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-100">
              De l&apos;Amérique au Vietnam
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono tracking-wider uppercase text-slate-400">
          <span>été 2026</span>
          <span className="text-cyan-400">·</span>
          <span>budget &lt; 2 500 cad</span>
          <span className="text-cyan-400">·</span>
          <span>arrivée da nang (dad)</span>
          <span className="text-cyan-400">·</span>
          <span className="text-rose-400">aucun transit usa</span>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="options" value={stats.count} accent />
            <Stat
              label="prix min"
              value={stats.minPrice.toLocaleString()}
              suffix="cad"
            />
            <Stat
              label="prix max"
              value={stats.maxPrice.toLocaleString()}
              suffix="cad"
            />
            <Stat label="durée moy." value={`${stats.avgDuration}h`} />
          </div>
        )}
      </header>

      <div className="sticky top-0 z-20 -mx-6 md:-mx-10 px-6 md:px-10 py-3 backdrop-blur bg-slate-900/80 border-b border-slate-800/60 flex flex-wrap items-center gap-x-4 gap-y-3">
        <FilterGroup
          label="origine"
          value={origin}
          onChange={setOrigin}
          options={[
            { id: "all", label: "Tout", count: options.length },
            {
              id: "CUN_YUL",
              label: "CUN→YUL",
              count: options.filter((o) => o.search_origin === "CUN_YUL").length,
            },
            {
              id: "CUN",
              label: "Cancún→DAD",
              count: options.filter((o) => o.search_origin === "CUN").length,
            },
            {
              id: "YUL",
              label: "Montréal→DAD",
              count: options.filter((o) => o.search_origin === "YUL").length,
            },
          ]}
        />
        <FilterGroup
          label="type"
          value={trip}
          onChange={setTrip}
          options={[
            { id: "all", label: "Tous", count: options.length },
            {
              id: "one_way",
              label: "Aller simple",
              count: options.filter((o) => (o.trip_type ?? "one_way") === "one_way")
                .length,
            },
            {
              id: "round_trip",
              label: "Aller-retour",
              count: options.filter((o) => o.trip_type === "round_trip").length,
            },
          ]}
        />
        <button
          onClick={() => setHideNonModifiable((v) => !v)}
          className={`text-[10px] tracking-wider uppercase font-medium px-3 py-1.5 rounded border transition-colors ${
            hideNonModifiable
              ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200"
              : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
          }`}
        >
          masquer non modifiables
        </button>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden md:flex items-center gap-1.5 text-[10px] tracking-wider uppercase font-mono text-slate-500">
            {realtimeConnected ? (
              <>
                <Wifi size={10} className="text-emerald-400" />
                <span className="text-emerald-400">live</span>
              </>
            ) : (
              <>
                <WifiOff size={10} className="text-slate-500" />
                <span>polling</span>
              </>
            )}
            <span className="ml-2">
              maj :{" "}
              {lastRefresh.toLocaleTimeString("fr-CA", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </span>
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] tracking-wider uppercase font-medium rounded border border-slate-700 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
          >
            <RefreshCw size={11} />
            rafraîchir
          </button>
        </div>
      </div>

      <ConstraintsPanel constraints={constraints} />

      <div className="rounded-xl border-l-2 border-amber-500 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="text-xl">⚠️</div>
          <div>
            <h3 className="text-sm font-semibold mb-1 text-amber-200">
              Attention : USD ≠ CAD
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Les prix sur Google Flights, Expedia et Skyscanner sont souvent en{" "}
              <strong>USD</strong> par défaut. <strong>1 USD ≈ 1,36 CAD</strong>{" "}
              (mai 2026), donc <strong>1 700 USD = 2 312 CAD</strong>. Les prix
              affichés ici sont en CAD via aircanada.com/en-ca.
            </p>
          </div>
        </div>
      </div>

      <TripComparator options={options} />

      {sectionsToShow.map((key) => {
        const meta = SECTION_META[key];
        return (
          <Section
            key={key}
            title={meta.title}
            subtitle={meta.subtitle}
            code={meta.code}
          >
            {filtered
              .filter((o) => o.search_origin === key)
              .map((o) => (
                <OptionCard
                  key={o.id}
                  option={o}
                  segments={segmentsByOption[o.id] ?? []}
                  freshness={freshnessForOption(o.id, priceRefsByOption)}
                />
              ))}
          </Section>
        );
      })}

      <footer className="pt-6 border-t border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-sm italic text-slate-400">bon voyage ✈</div>
        <div className="font-mono text-[10px] tracking-wider uppercase text-slate-500">
          data live · supabase · {options.length} options · {segments.length}{" "}
          segments · {constraints.length} contraintes · {prices.length} prix
        </div>
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/60 p-4">
      <div className="text-[10px] tracking-wider uppercase mb-1 text-slate-500">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <div
          className={`text-2xl md:text-3xl font-light tabular-nums ${
            accent ? "text-cyan-400" : "text-slate-100"
          }`}
        >
          {value}
        </div>
        {suffix && (
          <div className="font-mono text-[10px] tracking-wider uppercase text-slate-500">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  code,
  children,
}: {
  title: string;
  subtitle: string;
  code: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-4 mb-5 pb-3 border-b border-slate-800/60">
        <h2 className="text-2xl md:text-3xl font-semibold leading-none text-slate-100">
          <span className="italic text-cyan-400">{subtitle}</span> {title}
        </h2>
        <span className="font-mono text-xs tracking-wider uppercase ml-auto text-slate-500">
          {code}
        </span>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function FilterGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<{ id: T; label: string; count: number }>;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[10px] tracking-wider uppercase font-bold text-slate-500">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`px-2.5 py-1 text-[10px] tracking-wider uppercase font-medium transition-colors rounded border ${
              value === opt.id
                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200"
                : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
            }`}
          >
            {opt.label}
            <span className="opacity-60 ml-1.5 font-mono">[{opt.count}]</span>
          </button>
        ))}
      </div>
    </div>
  );
}
