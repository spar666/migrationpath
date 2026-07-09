import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lightbulb,
  Unlock,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ConsultationCTA } from "@/components/common/ConsultationCTA";
import { cn } from "@/lib/utils";
import type { PartnerAuditResult, PillarResult } from "@/services/partnerService";

interface Props {
  result: PartnerAuditResult;
  onRestart?: () => void;
}

/** Green >75, Orange 50-75, Red <50. */
function health(pct: number): { bar: string; text: string; ring: string } {
  if (pct > 75)
    return { bar: "bg-emerald-500", text: "text-emerald-600", ring: "stroke-emerald-500" };
  if (pct >= 50)
    return { bar: "bg-amber-500", text: "text-amber-600", ring: "stroke-amber-500" };
  return { bar: "bg-red-500", text: "text-red-600", ring: "stroke-red-500" };
}

function RadialGauge({ value }: { value: number }) {
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);
  const tone = health(value);

  return (
    <div className="relative h-52 w-52">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="16"
          className="stroke-white/10"
        />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="16"
          strokeLinecap="round"
          className={tone.ring}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-5xl font-bold text-white"
        >
          {value}%
        </motion.span>
        <span className="text-xs font-medium uppercase tracking-widest text-white/60">
          Application Health
        </span>
      </div>
    </div>
  );
}

function PillarBar({ pillar, index }: { pillar: PillarResult; index: number }) {
  const tone = health(pillar.percentage);
  const unlocked = pillar.status === "LEGALLY UNLOCKED";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-navy">
          {pillar.label}
          {unlocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <Unlock className="h-3 w-3" />
              Legally Unlocked
            </span>
          )}
        </span>
        <span className={cn("text-sm font-bold", tone.text)}>
          {pillar.percentage}%
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn("h-full rounded-full", tone.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${pillar.percentage}%` }}
          transition={{ duration: 0.8, delay: 0.15 * index, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function PartnerReadinessDashboard({ result, onRestart }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      {/* Gauge header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="gradient-navy relative overflow-hidden rounded-3xl p-8 text-center shadow-glass"
      >
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-12">
          <RadialGauge value={result.overallReadiness} />
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Your Partner Visa Readiness
            </h1>
            <p className="mt-2 max-w-sm text-sm text-white/70">
              Assessed across the four legislative pillars used by the Department
              of Home Affairs for partner visa applications.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">
                <MapPin className="h-4 w-4 text-gold" />
                Predicted path: Subclass {result.predictedVisa.subclass}
              </span>
              {result.legislativeWaiverApplied && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-200">
                  <Unlock className="h-4 w-4" />
                  BDM waiver applied
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pillar bars */}
      <Card className="mt-6 p-6 shadow-glass sm:p-8">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-navy">
          <ShieldCheck className="h-5 w-5 text-gold" />
          Evidentiary Pillars
        </h2>
        <div className="space-y-5">
          {result.pillars.map((pillar, i) => (
            <PillarBar key={pillar.key} pillar={pillar} index={i} />
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="mt-6 p-6 shadow-glass sm:p-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-navy">
          <Lightbulb className="h-5 w-5 text-gold" />
          System Recommendations
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
        This scoring matrix is an analytical guide designed to help you identify
        and strengthen your evidence. The percentages shown are indicative only
        and do not constitute official Department of Home Affairs scores — partner
        visa applications are assessed holistically by the Department, not by a
        points or percentage system.
      </p>
    </div>
  );
}
