import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle,
  Lightbulb,
  RotateCcw,
  Plane,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ConsultationCTA } from "@/components/common/ConsultationCTA";
import { cn } from "@/lib/utils";
import type { ParentAuditResult } from "@/services/parentService";

interface Props {
  result: ParentAuditResult;
  onRestart?: () => void;
}

export function ParentEligibilityDashboard({ result, onRestart }: Props) {
  const eligible = result.isEligible;
  const bof = result.balanceOfFamily;
  const passBof = bof.pass || bof.alternativeLimbPass;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      {/* Eligibility badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "rounded-3xl p-8 text-center shadow-glass",
          eligible
            ? "bg-emerald-600"
            : "bg-red-600",
        )}
      >
        <div className="flex flex-col items-center gap-3 text-white">
          {eligible ? (
            <CheckCircle2 className="h-14 w-14" />
          ) : (
            <XCircle className="h-14 w-14" />
          )}
          <h1 className="text-3xl font-bold tracking-tight">
            {eligible ? "LEGALLY ELIGIBLE" : "LEGALLY INELIGIBLE"}
          </h1>
          <p className="max-w-md text-sm text-white/85">
            {eligible
              ? "You meet the core legislative gates for a parent visa. Review the recommendations below and confirm details with a registered agent."
              : "One or more mandatory legislative gates are not currently met. See the required next steps below."}
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
            {result.predictedVisa.track === "aged_parent" ? (
              <Users className="h-4 w-4" />
            ) : (
              <Plane className="h-4 w-4" />
            )}
            Likely path: {result.predictedVisa.name}
          </span>
        </div>
      </motion.div>

      {/* Balance of Family visual */}
      <Card className="mt-6 p-6 shadow-glass sm:p-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-navy">
          <Users className="h-5 w-5 text-gold" />
          Balance of Family Test
        </h2>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-2xl font-bold text-navy">
              {bof.childrenInAustralia} out of {bof.totalChildren} children in
              Australia
            </p>
            <p className="text-sm text-navy-muted">
              {passBof
                ? bof.pass
                  ? "Meets the 50% threshold."
                  : "Meets the alternative limb (more children in Australia than any other single country)."
                : "Below the required threshold."}
            </p>
          </div>
          <div
            className={cn(
              "shrink-0 rounded-2xl px-5 py-3 text-center",
              passBof ? "bg-emerald-50" : "bg-red-50",
            )}
          >
            <span
              className={cn(
                "block text-3xl font-bold",
                passBof ? "text-emerald-600" : "text-red-600",
              )}
            >
              {bof.percentage}%
            </span>
            <span
              className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                passBof ? "text-emerald-600" : "text-red-600",
              )}
            >
              {passBof ? "Pass" : "Fail"}
            </span>
          </div>
        </div>

        {/* Ratio bar */}
        <div className="mt-5 h-4 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn(
              "h-full rounded-full",
              passBof ? "bg-emerald-500" : "bg-red-500",
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(bof.percentage, 100)}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-navy-muted">
          <span>0%</span>
          <span>50% required</span>
          <span>100%</span>
        </div>
      </Card>

      {/* AoS warning */}
      {result.aos.requiresCoAssurer && (
        <Card className="mt-6 border-amber-200 bg-amber-50 p-6 shadow-glass sm:p-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h3 className="font-bold text-amber-800">
                Assurance of Support — co-assurer likely required
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-amber-800/90">
                The sponsor's taxable income (AUD{" "}
                {result.aos.sponsorTaxableIncome.toLocaleString()}) is below the
                indicative single-sponsor baseline of AUD{" "}
                {result.aos.benchmark.toLocaleString()}. A co-assurer will likely
                be needed to meet Centrelink's Assurance of Support bond
                requirements.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="mt-6 p-6 shadow-glass sm:p-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-navy">
          <Lightbulb className="h-5 w-5 text-gold" />
          Legal Next Steps
        </h2>
        <ul className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-start gap-3 rounded-xl border border-navy/10 bg-cloud/50 px-4 py-3"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold-dark">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-navy-muted">
                {rec}
              </span>
            </motion.li>
          ))}
        </ul>
      </Card>

      {/* Primary CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <ConsultationCTA className="max-w-md" />
        {onRestart && (
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-1.5 py-2 text-sm text-navy-muted transition-colors hover:text-navy"
          >
            <RotateCcw className="h-4 w-4" />
            Retake the assessment
          </button>
        )}
      </motion.div>

      {/* Disclaimer */}
      <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-navy-muted/70">
        This tool is an analytical guide to the Balance of Family Test and
        Assurance of Support criteria. It is indicative only and does not
        constitute official Department of Home Affairs eligibility decisions or
        legal advice. Confirm your circumstances with a registered migration
        agent before lodging.
      </p>
    </div>
  );
}
