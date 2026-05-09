import type { FlightSegment } from "@/lib/flights/types";

const COORDS: Record<string, { x: number; y: number; name: string }> = {
  CUN: { x: 26, y: 54, name: "Cancún" },
  MEX: { x: 24, y: 52, name: "Mexico" },
  YUL: { x: 30, y: 36, name: "Montréal" },
  YYZ: { x: 28, y: 38, name: "Toronto" },
  YVR: { x: 14, y: 36, name: "Vancouver" },
  CDG: { x: 49, y: 32, name: "Paris" },
  AMS: { x: 50, y: 30, name: "Amsterdam" },
  FRA: { x: 51, y: 32, name: "Frankfurt" },
  MUC: { x: 52, y: 34, name: "Munich" },
  ZRH: { x: 51, y: 33, name: "Zurich" },
  LHR: { x: 47, y: 30, name: "London" },
  IST: { x: 56, y: 38, name: "Istanbul" },
  DOH: { x: 60, y: 44, name: "Doha" },
  DXB: { x: 60, y: 46, name: "Dubai" },
  BKK: { x: 75, y: 52, name: "Bangkok" },
  KUL: { x: 75, y: 56, name: "KL" },
  HAN: { x: 77, y: 49, name: "Hanoi" },
  SGN: { x: 76, y: 54, name: "Saigon" },
  ICN: { x: 82, y: 41, name: "Seoul" },
  HND: { x: 86, y: 42, name: "Tokyo" },
  HKG: { x: 81, y: 48, name: "HK" },
  TPE: { x: 81, y: 49, name: "Taipei" },
  DAD: { x: 78, y: 52, name: "Da Nang" },
};

interface Props {
  segments: FlightSegment[];
  compact?: boolean;
}

export function FlightMap({ segments, compact = false }: Props) {
  const points: string[] = [];
  segments.forEach((s, i) => {
    if (i === 0) points.push(s.origin_airport);
    points.push(s.destination_airport);
  });

  const height = compact ? 140 : 220;

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-slate-800/60 bg-slate-950">
      <svg viewBox="0 0 100 60" className="relative w-full" style={{ height }}>
        <defs>
          <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="endpointGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g opacity="0.06" fill="#cbd5e1">
          <path d="M 5 18 Q 15 14 25 16 L 32 22 Q 35 30 32 38 L 25 45 Q 18 48 12 42 Z" />
          <path d="M 44 22 Q 52 20 56 24 L 58 32 Q 55 38 50 36 L 45 32 Z" />
          <path d="M 48 38 Q 54 38 56 44 L 56 54 Q 52 58 49 55 Z" />
          <path d="M 56 22 Q 70 18 82 22 L 86 32 Q 88 42 84 50 L 76 55 Q 68 56 62 50 L 58 40 Z" />
        </g>

        {points.map((p, i) => {
          if (i === 0) return null;
          const from = COORDS[points[i - 1]];
          const to = COORDS[p];
          if (!from || !to) return null;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2 - dist * 0.18;
          return (
            <path
              key={`route-${i}`}
              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="0.25"
              strokeDasharray="0.6 0.4"
              opacity="0.85"
            />
          );
        })}

        {Array.from(new Set(points)).map((p) => {
          const c = COORDS[p];
          if (!c) return null;
          const isEndpoint = points[0] === p || points[points.length - 1] === p;
          return (
            <g key={`airport-${p}`}>
              <circle
                cx={c.x}
                cy={c.y}
                r={isEndpoint ? 3.5 : 2.5}
                fill={isEndpoint ? "url(#endpointGlow)" : "url(#cityGlow)"}
              />
              <circle
                cx={c.x}
                cy={c.y}
                r={isEndpoint ? 0.9 : 0.6}
                fill={isEndpoint ? "#f59e0b" : "#22d3ee"}
              />
              {!compact && (
                <text
                  x={c.x}
                  y={c.y - 1.8}
                  fill="#e2e8f0"
                  fontSize="1.6"
                  textAnchor="middle"
                  fontFamily="ui-monospace, monospace"
                  fontWeight="600"
                >
                  {p}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
