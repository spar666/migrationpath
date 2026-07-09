import { motion } from "framer-motion";
import { Clock, ArrowRight, Briefcase, AlertTriangle, CheckCircle2, Target, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SIDPathwayCardProps {
  currentVisa?: "482" | "494" | "SID" | "485";
  employerStartDate?: Date;
  prEligibilityYears?: number; // 2 for SID, 3 for old TSS
  jobSearchDaysUsed?: number;
  maxJobSearchDays?: number;
}

export function SIDPathwayCard({
  currentVisa = "SID",
  employerStartDate = new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000), // 14 months ago
  prEligibilityYears = 2,
  jobSearchDaysUsed = 45,
  maxJobSearchDays = 180,
}: SIDPathwayCardProps) {
  // Calculate time with current employer
  const now = new Date();
  const monthsWithEmployer = Math.floor(
    (now.getTime() - employerStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  const requiredMonths = prEligibilityYears * 12;
  const monthsRemaining = Math.max(0, requiredMonths - monthsWithEmployer);
  const progressPercent = Math.min(100, (monthsWithEmployer / requiredMonths) * 100);

  // Job search mobility gauge
  const jobSearchRemaining = maxJobSearchDays - jobSearchDaysUsed;
  const jobSearchPercent = (jobSearchDaysUsed / maxJobSearchDays) * 100;

  const visaLabels = {
    "482": "TSS Visa (482)",
    "494": "SESR Visa (494)",
    SID: "Skills in Demand (SID)",
    "485": "Graduate Visa (485)",
  };

  return (
    <div className="space-y-6">
      {/* PR Countdown Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl gradient-navy p-6 text-white"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge className="mb-2 bg-accent/20 text-accent border-accent/30 hover:bg-accent/30">
              <Zap className="w-3 h-3 mr-1" />
              2026 Fast-Track
            </Badge>
            <p className="text-2xl font-bold">
              {monthsRemaining > 0 ? `${monthsRemaining} months` : "Eligible Now"}
            </p>
            <p className="text-sm text-white/70">Until 186 ENS Eligibility</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
            <Target className="w-7 h-7 text-accent" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">
              {visaLabels[currentVisa]} → Permanent Residency
            </span>
            <span className="font-semibold text-accent">{prEligibilityYears} year pathway</span>
          </div>
          <Progress value={progressPercent} className="h-3 bg-white/20" />
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Started {employerStartDate.toLocaleDateString("en-AU")}</span>
            <span>{monthsWithEmployer} of {requiredMonths} months completed</span>
          </div>
        </div>

        {monthsRemaining === 0 && (
          <Button className="w-full mt-4 bg-accent hover:bg-accent/90 text-navy font-semibold">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Apply for 186 ENS Now
          </Button>
        )}
      </motion.div>

      {/* 2026 SID Benefit Highlight */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-accent" />
          <p className="font-semibold text-foreground">Skills in Demand 2026 Benefit</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Under the new SID visa framework, you qualify for the{" "}
          <span className="font-semibold text-accent">2-year PR pathway</span> instead of the
          previous 3-year requirement. This saves you 12 months on your journey to permanent
          residency.
        </p>
      </div>

      {/* Mobility Gauge - 180 Day Job Search */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Mobility Window</p>
              <p className="text-sm text-muted-foreground">Job search flexibility</p>
            </div>
          </div>
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold",
              jobSearchRemaining > 90
                ? "bg-accent/10 text-accent"
                : jobSearchRemaining > 30
                ? "bg-yellow-500/10 text-yellow-600"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {jobSearchRemaining} days left
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Days used</span>
            <span className="font-medium text-foreground">
              {jobSearchDaysUsed} of {maxJobSearchDays} days
            </span>
          </div>
          <div className="relative">
            <Progress value={jobSearchPercent} className="h-2" />
            {jobSearchPercent > 75 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute right-0 -top-1"
              >
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </motion.div>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Under the 2026 SID framework, you have up to 180 days to find a new sponsor if your
          employment ends. This provides greater job mobility while maintaining your visa status.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto py-3 flex-col items-start text-left">
          <span className="text-xs text-muted-foreground">Check</span>
          <span className="font-semibold flex items-center gap-1">
            State Nominations <ArrowRight className="w-3 h-3" />
          </span>
        </Button>
        <Button variant="outline" className="h-auto py-3 flex-col items-start text-left">
          <span className="text-xs text-muted-foreground">Track</span>
          <span className="font-semibold flex items-center gap-1">
            186 Requirements <ArrowRight className="w-3 h-3" />
          </span>
        </Button>
      </div>
    </div>
  );
}
