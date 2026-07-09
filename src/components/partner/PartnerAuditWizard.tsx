import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Home,
  Users,
  Heart,
  Plane,
  Baby,
  MapPin,
  Building2,
  Banknote,
  ScrollText,
  FileCheck,
  CalendarClock,
  BadgeCheck,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  partnerService,
  type PartnerProfileInput,
  type ApplicantLocation,
  type PartnerAuditResult,
} from "@/services/partnerService";
import { PartnerReadinessDashboard } from "./PartnerReadinessDashboard";

type BooleanKey = Exclude<
  keyof PartnerProfileInput,
  "currentLocation" | "form888Count"
>;

interface EvidenceItem {
  key: BooleanKey;
  title: string;
  description: string;
  points: number;
  icon: typeof Wallet;
}

interface PillarStep {
  key: string;
  title: string;
  subtitle: string;
  icon: typeof Wallet;
  items: EvidenceItem[];
  hasForm888?: boolean;
}

const PILLAR_STEPS: PillarStep[] = [
  {
    key: "financial",
    title: "Financial Aspects",
    subtitle: "How do you share money and financial commitments?",
    icon: Wallet,
    items: [
      { key: "jointLeaseOrMortgage", title: "Joint lease or mortgage", description: "Both names on a rental lease or property loan", points: 40, icon: Building2 },
      { key: "jointBankAccounts", title: "Joint bank account(s)", description: "Shared account used for common expenses", points: 30, icon: Banknote },
      { key: "sharedUtilityBills", title: "Shared utility bills", description: "Electricity, gas, internet in both names", points: 30, icon: ScrollText },
    ],
  },
  {
    key: "household",
    title: "Nature of Household",
    subtitle: "How do you run your household together?",
    icon: Home,
    items: [
      { key: "sharedDomesticBills", title: "Shared domestic bills", description: "Documented split of household costs", points: 40, icon: ScrollText },
      { key: "jointChildResponsibility", title: "Joint responsibility for children", description: "Shared care and guardianship records", points: 30, icon: Baby },
      { key: "matchingAddressHistory", title: "Matching address history", description: "Same address across official records", points: 30, icon: MapPin },
    ],
  },
  {
    key: "social",
    title: "Social Aspects",
    subtitle: "How is your relationship recognised by others?",
    icon: Users,
    items: [
      { key: "sharedTravelItineraries", title: "Shared travel itineraries", description: "Joint bookings and trips together", points: 30, icon: Plane },
      { key: "jointSocialInvitations", title: "Joint social invitations", description: "Invitations addressed to you as a couple", points: 30, icon: Users },
    ],
    hasForm888: true,
  },
  {
    key: "commitment",
    title: "Commitment Aspects",
    subtitle: "How committed and formalised is your relationship?",
    icon: Heart,
    items: [
      { key: "livedTogether12Months", title: "Lived together 12+ months", description: "Continuous cohabitation for a year or more", points: 50, icon: CalendarClock },
      { key: "registeredRelationshipBDM", title: "Registered relationship (BDM)", description: "De facto relationship registered with a State/Territory registry", points: 50, icon: BadgeCheck },
    ],
  },
];

const INITIAL_FORM: PartnerProfileInput = {
  currentLocation: "onshore",
  jointBankAccounts: false,
  jointLeaseOrMortgage: false,
  sharedUtilityBills: false,
  sharedDomesticBills: false,
  jointChildResponsibility: false,
  matchingAddressHistory: false,
  sharedTravelItineraries: false,
  form888Count: 0,
  jointSocialInvitations: false,
  livedTogether12Months: false,
  registeredRelationshipBDM: false,
};

