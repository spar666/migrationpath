import { motion } from "framer-motion";
import { FileCheck, Target, Briefcase, ArrowRight, MapPin, Calculator, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkExperienceTracker } from "./WorkExperienceTracker";
import { SIDPathwayCard } from "./SIDPathwayCard";
import { PriorityOccupationBadge } from "./PriorityOccupationBadge";
import { StateInvitationsWidget } from "./StateInvitationsWidget";
import { PointsBoosterChecklist, StickyAuditCTA } from "@/components/onshore";
import { DynamicBookingGate } from "@/components/dashboard/DynamicBookingGate";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OnshoreSkilledDashboardProps {
  userPoints?: number;
  occupation?: string;
  anzscoCode?: string | null;
  sector?: "healthcare" | "construction" | "it" | "other";
  skillsAssessmentStatus?: "not_started" | "in_progress" | "completed";
  australianExperienceMonths?: number;
  currentEnglishLevel?: "competent" | "proficient" | "superior";
}

export function OnshoreSkilledDashboard({
  userPoints = 75,
  occupation = "Software Engineer",
  anzscoCode = null,
  sector = "it",
  skillsAssessmentStatus = "completed",
  australianExperienceMonths = 8,
  currentEnglishLevel = "proficient",
}: OnshoreSkilledDashboardProps) {
  const showPriorityBadge = ["healthcare", "construction", "it"].includes(sector);

  // Determine CTA based on points
  const ctaConfig =
    userPoints >= 90
      ? {
          primary: "Get Invitation Ready",
          secondary: "Book Concierge Call",
          description: "Your points are competitive. Let's secure your invitation.",
          variant: "elite" as const,
        }
      : {
          primary: "Bridge the Gap",
          secondary: "Explore Options",
          description: `You need ${90 - userPoints} more points. Let's explore your options.`,
          variant: "outline" as const,
        };

  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Priority Occupation Badge - Only for Healthcare, Construction, IT */}
      {showPriorityBadge && (
        <PriorityOccupationBadge
          occupation={occupation}
          sector={sector}
          processingDays={sector === "healthcare" ? 5 : sector === "it" ? 7 : 10}
        />
      )}

      {/* Quick Actions Bar - Professional Dense Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/points-calculator" className="block">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-full rounded-xl border border-border bg-card p-4 hover:border-glacier/50 hover:shadow-glass transition-all cursor-pointer"
          >
            <Calculator className="w-5 h-5 text-accent mb-2" />
            <p className="font-semibold text-sm text-foreground">PR Points Audit</p>
            <p className="text-xs text-muted-foreground">Optimize your score</p>
          </motion.div>
        </Link>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-border bg-card p-4 hover:border-glacier/50 hover:shadow-glass transition-all cursor-pointer"
        >
          <MapPin className="w-5 h-5 text-primary mb-2" />
          <p className="font-semibold text-sm text-foreground">State EOI Status</p>
          <p className="text-xs text-muted-foreground">Check invitations</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-border bg-card p-4 hover:border-glacier/50 hover:shadow-glass transition-all cursor-pointer"
        >
          <FileCheck className="w-5 h-5 text-glacier-dark mb-2" />
          <p className="font-semibold text-sm text-foreground">Skills Assessment</p>
          <p className="text-xs text-muted-foreground">
            {skillsAssessmentStatus === "completed" ? "Verified" : "In progress"}
          </p>
        </motion.div>

      </div>

      {/* Points-Based CTA Banner */}
      <Card className={cn(
        "overflow-hidden",
        userPoints >= 90 ? "border-accent/30 bg-gradient-to-r from-accent/5 to-transparent" : ""
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                userPoints >= 90 ? "gradient-gold" : "bg-primary/10"
              )}>
                <Target className={cn(
                  "w-7 h-7",
                  userPoints >= 90 ? "text-navy" : "text-primary"
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-2xl font-bold text-foreground">{userPoints}</p>
                  <span className="text-sm text-muted-foreground">/ 100 points</span>
                </div>
                <p className="text-sm text-muted-foreground">{ctaConfig.description}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="lg">
                {ctaConfig.secondary}
              </Button>
              <Button variant="elite" size="lg" className="gap-2">
                {ctaConfig.primary}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
          {/* Points Booster Checklist */}
          <PointsBoosterChecklist
            australianExperienceMonths={australianExperienceMonths}
            currentEnglishLevel={currentEnglishLevel}
            hasSkillsAssessment={skillsAssessmentStatus === "completed"}
          />

          {/* State Priority Invitations Widget */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <span>State Priority Alerts</span>
                <Badge className="ml-auto bg-accent/10 text-accent border-accent/30 text-xs">Live</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <StateInvitationsWidget
                occupation={occupation}
                userPoints={userPoints}
              />
            </CardContent>
          </Card>

          {/* Work Experience & SID Pathway Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Work Experience Tracker */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-navy" />
                  </div>
                  <span>Experience Tracker</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <WorkExperienceTracker
                  australianExperienceMonths={australianExperienceMonths}
                  overseasExperienceYears={3}
                />
              </CardContent>
            </Card>

            {/* SID to 186 Pathway */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30 py-4">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="w-8 h-8 rounded-lg gradient-navy flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span>186 PR Pathway</span>
                  <Badge className="ml-auto bg-accent/10 text-accent border-accent/30 text-xs">2026 SID</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <SIDPathwayCard
                  currentVisa="SID"
                  prEligibilityYears={2}
                  jobSearchDaysUsed={45}
                />
              </CardContent>
            </Card>
          </div>

          {/* Skills Assessment Card - If not completed */}
          {skillsAssessmentStatus !== "completed" && (
            <Card className="overflow-hidden border-gold/30 bg-gold/5">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                      <FileCheck className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Skills Assessment Required</p>
                      <p className="text-sm text-muted-foreground">
                        You need a positive skills assessment to proceed with your PR application.
                      </p>
                    </div>
                  </div>
                  <Button variant="elite" className="shrink-0">
                    Start Assessment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Dynamic Booking Gate + Sticky Audit CTA */}
        <div className="lg:col-span-1 space-y-6">
          <DynamicBookingGate
            pointsScore={userPoints}
            anzscoCode={anzscoCode}
            occupationTitle={occupation}
            onBookConsultation={() => window.open("https://calendly.com/migrationpath", "_blank")}
          />
          <StickyAuditCTA userPoints={userPoints} />
        </div>
      </div>
    </div>
  );
}
