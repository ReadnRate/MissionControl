interface Props {
  score: number | null;
  max?: number;
  color?: string;
  size?: "sm" | "md";
}

export function ScoreDots({ score, max = 5, color = "#22d3ee", size = "md" }: Props) {
  const dotSize = size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5";
  const value = score ?? 0;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`${dotSize} rounded-full transition-all`}
          style={{
            background: i < value ? color : "rgba(148, 163, 184, 0.25)",
            boxShadow: i < value ? `0 0 6px ${color}` : "none",
          }}
        />
      ))}
    </div>
  );
}
