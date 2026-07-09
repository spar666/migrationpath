import { motion } from "framer-motion";
import { Briefcase, Clock, AlertTriangle, CheckCircle2, Target, Info, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MobilityWindowTrackerProps {
  jobSearchDaysUsed?: number;
  maxJobSearchDays?: number;
  employerStartDate?: Date;
  prEligibilityYears?: number;
}

export function MobilityWindowTracker({
  jobSearchDaysUsed = 0,
  maxJobSearchDays = 180,
  employerStartDate = new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000), // 8 months ago
  prEligibilityYears = 2,
}: MobilityWindowTrackerProps) {
  const jobSearchRemaining = maxJobSearchDays - jobSearchDaysUsed;
  const jobSearchPercent = (jobSearchDaysUsed / maxJobSearchDays) * 100;

  // Calculate PR countdown
  const now = new Date();
  const monthsWithEmployer = Math.floor(
    (now.getTime() - employerStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const requiredMonths = prEligibilityYears * 12;
  const monthsRemaining = Math.max(0, requiredMonths - monthsWithEmployer);
  const daysRemaining = monthsRemaining * 30;
  const progressPercent = Math.min(100, (monthsWithEmployer / requiredMonths) * 100);

  const isWindowActive = jobSearchDaysUsed > 0;
  const isWindowCritical = jobSearchRemaining < 60;
  const isPRReady = monthsRemaining === 0;

  return (
    <div className="space-y-6">
      {/* 186 PR Countdown Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl gradient-navy p-6 text-white"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge className="mb-2 bg-accent/20 text-accent border-accent/30">
              <Target className="w-3 h-3 mr-1" />
              186 ENS Pathway
            </Badge>
            <div className="flex items-baseline gap-2">
              <motion.p
                className="text-4xl font-bold"
                key={daysRemaining}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                {isPRReady ? "Ready!" : `${daysRemaining}`}
              </motion.p>
              {!isPRReady && (
                <span className="text-lg text-white/70">days to PR</span>
              )}
            </div>
            <p className="text-sm text-white/70 mt-1">
              {isPRReady
                ? "You're eligible to apply for Permanent Residency"
                : `${monthsRemaining} months until 186 eligibility`}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
            <Calendar className="w-7 h-7 text-accent" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">Progress to Permanent Residency</span>
            <span className="font-semibold text-accent">
              {prEligibilityYears} year pathway
            </span>
          </div>
          <Progress value={progressPercent} className="h-3 bg-white/20" />
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>
              Started {employerStartDate.toLocaleDateString("en-AU", { month: "short", year: "numeric" })}
            </span>
            <span>{monthsWithEmployer} of {requiredMonths} months</span>
          </div>
        </div>

        {isPRReady && (
          <Button className="w-full mt-4 bg-accent hover:bg-accent/90 text-navy font-semibold">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Apply for 186 ENS Now
          </Button>
        )}
      </motion.div>

      {/* 180-Day Job Search Window */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "rounded-xl border p-5 space-y-4",
          isWindowActive
            ? isWindowCritical
              ? "border-destructive/30 bg-destructive/5"
              : "border-amber-500/30 bg-amber-500/5"
            : "border-border bg-card"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                isWindowActive
                  ? isWindowCritical
                    ? "bg-destructive/20"
                    : "bg-amber-500/20"
                  : "bg-primary/10"
              )}
            >
              <Briefcase
                className={cn(
                  "w-6 h-6",
                  isWindowActive
                    ? isWindowCritical
                      ? "text-destructive"
                      : "text-amber-500"
                    : "text-primary"
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">180-Day Mobility Window</p>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Under the 2026 SID framework, if your employment ends, you have
                      180 days to find a new sponsor while maintaining your visa status.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground">
                {isWindowActive ? "Job search active" : "Not currently in use"}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-bold",
              isWindowActive
                ? isWindowCritical
                  ? "bg-destructive text-white"
                  : "bg-amber-500 text-white"
                : "bg-accent/10 text-accent"
            )}
          >
            {jobSearchRemaining} days
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Window status</span>
            <span className="font-medium text-foreground">
              {isWindowActive
                ? `${jobSearchDaysUsed} of ${maxJobSearchDays} days used`
                : "Full 180 days available"}
            </span>
          </div>
          <div className="relative">
            <Progress
              value={jobSearchPercent}
              className={cn(
                "h-3",
                isWindowCritical && "[&>div]:bg-destructive"
              )}
            />
            {jobSearchPercent > 66 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Status Message */}
        {isWindowActive ? (
          <div
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border",
              isWindowCritical
                ? "bg-destructive/10 border-destructive/20"
                : "bg-amber-500/10 border-amber-500/20"
            )}
          >
            <AlertTriangle
              className={cn(
                "w-5 h-5 shrink-0",
                isWindowCritical ? "text-destructive" : "text-amber-500"
              )}
            />
            <div>
              <p
                className={cn(
                  "font-semibold text-sm",
                  isWindowCritical ? "text-destructive" : "text-amber-600"
                )}
              >
                {isWindowCritical
                  ? "Critical: Find a sponsor soon"
                  : "Job search window active"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isWindowCritical
                  ? "Your visa status may be at risk. Book a consultation now."
                  : "You have time to find a new sponsor. We can help."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
            <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
            <div>
              <p className="font-semibold text-sm text-accent">Employed & Secure</p>
              <p className="text-xs text-muted-foreground">
                Your full 180-day window is available if needed.
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* CTA */}
      <Button variant="elite" className="w-full">
        Start Skills Assessment
      </Button>
    </div>
  );
}
