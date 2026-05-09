"use client";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { TravelConstraint } from "@/lib/flights/types";

interface Props {
  constraints: TravelConstraint[];
}

export function ConstraintsPanel({ constraints }: Props) {
  const [show, setShow] = useState(false);

  const grouped = useMemo(() => {
    const g: Record<string, TravelConstraint[]> = {
      forbidden: [],
      allowed: [],
      preference: [],
    };
    constraints.forEach((c) => g[c.constraint_type]?.push(c));
    return g;
  }, [constraints]);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 backdrop-blur">
      <button
        onClick={() => setShow(!show)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-[10px] tracking-wider uppercase font-semibold text-cyan-400">
            règles du voyage
          </div>
          <div className="flex gap-2 text-xs">
            <Pill bg="bg-rose-500/10" fg="text-rose-300" icon={<ShieldAlert size={11} />}>
              {grouped.forbidden.length} interdits
            </Pill>
            <Pill bg="bg-emerald-500/10" fg="text-emerald-300" icon={<ShieldCheck size={11} />}>
              {grouped.allowed.length} permis
            </Pill>
            <Pill bg="bg-amber-500/10" fg="text-amber-300" icon={<Sparkles size={11} />}>
              {grouped.preference.length} préférences
            </Pill>
          </div>
        </div>
        {show ? (
          <ChevronUp size={16} className="text-slate-500" />
        ) : (
          <ChevronDown size={16} className="text-slate-500" />
        )}
      </button>

      {show && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px border-t border-slate-800/60 bg-slate-800/60">
          <Column title="✗ interdits" tone="rose" items={grouped.forbidden} />
          <Column title="✓ permis" tone="emerald" items={grouped.allowed} />
          <Column title="⌘ préférences" tone="amber" items={grouped.preference} />
        </div>
      )}
    </div>
  );
}

function Pill({
  bg,
  fg,
  icon,
  children,
}: {
  bg: string;
  fg: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`px-2 py-0.5 font-mono tracking-wider uppercase text-[10px] flex items-center gap-1 rounded ${bg} ${fg}`}
    >
      {icon}
      {children}
    </span>
  );
}

function Column({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "rose" | "emerald" | "amber";
  items: TravelConstraint[];
}) {
  const headerColor =
    tone === "rose"
      ? "text-rose-300"
      : tone === "emerald"
        ? "text-emerald-300"
        : "text-amber-300";
  return (
    <div className="bg-slate-900 p-4">
      <h4
        className={`text-[10px] tracking-wider uppercase font-bold mb-3 ${headerColor}`}
      >
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.id} className="text-xs">
            <div className="font-medium text-slate-200">{c.value}</div>
            {c.reason && (
              <div className="italic mt-0.5 text-slate-500">{c.reason}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
