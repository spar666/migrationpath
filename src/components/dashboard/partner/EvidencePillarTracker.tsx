import { motion } from "framer-motion";
import { DollarSign, Home, Users, Heart, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EvidencePillar {
  id: string;
  label: string;
  icon: typeof DollarSign;
  percentage: number;
  items: { label: string; completed: boolean }[];
  color: string;
}

interface EvidencePillarTrackerProps {
  financialProgress?: number;
  householdProgress?: number;
  socialProgress?: number;
  commitmentProgress?: number;
}

export function EvidencePillarTracker({
  financialProgress = 75,
  householdProgress = 50,
  socialProgress = 100,
  commitmentProgress = 33,
}: EvidencePillarTrackerProps) {
  const pillars: EvidencePillar[] = [
    {
      id: "financial",
      label: "Financial",
      icon: DollarSign,
      percentage: financialProgress,
      color: "text-accent",
      items: [
        { label: "Joint bank account", completed: true },
        { label: "Shared expenses", completed: true },
        { label: "Joint loans/mortgages", completed: financialProgress >= 100 },
      ],
    },
    {
      id: "household",
      label: "Household",
      icon: Home,
      percentage: householdProgress,
      color: "text-primary",
      items: [
        { label: "Shared lease/ownership", completed: householdProgress >= 50 },
        { label: "Utility bills", completed: householdProgress >= 100 },
      ],
    },
    {
      id: "social",
      label: "Social",
      icon: Users,
      percentage: socialProgress,
      color: "text-glacier-dark",
      items: [
        { label: "Joint photos", completed: true },
        { label: "Family declarations", completed: socialProgress >= 50 },
        { label: "Friends' statements", completed: socialProgress >= 100 },
      ],
    },
    {
      id: "commitment",
      label: "Commitment",
      icon: Heart,
      percentage: commitmentProgress,
      color: "text-destructive",
      items: [
        { label: "12+ months together", completed: commitmentProgress >= 33 },
        { label: "Future plans evidence", completed: commitmentProgress >= 66 },
        { label: "Marriage/ceremony docs", completed: commitmentProgress >= 100 },
      ],
    },
  ];

  const overallProgress = Math.round(
    pillars.reduce((acc, p) => acc + p.percentage, 0) / pillars.length
  );

  const isReady = pillars.every((p) => p.percentage >= 50);

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <div
        className={cn(
          "rounded-xl p-4 border",
          isReady
            ? "bg-accent/10 border-accent/30"
            : "bg-amber-500/10 border-amber-500/30"
        )}
      >
        <div className="flex items-center gap-3">
          {isReady ? (
            <CheckCircle2 className="w-5 h-5 text-accent" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500" />
          )}
          <div className="flex-1">
            <p className={cn("font-semibold", isReady ? "text-accent" : "text-amber-600")}>
              {isReady ? "Evidence pillars looking strong!" : "Some pillars need more evidence"}
            </p>
            <p className="text-sm text-muted-foreground">
              Overall progress: {overallProgress}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Pillar Grid with Circular Progress */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {pillars.map((pillar, index) => {
          const Icon = pillar.icon;
          const circumference = 2 * Math.PI * 40;
          const strokeDashoffset = circumference * (1 - pillar.percentage / 100);

          return (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
            >
              {/* Circular Progress Ring */}
              <div className="relative w-24 h-24 mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    className={cn(
                      pillar.percentage >= 75
                        ? "stroke-accent"
                        : pillar.percentage >= 50
                        ? "stroke-primary"
                        : "stroke-amber-500"
                    )}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Icon className={cn("w-5 h-5 mb-0.5", pillar.color)} />
                  <span className="text-lg font-bold text-foreground">
                    {pillar.percentage}%
                  </span>
                </div>
              </div>

              <p className="font-semibold text-sm text-foreground text-center">
                {pillar.label}
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {pillar.items.filter((i) => i.completed).length}/{pillar.items.length} items
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Evidence Checklist
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="p-4 rounded-xl border border-border bg-card/50"
            >
              <p className="font-medium text-foreground mb-2 flex items-center gap-2">
                <pillar.icon className={cn("w-4 h-4", pillar.color)} />
                {pillar.label}
              </p>
              <div className="space-y-1.5">
                {pillar.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center",
                        item.completed ? "bg-accent" : "bg-muted"
                      )}
                    >
                      {item.completed && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className={cn(
                        item.completed
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Button variant="gold" className="w-full">
        Upload Marriage Certificate
      </Button>
    </div>
  );
}
