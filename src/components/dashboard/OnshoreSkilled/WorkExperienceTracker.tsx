import { motion } from "framer-motion";
import { Clock, Calendar, TrendingUp, CheckCircle2, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ExperienceMilestone {
  years: number;
  points: number;
  achieved: boolean;
  daysRemaining?: number;
}

interface WorkExperienceTrackerProps {
  australianExperienceMonths?: number;
  overseasExperienceYears?: number;
  startDate?: Date;
}

export function WorkExperienceTracker({
  australianExperienceMonths = 8,
  overseasExperienceYears = 3,
  startDate = new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000),
}: WorkExperienceTrackerProps) {
  const milestones: ExperienceMilestone[] = [
    { years: 1, points: 5, achieved: australianExperienceMonths >= 12 },
    { years: 3, points: 10, achieved: australianExperienceMonths >= 36 },
    { years: 5, points: 15, achieved: australianExperienceMonths >= 60 },
    { years: 8, points: 20, achieved: australianExperienceMonths >= 96 },
  ];

  // Find next milestone
  const nextMilestone = milestones.find((m) => !m.achieved);
  const currentProgress = nextMilestone
    ? (australianExperienceMonths / (nextMilestone.years * 12)) * 100
    : 100;

  // Calculate days until next milestone
  const daysUntilNextMilestone = nextMilestone
    ? Math.max(0, nextMilestone.years * 12 * 30 - australianExperienceMonths * 30)
    : 0;

  // Calculate overseas experience points
  const overseasPoints =
    overseasExperienceYears >= 8
      ? 15
      : overseasExperienceYears >= 5
      ? 10
      : overseasExperienceYears >= 3
      ? 5
      : 0;

  return (
    <div className="space-y-6">
      {/* Australian Experience Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Australian Experience
          </h3>
          <span className="text-xs font-medium text-glacier-dark">
            Started {startDate.toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Main Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl gradient-navy p-6 text-white"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-2xl font-bold">
                {Math.floor(australianExperienceMonths / 12)} yrs {australianExperienceMonths % 12} mos
              </p>
              <p className="text-sm text-white/70">Total Australian Experience</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
          </div>

          {nextMilestone && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Progress to +{nextMilestone.points} points</span>
                <span className="font-semibold text-accent">
                  {nextMilestone.years} year{nextMilestone.years > 1 ? "s" : ""}
                </span>
              </div>
              <Progress value={currentProgress} className="h-2 bg-white/20" />
              
              {/* Days to Points Countdown - Hero Display */}
              <motion.div 
                className="flex items-center gap-3 p-4 rounded-xl bg-accent/20 border border-accent/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="w-14 h-14 rounded-xl bg-accent/30 flex flex-col items-center justify-center shrink-0">
                  <motion.span 
                    className="text-xl font-bold text-accent"
                    key={daysUntilNextMilestone}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {daysUntilNextMilestone}
                  </motion.span>
                  <span className="text-[10px] uppercase tracking-wide text-white/70">days</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {daysUntilNextMilestone} days until +{nextMilestone.points} points
                  </p>
                  <p className="text-xs text-white/70">
                    Keep working to unlock your next milestone
                  </p>
                </div>
                <Clock className="w-5 h-5 text-accent shrink-0" />
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Milestone Grid */}
        <div className="grid grid-cols-4 gap-2">
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.years}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rounded-xl border p-3 text-center transition-all",
                milestone.achieved
                  ? "border-accent/30 bg-accent/10"
                  : "border-border bg-card"
              )}
            >
              <p
                className={cn(
                  "text-lg font-bold",
                  milestone.achieved ? "text-accent" : "text-foreground"
                )}
              >
                {milestone.years}yr
              </p>
              <p
                className={cn(
                  "text-xs font-medium",
                  milestone.achieved ? "text-accent" : "text-muted-foreground"
                )}
              >
                +{milestone.points} pts
              </p>
              {milestone.achieved && (
                <CheckCircle2 className="w-4 h-4 text-accent mx-auto mt-1" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Overseas Experience Section */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Overseas Experience</p>
              <p className="text-sm text-muted-foreground">
                {overseasExperienceYears} years verified
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-accent">+{overseasPoints}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
          <span className="text-muted-foreground">Current tier</span>
          <span className="font-medium text-foreground">
            {overseasExperienceYears >= 8
              ? "8+ years (max)"
              : overseasExperienceYears >= 5
              ? "5-8 years"
              : overseasExperienceYears >= 3
              ? "3-5 years"
              : "Less than 3 years"}
          </span>
        </div>
      </div>
    </div>
  );
}
