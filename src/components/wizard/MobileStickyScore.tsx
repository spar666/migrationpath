import { motion, AnimatePresence } from "framer-motion";
import { Award, TrendingUp, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
interface MobileStickyScoreProps {
  totalPoints: number;
  targetScore: number;
  breakdown: any;
  currentStep: number;
  totalSteps: number;
}



export function MobileStickyScore({ 
  totalPoints, 
  targetScore,
  breakdown, 
  currentStep, 
  totalSteps 
}: MobileStickyScoreProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPremium = totalPoints >= targetScore;
  const isCompetitive = totalPoints >= 65;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      {/* Expanded Breakdown Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-card border-t border-border overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-luxury text-primary/70">
                Points Breakdown
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(breakdown).map(([key, value]) => (
                  <div
                    key={key}
                    className={cn(
                      "p-3 rounded-lg text-center",
                      (value as number) > 0 ? "bg-accent/15 border border-accent/25" : "bg-muted/50 border border-border/50"
                    )}
                  >
                    <p className={cn(
                       "text-lg font-bold",
                       (value as number) > 0 ? "text-accent" : "text-muted-foreground"
                    )}>
                      +{(value as number)}
                    </p>
                    <p className={cn(
                      "text-xs font-medium truncate capitalize",
                      (value as number) > 0 ? "text-accent" : "text-muted-foreground"
                    )}>
                      {key}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sticky Bar */}
      <div className={cn(
        "border-t shadow-lg backdrop-blur-sm",
        isPremium 
          ? "gradient-gold border-accent/30" 
          : "bg-card/95 border-border"
      )}>
        {/* Progress Bar */}
        <div className="h-1 bg-muted/50">
          <motion.div
            className={cn(
              "h-full",
              isPremium ? "bg-navy" : "bg-accent"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          {/* Score Display */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3"
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isPremium 
                ? "bg-primary/15" 
                : isCompetitive 
                  ? "gradient-navy" 
                  : "bg-muted"
            )}>
              {isPremium ? (
                <Award className="w-6 h-6 text-primary" />
              ) : (
                <TrendingUp className={cn(
                  "w-6 h-6",
                  isCompetitive ? "text-primary-foreground" : "text-muted-foreground"
                )} />
              )}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={totalPoints}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className={cn(
                      // Mobile: 20px+ for readability
                      "text-xl font-bold tabular-nums",
                      isPremium ? "text-primary" : "text-foreground"
                    )}
                    style={{ fontSize: '20px' }}
                  >
                    {totalPoints}
                  </motion.span>
                </AnimatePresence>
                <span className={cn(
                  "text-sm font-semibold",
                  isPremium ? "text-primary/80" : "text-muted-foreground"
                )}>
                  pts
                </span>
              </div>
              <p className={cn(
                "text-xs font-medium",
                isPremium ? "text-primary/70" : "text-muted-foreground"
              )}>
                {isPremium ? "Premium Score" : isCompetitive ? "Competitive" : "Keep going"}
              </p>
            </div>
          </button>

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isPremium 
                ? "bg-navy/10 hover:bg-navy/20" 
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <ChevronUp className={cn(
              "w-5 h-5 transition-transform",
              isExpanded && "rotate-180",
              isPremium ? "text-navy" : "text-muted-foreground"
            )} />
          </button>

          {/* Step Indicator */}
          <div className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold",
            isPremium 
              ? "bg-navy/10 text-navy" 
              : "bg-primary/10 text-primary"
          )}>
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
