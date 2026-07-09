import { motion } from "framer-motion";
import { Zap, Clock, Shield, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriorityOccupationBadgeProps {
  occupation: string;
  sector: "healthcare" | "construction" | "it" | "other";
  processingDays?: number;
  isOnPriorityList?: boolean;
}

const sectorConfig = {
  healthcare: {
    label: "Healthcare",
    icon: Shield,
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/30",
    gradient: "from-accent/20 to-accent/5",
  },
  construction: {
    label: "Construction",
    icon: TrendingUp,
    color: "text-yellow-600",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    gradient: "from-yellow-500/20 to-yellow-500/5",
  },
  it: {
    label: "Technology",
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    gradient: "from-primary/20 to-primary/5",
  },
  other: {
    label: "General",
    icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    gradient: "from-muted to-muted/50",
  },
};

export function PriorityOccupationBadge({
  occupation,
  sector,
  processingDays = 7,
  isOnPriorityList = true,
}: PriorityOccupationBadgeProps) {
  const config = sectorConfig[sector];
  const SectorIcon = config.icon;

  if (!isOnPriorityList) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-2xl border p-5 bg-gradient-to-br",
        config.border,
        config.gradient
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            config.bg
          )}
        >
          <Zap className={cn("w-6 h-6", config.color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                config.bg,
                config.color
              )}
            >
              Fast-Track
            </span>
            <span className="text-xs text-muted-foreground">Priority Occupation</span>
          </div>
          <p className="font-semibold text-foreground">{occupation}</p>
          <p className="text-sm text-muted-foreground">{config.label} Sector</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2">
          <Clock className={cn("w-4 h-4", config.color)} />
          <span className="text-sm text-muted-foreground">Median processing</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-xl font-bold", config.color)}>{processingDays}</span>
          <span className="text-sm text-muted-foreground">days</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Your occupation is on the 2026 Priority Occupation List, qualifying you for expedited
        processing under the Skills in Demand framework.
      </p>
    </motion.div>
  );
}
