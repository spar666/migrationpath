import { motion } from "framer-motion";
import { CheckCircle2, XCircle, FileCheck, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OccupationSearchResult } from "@/hooks/useOccupationSearch";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface VisaEligibilityCardProps {
  occupation: OccupationSearchResult;
}

const visaBadgeStyles = {
  green: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20",
  blue: "bg-blue-500/15 text-blue-600 border-blue-500/30 hover:bg-blue-500/20",
  yellow: "bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/20",
};

const visaDescriptions: Record<string, string> = {
  "189": "No sponsorship required. Apply directly to DHA.",
  "190": "Requires state/territory nomination. +5 points.",
  "491": "Provisional regional visa. +15 points. Path to 191 PR.",
};

export function VisaEligibilityCard({ occupation }: VisaEligibilityCardProps) {
  const navigate = useNavigate();
  
  const visas = occupation.eligibleVisas ?? [];
  const eligibleVisas = visas.filter((v) => v.eligible);

  const handleStartAssessment = () => {
    navigate("/consultation");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-border/60 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold text-foreground">
                {occupation.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground font-mono">
                ANZSCO {occupation.anzsco_code} • Skill Level {occupation.skill_level || "N/A"}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0">
              {eligibleVisas.length} Visa{eligibleVisas.length !== 1 ? "s" : ""} Available
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Visa Eligibility Matrix */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Visa Eligibility</h3>
            <div className="grid gap-3">
              {visas.map((visa) => (
                <div
                  key={visa.subclass}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 transition-colors",
                    visa.eligible
                      ? "bg-card border-border"
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {visa.eligible ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-8 px-3 text-sm font-semibold",
                          visaBadgeStyles[visa.color]
                        )}
                      >
                        {visa.subclass}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="h-8 px-3 text-sm font-semibold bg-muted/50 text-muted-foreground border-border"
                      >
                        {visa.subclass}
                      </Badge>
                    )}
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          visa.eligible ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {visa.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {visaDescriptions[visa.subclass]}
                      </span>
                    </div>
                  </div>
                  {visa.eligible ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Assessing Authority */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Skills Assessment</h3>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {occupation.assessing_authority || "Assessing Authority TBD"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Skills assessed by this authority for migration purposes
                </p>
              </div>
            </div>
          </div>

          {/* List Membership Pills */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Occupation Lists</h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1",
                  occupation.on_mltssl
                    ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                    : "bg-muted/50 text-muted-foreground border-border"
                )}
              >
                {occupation.on_mltssl ? "✓" : "✗"} MLTSSL
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1",
                  occupation.on_stsol
                    ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
                    : "bg-muted/50 text-muted-foreground border-border"
                )}
              >
                {occupation.on_stsol ? "✓" : "✗"} STSOL
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1",
                  occupation.on_rol
                    ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                    : "bg-muted/50 text-muted-foreground border-border"
                )}
              >
                {occupation.on_rol ? "✓" : "✗"} ROL
              </Badge>
            </div>
          </div>

          <Separator />

          {/* CTA Button */}
          <Button onClick={handleStartAssessment} className="w-full gap-2" size="lg">
            <FileCheck className="h-4 w-4" />
            Start Assessment
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