export function PartnerAuditWizard() {
  // step 0 = location; steps 1..4 = pillars
  const [step, setStep] = useState(0);
  const [locationChosen, setLocationChosen] = useState(false);
  const [form, setForm] = useState<PartnerProfileInput>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PartnerAuditResult | null>(null);

  const totalSteps = PILLAR_STEPS.length + 1;
  const progress = ((step + 1) / totalSteps) * 100;

  const toggle = (key: BooleanKey) =>
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  const setLocation = (loc: ApplicantLocation) => {
    setForm((prev) => ({ ...prev, currentLocation: loc }));
    setLocationChosen(true);
  };

  const adjustForm888 = (delta: number) =>
    setForm((prev) => ({
      ...prev,
      form888Count: Math.max(0, Math.min(50, prev.form888Count + delta)),
    }));

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const res = await partnerService.submitAudit(form);
      setResult(res);
    } catch (err) {
      toast.error("We couldn't score your assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === 0 && !locationChosen) return;
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
    } else {
      submit();
    }
  };

  const handleBack = () => step > 0 && setStep((s) => s - 1);

  const resetAll = () => {
    setResult(null);
    setForm(INITIAL_FORM);
    setLocationChosen(false);
    setStep(0);
  };

  if (result) {
    return <PartnerReadinessDashboard result={result} onRestart={resetAll} />;
  }

  const currentPillar = step > 0 ? PILLAR_STEPS[step - 1] : null;
  const canProceed = step === 0 ? locationChosen : true;
  const isLastStep = step === totalSteps - 1;

  return (
    <section className="relative min-h-screen bg-cloud">
      <div className="container max-w-2xl px-4 py-12 md:py-16">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-navy">
              Partner Visa Readiness Assessment
            </span>
            <span className="text-navy-muted">
              Step {step + 1} of {totalSteps}
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
            {/* Step 0 — Location */}
            {step === 0 && (
              <div>
                <h1 className="mb-2 text-2xl font-bold text-navy sm:text-3xl">
                  Where are you currently located?
                </h1>
                <p className="mb-8 text-navy-muted">
                  This determines whether you'd apply onshore (820) or offshore
                  (309).
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { loc: "onshore" as const, title: "In Australia", sub: "Onshore — Subclass 820", icon: Home },
                    { loc: "offshore" as const, title: "Outside Australia", sub: "Offshore — Subclass 309", icon: Plane },
                  ].map((opt) => {
                    const selected =
                      locationChosen && form.currentLocation === opt.loc;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.loc}
                        type="button"
                        onClick={() => setLocation(opt.loc)}
                        className={cn(
                          "flex flex-col items-start gap-3 rounded-2xl border-2 p-6 text-left transition-all",
                          selected
                            ? "border-gold bg-gold/5 shadow-soft-sm"
                            : "border-navy/10 bg-white hover:border-navy/25",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-xl",
                            selected ? "bg-gold/15" : "bg-navy/5",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              selected ? "text-gold-dark" : "text-navy",
                            )}
                          />
                        </span>
                        <span>
                          <span className="block text-base font-bold text-navy">
                            {opt.title}
                          </span>
                          <span className="block text-sm text-navy-muted">
                            {opt.sub}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Steps 1..4 — Pillars */}
            {currentPillar && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl gradient-gold">
                    <currentPillar.icon className="h-5 w-5 text-navy" />
                  </span>
                  <div>
                    <h1 className="text-2xl font-bold text-navy">
                      {currentPillar.title}
                    </h1>
                    <p className="text-sm text-navy-muted">
                      {currentPillar.subtitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentPillar.items.map((item) => {
                    const checked = form[item.key];
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggle(item.key)}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                          checked
                            ? "border-gold bg-gold/5 shadow-soft-sm"
                            : "border-navy/10 bg-white hover:border-navy/25",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                            checked ? "bg-gold/15" : "bg-navy/5",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              checked ? "text-gold-dark" : "text-navy",
                            )}
                          />
                        </span>
                        <span className="flex-1">
                          <span className="block text-base font-semibold text-navy">
                            {item.title}
                          </span>
                          <span className="block text-sm text-navy-muted">
                            {item.description}
                          </span>
                        </span>
                        <span className="flex flex-col items-end gap-1.5">
                          <span className="text-xs font-semibold text-glacier-dark">
                            +{item.points}
                          </span>
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                              checked
                                ? "border-gold bg-gold text-navy"
                                : "border-navy/20 bg-transparent",
                            )}
                          >
                            {checked && <Check className="h-3.5 w-3.5" />}
                          </span>
                        </span>
                      </button>
                    );
                  })}

                  {/* Form 888 stepper (Social pillar only) */}
                  {currentPillar.hasForm888 && (
                    <div
                      className={cn(
                        "flex items-center gap-4 rounded-2xl border-2 p-4 transition-all",
                        form.form888Count >= 2
                          ? "border-gold bg-gold/5 shadow-soft-sm"
                          : "border-navy/10 bg-white",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                          form.form888Count >= 2 ? "bg-gold/15" : "bg-navy/5",
                        )}
                      >
                        <FileCheck
                          className={cn(
                            "h-5 w-5",
                            form.form888Count >= 2 ? "text-gold-dark" : "text-navy",
                          )}
                        />
                      </span>
                      <span className="flex-1">
                        <span className="block text-base font-semibold text-navy">
                          Form 888 statutory declarations
                        </span>
                        <span className="block text-sm text-navy-muted">
                          From Australian citizens / PRs — 2 or more unlocks +40
                        </span>
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() => adjustForm888(-1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-navy/20 text-navy hover:bg-navy/5"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-lg font-bold text-navy">
                          {form.form888Count}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => adjustForm888(1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-navy/20 text-navy hover:bg-navy/5"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
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
            disabled={!canProceed || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scoring…
              </>
            ) : isLastStep ? (
              <>
                See my results
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
