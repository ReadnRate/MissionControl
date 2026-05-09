"use client";
import { useState } from "react";
import {
  Plane,
  Clock,
  MapPin,
  Heart,
  Shield,
  Luggage,
  AlertTriangle,
  Check,
  X,
  Star,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Phone,
  ExternalLink,
} from "lucide-react";
import type { FlightOption, FlightSegment } from "@/lib/flights/types";
import type { FreshnessInfo } from "@/lib/flights/freshness";
import { FlightMap } from "./FlightMap";
import { ScoreDots } from "./ScoreDots";
import { FreshnessBadge } from "./FreshnessBadge";

interface Props {
  option: FlightOption;
  segments: FlightSegment[];
  freshness: FreshnessInfo;
}

const RISK_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  faible: { bg: "bg-emerald-500/15", fg: "text-emerald-300", label: "risque faible" },
  moyen: { bg: "bg-amber-500/15", fg: "text-amber-300", label: "risque modéré" },
  eleve: { bg: "bg-rose-500/15", fg: "text-rose-300", label: "risque élevé" },
};

const MODIF_LABELS: Record<NonNullable<FlightOption["return_modifiable"]>, string> = {
  oui_gratuit: "✓ MODIFICATION GRATUITE",
  oui_avec_frais: "~ MODIFICATION AVEC FRAIS",
  non_modifiable: "❌ NON MODIFIABLE",
  depend_tarif: "⚡ DÉPEND DU TARIF",
  a_verifier: "? À VÉRIFIER",
};

