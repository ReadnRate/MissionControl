import type { FreshnessInfo } from "@/lib/flights/freshness";

const STYLES: Record<
  FreshnessInfo["level"],
  { bg: string; fg: string; dot: string; label: string }
> = {
  fresh: {
    bg: "bg-emerald-500/10",
    fg: "text-emerald-300",
    dot: "bg-emerald-400",
    label: "frais",
  },
  stale: {
    bg: "bg-amber-500/10",
    fg: "text-amber-300",
    dot: "bg-amber-400",
    label: "à vérifier",
  },
  old: {
    bg: "bg-rose-500/10",
    fg: "text-rose-300",
    dot: "bg-rose-400",
    label: "périmé",
  },
  none: {
    bg: "bg-slate-700/40",
    fg: "text-slate-400",
    dot: "bg-slate-500",
    label: "non vérifié",
  },
};

export function FreshnessBadge({ info }: { info: FreshnessInfo }) {
  const s = STYLES[info.level];
  const days = info.daysSince;
  const detail =
    info.level === "none"
      ? "aucune capture"
      : days === 0
        ? "vu aujourd'hui"
        : days === 1
          ? "vu hier"
          : `il y a ${days}j`;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-medium ${s.bg} ${s.fg}`}
      title={info.source ?? undefined}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span>prix {s.label}</span>
      <span className="opacity-70">· {detail}</span>
    </span>
  );
}
