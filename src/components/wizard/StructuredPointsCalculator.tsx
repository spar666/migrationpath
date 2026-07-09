import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Info, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useStructuredPoints } from "@/hooks/useStructuredPoints";
import type {
  EnglishLevel,
  QualificationLevel,
  UserProfileInput,
} from "@/services/pointsService";

const ENGLISH_OPTIONS: { value: EnglishLevel; label: string }[] = [
  { value: "superior", label: "Superior English (IELTS 8+ / PTE 79+)" },
  { value: "proficient", label: "Proficient English (IELTS 7+ / PTE 65+)" },
  { value: "competent", label: "Competent English (IELTS 6+ / PTE 50+)" },
];

const QUALIFICATION_OPTIONS: { value: QualificationLevel; label: string }[] = [
  { value: "doctorate", label: "Doctorate (PhD)" },
  { value: "bachelor_masters", label: "Bachelor or Masters degree" },
  { value: "diploma_trade", label: "Diploma or trade qualification" },
  { value: "other_recognised", label: "Other recognised qualification" },
];

const WORK_CAP_NOTE =
  "Note: Combined Australian and Overseas experience points are capped at the legal maximum of 20 points.";

const BREAKDOWN_LABELS: Record<string, string> = {
  AGE: "Age",
  ENGLISH: "English",
  QUALIFICATIONS: "Qualifications",
  WORK_EXPERIENCE_COMBINED: "Work Experience (combined)",
  REGIONAL_STUDY: "Regional Study",
};

// Order shown in the breakdown; OS/AU raw rows are folded into the combined row.
const BREAKDOWN_ORDER = [
  "AGE",
  "ENGLISH",
  "QUALIFICATIONS",
  "WORK_EXPERIENCE_COMBINED",
  "REGIONAL_STUDY",
];

