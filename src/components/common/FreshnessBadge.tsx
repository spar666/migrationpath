import { cn } from "@/lib/utils";

export type FreshnessStatus = "current" | "review" | "stale";

const STYLES: Record<
  FreshnessStatus,
  { dot: string; chip: string; label: string }
> = {
  current: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Current",
  },
  review: {
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Review due",
  },
  stale: {
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-700 border-red-200",
    label: "Needs update",
  },
};

export function FreshnessDot({
  status,
  className,
}: {
  status: FreshnessStatus;
  className?: string;
}) {
  return (
    <span
      title={STYLES[status].label}
      className={cn(
        "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
        STYLES[status].dot,
        status === "stale" && "animate-pulse",
        className,
      )}
    />
  );
}

export function FreshnessBadge({
  status,
  daysSinceVerified,
  className,
}: {
  status: FreshnessStatus;
  daysSinceVerified?: number | null;
  className?: string;
}) {
  const s = STYLES[status];
  const suffix =
    daysSinceVerified == null
      ? " — never verified"
      : ` — verified ${daysSinceVerified}d ago`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        s.chip,
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", s.dot)} />
      {s.label}
      <span className="font-normal opacity-80">{suffix}</span>
    </span>
  );
}
