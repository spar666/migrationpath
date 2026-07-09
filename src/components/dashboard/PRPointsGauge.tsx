import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoostItem {
  label: string;
  points: number;
  completed: boolean;
}

const boostItems: BoostItem[] = [
  { label: "NAATI Certification", points: 5, completed: false },
  { label: "PTE Superior (79+)", points: 20, completed: true },
  { label: "Professional Year", points: 5, completed: false },
  { label: "Australian Study Requirement", points: 5, completed: true },
  { label: "Regional Study (+5)", points: 5, completed: false },
];

interface PRPointsGaugeProps {
  currentPoints?: number;
  maxPoints?: number;
}

export function PRPointsGauge({ currentPoints = 75, maxPoints = 100 }: PRPointsGaugeProps) {
  const percentage = (currentPoints / maxPoints) * 100;
  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
      {/* Circular Progress */}
      <div className="relative flex-shrink-0">
        <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            className="stroke-secondary"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            className="stroke-accent transition-all duration-1000 ease-out"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              animation: "gauge-fill 1.5s ease-out forwards",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-medium text-muted-foreground">Current PR Points</span>
          <span className="text-4xl font-bold text-foreground">{currentPoints}</span>
          <span className="text-sm text-muted-foreground">of {maxPoints}</span>
        </div>
      </div>

      {/* Boost Checklist */}
      <div className="flex-1 w-full max-w-md">
        <h3 className="text-lg font-semibold text-foreground mb-4">Boost Your Points</h3>
        <div className="space-y-3">
          {boostItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-colors",
                item.completed
                  ? "bg-accent/10 border-accent/20"
                  : "bg-card border-border hover:border-accent/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    item.completed ? "bg-accent" : "bg-secondary"
                  )}
                >
                  {item.completed ? (
                    <Check className="w-4 h-4 text-accent-foreground" />
                  ) : (
                    <Circle className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    item.completed ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold px-2 py-1 rounded-lg",
                  item.completed
                    ? "bg-accent/20 text-accent"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                +{item.points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