export function StructuredPointsCalculator() {
  const [age, setAge] = useState<string>("29");
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel | "">("");
  const [qualification, setQualification] = useState<QualificationLevel | "">("");
  const [overseasWorkYears, setOverseasWorkYears] = useState<string>("0");
  const [australianWorkYears, setAustralianWorkYears] = useState<string>("0");
  const [regionalStudy, setRegionalStudy] = useState<boolean>(false);

  const profile = useMemo<UserProfileInput>(
    () => ({
      visaGroup: "GSM",
      age: parseInt(age, 10),
      englishLevel: (englishLevel || "competent") as EnglishLevel,
      qualification: (qualification || "bachelor_masters") as QualificationLevel,
      overseasWorkYears: parseInt(overseasWorkYears, 10) || 0,
      australianWorkYears: parseInt(australianWorkYears, 10) || 0,
      regionalStudy,
    }),
    [age, englishLevel, qualification, overseasWorkYears, australianWorkYears, regionalStudy],
  );

  // Only calculate once the required discrete selections are made.
  const hasRequired = englishLevel !== "" && qualification !== "" && age !== "";
  const { result, isCalculating, error } = useStructuredPoints(
    hasRequired
      ? profile
      : { ...profile, englishLevel: "" as EnglishLevel, qualification: "" as QualificationLevel },
  );

  const total = result?.totalPoints ?? 0;
  const belowPass = result?.belowPassMark ?? true;
  const workCapApplied = result?.workCapApplied ?? false;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ---------- Left: inputs ---------- */}
      <div className="w-full md:w-[60%] flex flex-col bg-white border-r">
        <div className="px-8 py-6 border-b">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
              <Calculator className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy">
                Australian Migration Points Calculator
              </h1>
              <p className="text-sm text-muted-foreground">
                Structured GSM assessment (189 / 190 / 491)
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-10">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm font-semibold text-navy">
                Age
              </Label>
              <Input
                id="age"
                type="number"
                min={18}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="h-12 max-w-xs border-2 border-navy/15 focus:border-navy/30"
              />
            </div>

            {/* English — 3-option dropdown (replaces the old slider) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-navy">
                English proficiency
              </Label>
              <Select
                value={englishLevel}
                onValueChange={(v) => setEnglishLevel(v as EnglishLevel)}
              >
                <SelectTrigger className="h-12 border-2 border-navy/15 hover:border-navy/30 transition-colors">
                  <SelectValue placeholder="Select your English level" />
                </SelectTrigger>
                <SelectContent>
                  {ENGLISH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="py-3">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Qualification */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-navy">
                Highest qualification
              </Label>
              <Select
                value={qualification}
                onValueChange={(v) => setQualification(v as QualificationLevel)}
              >
                <SelectTrigger className="h-12 border-2 border-navy/15 hover:border-navy/30 transition-colors">
                  <SelectValue placeholder="Select your qualification" />
                </SelectTrigger>
                <SelectContent>
                  {QUALIFICATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="py-3">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Work experience */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="os-work" className="text-sm font-semibold text-navy">
                  Overseas work (years)
                </Label>
                <Input
                  id="os-work"
                  type="number"
                  min={0}
                  max={50}
                  value={overseasWorkYears}
                  onChange={(e) => setOverseasWorkYears(e.target.value)}
                  className="h-12 border-2 border-navy/15 focus:border-navy/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="au-work" className="text-sm font-semibold text-navy">
                  Australian work (years)
                </Label>
                <Input
                  id="au-work"
                  type="number"
                  min={0}
                  max={50}
                  value={australianWorkYears}
                  onChange={(e) => setAustralianWorkYears(e.target.value)}
                  className="h-12 border-2 border-navy/15 focus:border-navy/30"
                />
              </div>
            </div>

            {/* Regional study toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-navy">
                Studied in a designated regional area?
              </Label>
              <div className="inline-flex rounded-xl border-2 border-navy/15 p-1">
                {[
                  { label: "No", value: false },
                  { label: "Yes", value: true },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setRegionalStudy(opt.value)}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-semibold transition-colors",
                      regionalStudy === opt.value
                        ? "bg-navy text-white"
                        : "text-navy-muted hover:text-navy",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Couldn't calculate your score. Please try again.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Right: live scorecard ---------- */}
      <div className="w-full md:w-[40%] gradient-navy p-8">
        <div className="sticky top-8 space-y-6">
          <Card className="bg-white/5 border-white/10 p-6 text-white shadow-glass">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium uppercase tracking-widest text-white/60">
                Estimated points
              </p>
              {isCalculating && (
                <Loader2 className="h-4 w-4 animate-spin text-white/50" />
              )}
            </div>

            <div className="mt-2 flex items-end gap-2">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={total}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="text-6xl font-bold text-white"
                >
                  {hasRequired ? total : "—"}
                </motion.span>
              </AnimatePresence>
              <span className="mb-2 text-lg text-white/60">points</span>
            </div>

            {hasRequired && (
              <div className="mt-4">
                {result?.ineligibilityReason ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/20 px-3 py-1.5 text-sm font-semibold text-white">
                    <AlertCircle className="h-4 w-4" />
                    {result.ineligibilityReason}
                  </span>
                ) : belowPass ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/80">
                    Below pass mark (65)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gold/20 px-3 py-1.5 text-sm font-semibold text-gold-light">
                    <CheckCircle2 className="h-4 w-4" />
                    Pass mark met (65+)
                  </span>
                )}
              </div>
            )}
          </Card>

          {/* Breakdown */}
          {hasRequired && result && (
            <Card className="bg-white/5 border-white/10 p-6 text-white shadow-glass">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-white/60">
                Breakdown
              </h3>
              <div className="space-y-3">
                {BREAKDOWN_ORDER.map((key) => {
                  const points = result.breakdown[key] ?? 0;
                  const isCappedRow =
                    key === "WORK_EXPERIENCE_COMBINED" && workCapApplied;
                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                        isCappedRow
                          ? "bg-gold/15 ring-1 ring-gold/40"
                          : "bg-transparent",
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-white/80">
                        {BREAKDOWN_LABELS[key] ?? key}
                        {isCappedRow && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label="Work experience cap details"
                                className="inline-flex"
                              >
                                <Info className="h-3.5 w-3.5 text-gold-light" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {WORK_CAP_NOTE}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          isCappedRow ? "text-gold-light" : "text-white",
                        )}
                      >
                        +{points}
                      </span>
                    </div>
                  );
                })}
              </div>

              {workCapApplied && (
                <p className="mt-4 flex items-start gap-2 rounded-lg bg-gold/10 px-3 py-2 text-xs leading-relaxed text-gold-light">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {WORK_CAP_NOTE}
                </p>
              )}
            </Card>
          )}

          {!hasRequired && (
            <p className="text-center text-sm italic text-white/50">
              Select your English level and qualification to see your score.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
