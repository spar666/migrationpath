import { Check, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
  name: string;
  percentage: number;
  description: string;
  completed?: boolean;
}

interface PaymentMilestonesProps {
  totalAmount: number;
  milestones: Milestone[];
  currentMilestone: number;
}

export function PaymentMilestones({
  totalAmount,
  milestones,
  currentMilestone,
}: PaymentMilestonesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Payment Plan</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
          Flexible Milestones
        </span>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone, index) => {
          const amount = Math.round((totalAmount * milestone.percentage) / 100);
          const isActive = index === currentMilestone;
          const isCompleted = index < currentMilestone;

          return (
            <div
              key={milestone.name}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all",
                isActive
                  ? "border-primary bg-primary/5"
                  : isCompleted
                  ? "border-accent bg-accent/5"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isCompleted
                      ? "bg-accent"
                      : isActive
                      ? "bg-primary"
                      : "bg-secondary"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-accent-foreground" />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{milestone.name}</h4>
                    <span
                      className={cn(
                        "text-sm font-medium px-2 py-0.5 rounded-lg",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {milestone.percentage}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {milestone.description}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    ${amount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < milestones.length - 1 && (
                <div className="absolute left-[1.9rem] top-full w-0.5 h-3 bg-border -translate-x-1/2" />
              )}
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="pt-2">
        <p className="text-xs text-center text-muted-foreground">
          Pay in stages as your application progresses
        </p>
      </div>
    </div>
  );
}
