import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Calendar,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Zap,
  MapPin,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import type { AuditFormData } from "./FastAuditForm";

interface StrategyPreviewCardProps {
  data: AuditFormData;
  onBack: () => void;
}

const visaLabels: Record<string, string> = {
  "482": "482 TSS",
  "485": "485 Graduate",
  sid: "Skills in Demand",
  "407": "407 Training",
  other: "Work Visa",
};

const experiencePoints: Record<string, number> = {
  "0-1": 0,
  "1-2": 5,
  "2-3": 10,
  "3-5": 15,
  "5+": 20,
};

const experienceMonths: Record<string, number> = {
  "0-1": 6,
  "1-2": 18,
  "2-3": 30,
  "3-5": 48,
  "5+": 72,
};

export function StrategyPreviewCard({ data, onBack }: StrategyPreviewCardProps) {
  const navigate = useNavigate();
  const [occupationData, setOccupationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data.occupation) {
      setLoading(false);
      return;
    }
    apiClient.get<any>(`/occupations/${data.occupation}`)
      .then((response) => {
        setOccupationData(response?.data || response);
      })
      .catch(() => {
        setOccupationData(null);
      })
      .finally(() => setLoading(false));
  }, [data.occupation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const expPoints = experiencePoints[data.experience] || 0;
  const totalPoints = 65 + expPoints;
  const prCountdownMonths = (() => {
    if (data.visa === "482") {
      const months = 36 - ((experienceMonths[data.experience] || 6) / 12) * 12;
      return Math.max(0, Math.min(36, Math.round(months)));
    }
    return 24;
  })();
  const potentialBoost = Math.max(0, 90 - totalPoints);
  const pathwayVisa = totalPoints >= 85 ? "190" : "491";

  const thresholds = occupationData?.thresholds || [];
  const eligibleStates = thresholds
    .filter((t: any) => t.is_available !== false)
    .map((t: any) => t.state_code)
    .filter(Boolean);
  const uniqueStates = [...new Set<string>(eligibleStates)];

  const assessingAuthority = occupationData?.assessing_authority;
  const sector = occupationData?.sector || assessingAuthority || "General";

  const isPriorityOccupation = occupationData?.is_high_priority === true ||
    occupationData?.priority_status === "fast-track";

  const handleSaveStrategy = () => {
    sessionStorage.setItem("onshoreAuditData", JSON.stringify({
      ...data,
      totalPoints,
      prCountdownMonths,
      potentialBoost,
      pathwayVisa,
      timestamp: Date.now(),
    }));
    navigate("/dashboard?pathway=onshore-skilled");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-gold mb-4">
          <CheckCircle2 className="w-8 h-8 text-navy" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Your Strategy Preview
        </h2>
        <p className="text-muted-foreground">
          Based on your {visaLabels[data.visa] || data.visa} visa and {sector} role
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card overflow-hidden shadow-glass"
      >
        <div className="p-6 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Points</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">{totalPoints}</span>
                <span className="text-lg text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <Badge
                className={totalPoints >= 85
                  ? "bg-accent/10 text-accent border-accent/30"
                  : "bg-gold/10 text-gold border-gold/30"
                }
              >
                {pathwayVisa} Eligible
              </Badge>
              {isPriorityOccupation && (
                <div className="mt-2">
                  <Badge className="bg-primary/10 text-primary border-primary/30">
                    <Zap className="w-3 h-3 mr-1" />
                    Priority Sector
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="w-10 h-10 rounded-lg gradient-navy flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">186-PR Countdown</p>
              <p className="text-sm text-muted-foreground">
                You're <span className="font-semibold text-accent">{prCountdownMonths} months</span> away from permanent residency eligibility
              </p>
            </div>
          </div>

          {potentialBoost > 0 && (
            <div className="flex items-start gap-4 p-4 rounded-xl bg-gold/5 border border-gold/10">
              <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Points Boost Available</p>
                <p className="text-sm text-muted-foreground">
                  We found <span className="font-semibold text-gold">+{potentialBoost} potential points</span> through English, NAATI, or PY
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="w-10 h-10 rounded-lg bg-glacier/20 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-glacier-dark" />
            </div>
            <div>
              <p className="font-semibold text-foreground">State Nomination Ready</p>
              <p className="text-sm text-muted-foreground">
                {uniqueStates.length > 0
                  ? `Your occupation qualifies for nomination in ${uniqueStates.slice(0, 3).join(", ")}${uniqueStates.length > 3 ? `, and ${uniqueStates.length - 3} more` : ""}`
                  : "Check state nomination lists for your occupation"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-muted/30 border-t border-border">
          <Button
            onClick={handleSaveStrategy}
            variant="elite"
            size="lg"
            className="w-full h-14 text-base shadow-gold-glow"
          >
            <Target className="w-5 h-5 mr-2" />
            Save Strategy & Open My Tracker
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <button
            onClick={onBack}
            className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Start over
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground"
      >
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-accent" />
          MARA Registered Agents
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-accent" />
          10,000+ Visas Processed
        </span>
      </motion.div>
    </motion.div>
  );
}
