import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Home,
  Wallet,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  parentService,
  type ParentProfileInput,
  type SponsorStatus,
  type ParentAuditResult,
} from "@/services/parentService";
import { ParentEligibilityDashboard } from "./ParentEligibilityDashboard";

type FormState = Omit<ParentProfileInput, "sponsorStatus"> & {
  sponsorStatus: SponsorStatus | "";
};

const INITIAL_FORM: FormState = {
  sponsorStatus: "",
  sponsorMonthsInAustralia: 0,
  totalChildren: 0,
  childrenInAustralia: 0,
  childrenInLargestOtherCountry: 0,
  sponsorTaxableIncome: 0,
  parentAge: 0,
};

const SPONSOR_OPTIONS: { value: SponsorStatus; label: string }[] = [
  { value: "citizen", label: "Australian citizen" },
  { value: "permanent_resident", label: "Permanent resident" },
  { value: "eligible_nz", label: "Eligible New Zealand citizen" },
  { value: "none", label: "None of the above / unsure" },
];

const TOTAL_STEPS = 3;

function Stepper({
  label,
  hint,
  value,
  min = 0,
  max = 50,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="flex items-center justify-between rounded-2xl border-2 border-navy/10 bg-white p-4">
      <div className="pr-4">
        <p className="text-base font-semibold text-navy">{label}</p>
        {hint && <p className="text-sm text-navy-muted">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => set(value - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy/20 text-navy hover:bg-navy/5"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center text-xl font-bold text-navy">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => set(value + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy/20 text-navy hover:bg-navy/5"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ParentAuditWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ParentAuditResult | null>(null);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const patch = (partial: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const res = await parentService.submitAudit({
        ...form,
        sponsorStatus: form.sponsorStatus as SponsorStatus,
        // Guard: children in Australia can't exceed the global total.
        childrenInAustralia: Math.min(
          form.childrenInAustralia,
          form.totalChildren,
        ),
      });
      setResult(res);
    } catch (err) {
      toast.error("We couldn't assess your eligibility. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return form.sponsorStatus !== "";
    if (step === 1) return form.totalChildren > 0;
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else submit();
  };

  const handleBack = () => step > 0 && setStep((s) => s - 1);

  const resetAll = () => {
    setResult(null);
    setForm(INITIAL_FORM);
    setStep(0);
  };

  if (result) {
    return <ParentEligibilityDashboard result={result} onRestart={resetAll} />;
  }

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <section className="relative min-h-screen bg-cloud">
      <div className="container max-w-2xl px-4 py-12 md:py-16">
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-navy">
              Parent Visa Eligibility Gateway
            </span>
            <span className="text-navy-muted">
              Step {step + 1} of {TOTAL_STEPS}
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-muted" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 0 — Sponsor */}
            {step === 0 && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl gradient-gold">
                    <Home className="h-5 w-5 text-navy" />
                  </span>
                  <div>
                    <h1 className="text-2xl font-bold text-navy">
                      Your sponsoring child
                    </h1>
                    <p className="text-sm text-navy-muted">
                      The child in Australia who will sponsor you.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-navy">
                      Sponsor's residency status
                    </Label>
                    <Select
                      value={form.sponsorStatus}
                      onValueChange={(v) =>
                        patch({ sponsorStatus: v as SponsorStatus })
                      }
                    >
                      <SelectTrigger className="h-12 border-2 border-navy/15 hover:border-navy/30">
                        <SelectValue placeholder="Select sponsor status" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPONSOR_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="py-3"
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="months"
                      className="text-sm font-semibold text-navy"
                    >
                      Months lawfully residing in Australia
                    </Label>
                    <Input
                      id="months"
                      type="number"
                      min={0}
                      max={1200}
                      value={form.sponsorMonthsInAustralia}
                      onChange={(e) =>
                        patch({
                          sponsorMonthsInAustralia:
                            parseInt(e.target.value, 10) || 0,
                        })
                      }
                      className="h-12 max-w-xs border-2 border-navy/15 focus:border-navy/30"
                    />
                    <p className="text-xs text-navy-muted">
                      Sponsorship generally requires at least 24 months of lawful
                      residence.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1 — Children (Balance of Family) */}
            {step === 1 && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl gradient-gold">
                    <Users className="h-5 w-5 text-navy" />
                  </span>
                  <div>
                    <h1 className="text-2xl font-bold text-navy">
                      Balance of Family
                    </h1>
                    <p className="text-sm text-navy-muted">
                      Where your children live determines this mandatory test.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Stepper
                    label="Total children (worldwide)"
                    hint="All of your children, in any country"
                    value={form.totalChildren}
                    onChange={(v) =>
                      patch({
                        totalChildren: v,
                        childrenInAustralia: Math.min(
                          form.childrenInAustralia,
                          v,
                        ),
                      })
                    }
                  />
                  <Stepper
                    label="Children in Australia"
                    hint="Permanent residents or citizens living in Australia"
                    value={form.childrenInAustralia}
                    max={form.totalChildren}
                    onChange={(v) => patch({ childrenInAustralia: v })}
                  />
                  <Stepper
                    label="Children in the largest other country"
                    hint="Most children living in any single other country"
                    value={form.childrenInLargestOtherCountry}
                    max={form.totalChildren}
                    onChange={(v) =>
                      patch({ childrenInLargestOtherCountry: v })
                    }
                  />
                </div>
              </div>
            )}

            {/* Step 2 — Finances & age */}
            {step === 2 && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl gradient-gold">
                    <Wallet className="h-5 w-5 text-navy" />
                  </span>
                  <div>
                    <h1 className="text-2xl font-bold text-navy">
                      Sponsor income &amp; your age
                    </h1>
                    <p className="text-sm text-navy-muted">
                      Used for the Assurance of Support check and visa path.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="income"
                      className="text-sm font-semibold text-navy"
                    >
                      Sponsor's taxable income (AUD / year)
                    </Label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-muted">
                        $
                      </span>
                      <Input
                        id="income"
                        type="number"
                        min={0}
                        step={1000}
                        value={form.sponsorTaxableIncome}
                        onChange={(e) =>
                          patch({
                            sponsorTaxableIncome:
                              parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="h-12 border-2 border-navy/15 pl-8 focus:border-navy/30"
                      />
                    </div>
                    <p className="text-xs text-navy-muted">
                      Indicative single-sponsor baseline is AUD 65,000.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="age"
                      className="text-sm font-semibold text-navy"
                    >
                      Your age (the applying parent)
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min={0}
                      max={120}
                      value={form.parentAge}
                      onChange={(e) =>
                        patch({ parentAge: parseInt(e.target.value, 10) || 0 })
                      }
                      className="h-12 max-w-xs border-2 border-navy/15 focus:border-navy/30"
                    />
                    <p className="text-xs text-navy-muted">
                      Age pension age or above points toward the Aged Parent
                      (804) track.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0 || isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="elite"
            size="lg"
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assessing…
              </>
            ) : isLastStep ? (
              <>
                Check my eligibility
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