export function OptionCard({ option, segments, freshness }: Props) {
  const [expanded, setExpanded] = useState(false);
  const risk = option.risk_level
    ? (RISK_STYLES[option.risk_level] ?? RISK_STYLES.faible)
    : RISK_STYLES.faible;

  const isNonModif = option.return_modifiable === "non_modifiable";

  return (
    <article
      className={`relative rounded-xl border bg-slate-900/60 transition-all ${
        option.is_recommended
          ? "border-cyan-500/40 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
          : "border-slate-800/60"
      }`}
    >
      {option.is_recommended && (
        <div className="absolute -top-3 left-6 px-3 py-1 text-[10px] tracking-wider uppercase font-bold flex items-center gap-1.5 rounded bg-cyan-500 text-slate-950">
          <Star size={10} fill="currentColor" />
          recommandée
        </div>
      )}

      <div className="p-5 md:p-7">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-mono text-xs tracking-wider uppercase text-slate-500">
                #{String(option.option_rank).padStart(2, "0")}
              </span>
              {option.recommendation_type && (
                <span className="text-[10px] tracking-wider uppercase font-medium text-slate-500">
                  {option.recommendation_type.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-xl md:text-2xl leading-tight text-slate-100">
              {option.option_name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs uppercase tracking-wider text-slate-400">
              <span>{option.airlines.join(" · ")}</span>
              {option.alliance && (
                <>
                  <span className="text-cyan-400">·</span>
                  <span className="italic">{option.alliance}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-left md:text-right shrink-0">
            <div className="font-mono text-[10px] tracking-wider uppercase mb-1 text-slate-500">
              cad
            </div>
            <div className="flex items-baseline gap-1 md:justify-end">
              {option.price_cad_confirmed ? (
                <span className="text-4xl md:text-5xl font-light tabular-nums text-cyan-400">
                  {option.price_cad_confirmed.toLocaleString()}
                </span>
              ) : (
                <>
                  <span className="text-2xl md:text-3xl font-light tabular-nums text-slate-100">
                    {option.price_cad_min.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-500">–</span>
                  <span className="text-2xl md:text-3xl font-light tabular-nums text-slate-100">
                    {option.price_cad_max.toLocaleString()}
                  </span>
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap md:justify-end gap-2">
              <FreshnessBadge info={freshness} />
              {option.price_cad_confirmed && (
                <span className="text-[10px] tracking-wider uppercase font-medium text-emerald-300">
                  ✓ confirmé
                </span>
              )}
            </div>
            {option.return_date_note && (
              <div className="text-[10px] tracking-wider uppercase font-medium mt-1 text-cyan-300">
                retour : {option.return_date_note}
              </div>
            )}
          </div>
        </div>

        <FlightMap segments={segments} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-5 bg-slate-800/60 rounded-lg overflow-hidden">
          <Stat
            icon={<Clock size={11} />}
            label="durée"
            value={`${option.total_duration_hours}h`}
          />
          <Stat
            icon={<MapPin size={11} />}
            label="escales"
            value={String(option.num_stops)}
          />
          <Stat
            icon={<Heart size={11} />}
            label="confort dos"
            custom={<ScoreDots score={option.back_pain_score} color="#f472b6" />}
          />
          <Stat
            icon={<Shield size={11} />}
            label="fiabilité"
            custom={<ScoreDots score={option.reliability_score} color="#34d399" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Badge bg={risk.bg} fg={risk.fg}>
            {risk.label}
          </Badge>
          {option.trip_type === "round_trip" ? (
            <Badge bg="bg-cyan-500/15" fg="text-cyan-300">
              ⇄ aller-retour
            </Badge>
          ) : (
            <Badge bg="bg-amber-500/10" fg="text-amber-300">
              → aller simple
            </Badge>
          )}
          <Badge bg="bg-slate-700/40" fg="text-slate-300">
            {option.ticket_type === "single_pnr"
              ? "1 billet"
              : option.ticket_type === "multi_pnr"
                ? `${option.airlines.length} billets`
                : option.ticket_type === "separate_tickets"
                  ? "billets séparés"
                  : option.ticket_type === "combo"
                    ? "combo"
                    : "self-transfer"}
          </Badge>
          {option.baggage_23kg_included && (
            <Badge bg="bg-slate-700/40" fg="text-emerald-300" icon={<Luggage size={10} />}>
              23 kg inclus
            </Badge>
          )}
          {option.has_largebody_longhaul && (
            <Badge bg="bg-slate-950" fg="text-slate-200">
              large-body long-courrier
            </Badge>
          )}
          {isNonModif && (
            <Badge
              bg="bg-rose-500/15"
              fg="text-rose-300"
              icon={<AlertTriangle size={10} />}
            >
              non modifiable
            </Badge>
          )}
          {option.return_modifiable === "depend_tarif" && (
            <Badge bg="bg-amber-500/10" fg="text-amber-300">
              modif. selon tarif
            </Badge>
          )}
        </div>

        {option.recommended_dates && (
          <div className="mt-4 pt-4 border-t border-dashed border-slate-800/60">
            <div className="text-[10px] tracking-wider uppercase font-medium mb-1.5 text-slate-500">
              dates recommandées
            </div>
            <div className="font-mono text-sm text-slate-200">
              {option.recommended_dates}
            </div>
            {option.operating_days && (
              <div className="text-xs mt-1 italic text-slate-500">
                {option.operating_days}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-800/60 hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all text-xs tracking-wider uppercase font-medium text-slate-300"
        >
          {expanded ? (
            <>
              réduire <ChevronUp size={14} />
            </>
          ) : (
            <>
              itinéraire complet · avantages · alertes <ChevronDown size={14} />
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-5 pt-5 border-t border-dashed border-slate-800/60 space-y-5">
            <div>
              <h4 className="text-xs tracking-wider uppercase font-medium mb-3 flex items-center gap-2 text-cyan-300">
                <Plane size={12} /> itinéraire détaillé
              </h4>
              <div className="space-y-3">
                {segments.map((s) => (
                  <SegmentRow key={s.id} segment={s} />
                ))}
              </div>
            </div>

            {option.advantages && option.advantages.length > 0 && (
              <ListBlock
                title="avantages"
                tone="emerald"
                icon={<Check size={12} />}
                items={option.advantages}
                marker="+"
              />
            )}

            {option.disadvantages && option.disadvantages.length > 0 && (
              <ListBlock
                title="inconvénients"
                tone="rose"
                icon={<X size={12} />}
                items={option.disadvantages}
                marker="−"
              />
            )}

            {option.warnings && option.warnings.length > 0 && (
              <div className="p-4 border-l-2 border-rose-500 bg-rose-500/5 rounded-r-lg">
                <h4 className="text-xs tracking-wider uppercase font-bold mb-2 flex items-center gap-2 text-rose-300">
                  <AlertTriangle size={12} /> attention
                </h4>
                <ul className="space-y-1.5">
                  {option.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-slate-200">
                      ⚠ {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {option.notes && (
              <div className="text-xs italic pt-3 border-t border-dashed border-slate-800/60 text-slate-400">
                {option.notes}
              </div>
            )}

            {(option.return_modifiable || option.change_policy_notes) && (
              <div
                className={`p-4 rounded-lg border-l-2 ${
                  isNonModif
                    ? "bg-rose-500/5 border-rose-500"
                    : "bg-amber-500/5 border-amber-500"
                }`}
              >
                <h4
                  className={`text-xs tracking-wider uppercase font-bold mb-2 flex items-center gap-2 ${
                    isNonModif ? "text-rose-300" : "text-amber-300"
                  }`}
                >
                  {isNonModif ? "⚠ Modification" : "↻ Politique de modification"}
                </h4>
                {option.return_modifiable && (
                  <div className="text-xs font-mono uppercase tracking-wider font-bold mb-2 text-slate-200">
                    {MODIF_LABELS[option.return_modifiable]}
                  </div>
                )}
                {option.change_fee_estimate && (
                  <div className="text-sm mb-1.5 text-slate-200">
                    <span className="font-medium">Frais estimés :</span>{" "}
                    {option.change_fee_estimate}
                  </div>
                )}
                {option.change_policy_notes && (
                  <div className="text-sm italic text-slate-400">
                    {option.change_policy_notes}
                  </div>
                )}
              </div>
            )}

            {option.booking_url && (
              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href={option.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase font-medium transition-colors bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                >
                  réserver <ExternalLink size={12} />
                </a>
                {option.booking_phone && (
                  <a
                    href={`tel:${option.booking_phone.replace(/[^0-9+]/g, "")}`}
                    className="inline-flex items-center gap-2 border border-slate-700 px-4 py-2.5 rounded-lg text-xs tracking-wider uppercase font-medium transition-colors text-slate-200 hover:bg-slate-800"
                  >
                    <Phone size={12} /> {option.booking_phone}
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function Stat({
  icon,
  label,
  value,
  custom,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  custom?: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase mb-2 text-slate-500">
        {icon} {label}
      </div>
      {custom ?? (
        <div className="font-mono text-lg tabular-nums text-slate-100">{value}</div>
      )}
    </div>
  );
}

function Badge({
  bg,
  fg,
  icon,
  children,
}: {
  bg: string;
  fg: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`text-[10px] tracking-wider uppercase px-2 py-1 font-medium flex items-center gap-1 rounded ${bg} ${fg}`}
    >
      {icon}
      {children}
    </span>
  );
}

function SegmentRow({ segment: s }: { segment: FlightSegment }) {
  return (
    <div className="relative pl-5 pb-3 border-l border-dashed border-slate-700">
      <div className="absolute -left-[5px] top-1 w-2 h-2 bg-cyan-400 rounded-sm" />
      <div className="flex flex-wrap items-baseline gap-2 mb-1">
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-200 border border-slate-700">
          {s.airline_code}
          {s.flight_number ?? ""}
        </span>
        <span className="font-medium text-sm text-slate-200">{s.airline_name}</span>
      </div>
      <div className="flex items-center gap-2 text-base mb-1">
        <span className="font-mono font-bold text-slate-100">{s.origin_airport}</span>
        <ArrowRight size={14} className="text-slate-500" />
        <span className="font-mono font-bold text-slate-100">{s.destination_airport}</span>
        {s.duration_hours && (
          <span className="text-xs ml-auto font-mono text-slate-500">
            {s.duration_hours}h
          </span>
        )}
      </div>
      <div className="text-xs flex items-center flex-wrap gap-2 mb-1 text-slate-400">
        {s.aircraft_type && <span>{s.aircraft_type}</span>}
        {s.aircraft_category && (
          <span
            className={`text-[9px] tracking-wider uppercase font-bold ${
              s.aircraft_category === "large-body" ? "text-emerald-300" : "text-amber-300"
            }`}
          >
            {s.aircraft_category}
          </span>
        )}
      </div>
      {(s.departure_time || s.arrival_time) && (
        <div className="text-xs font-mono text-slate-500">
          {s.departure_time && `dép. ${s.departure_time}`}
          {s.arrival_time && ` · arr. ${s.arrival_time}`}
        </div>
      )}
      {s.layover_after_hours && (
        <div className="mt-2 text-xs italic p-2 rounded bg-slate-800/60 text-amber-200">
          ↓ escale {s.layover_after_hours}h
          {s.layover_notes ? ` · ${s.layover_notes}` : ""}
        </div>
      )}
    </div>
  );
}

function ListBlock({
  title,
  tone,
  icon,
  items,
  marker,
}: {
  title: string;
  tone: "emerald" | "rose";
  icon: React.ReactNode;
  items: string[];
  marker: string;
}) {
  const color = tone === "emerald" ? "text-emerald-300" : "text-rose-300";
  return (
    <div>
      <h4
        className={`text-xs tracking-wider uppercase font-medium mb-2 flex items-center gap-2 ${color}`}
      >
        {icon} {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-sm flex items-start gap-2 text-slate-200"
          >
            <span className={`mt-0.5 font-bold ${color}`}>{marker}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
