import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Clock,
  FileCheck,
  ArrowRight,
  Loader2,
  GraduationCap,
  Users,
  Heart,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { apiClient } from "@/lib/apiClient";

type Goal = "skilled" | "student" | "family";
type Step = "goal" | "skilled" | "family";

const STUDENT_ROUTE = "/pathways/student";
const FAMILY_ROUTE = "/pathways/partner";

const visaOptions = [
  { value: "482", label: "482 - Temporary Skill Shortage" },
  { value: "485", label: "485 - Temporary Graduate" },
  { value: "sid", label: "Skills in Demand (SID)" },
  { value: "407", label: "407 - Training Visa" },
  { value: "other", label: "Other Work Visa" },
];

const experienceOptions = [
  { value: "0-1", label: "Less than 1 year" },
  { value: "1-2", label: "1-2 years" },
  { value: "2-3", label: "2-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5+", label: "5+ years" },
];

const relationshipOptions = [
  { value: "married", label: "Married" },
  { value: "de-facto", label: "De facto partner" },
  { value: "engaged", label: "Engaged / prospective marriage" },
  { value: "parent", label: "Parent of an Australian" },
];

const sponsorOptions = [
  { value: "citizen", label: "Australian citizen" },
  { value: "pr", label: "Permanent resident" },
  { value: "eligible-nz", label: "Eligible New Zealand citizen" },
  { value: "unsure", label: "Not sure yet" },
];

export interface AuditFormData {
  goal: Goal;
  visa: string;
  occupation: string;
  experience: string;
  relationshipStatus?: string;
  sponsorStatus?: string;
}

interface FastAuditFormProps {
  onComplete: (data: AuditFormData) => void;
  onBack: () => void;
}

const goalCards: {
  value: Goal;
  title: string;
  description: string;
  icon: typeof Briefcase;
}[] = [
  {
    value: "skilled",
    title: "Skilled / Employer",
    description: "Points-tested or employer-sponsored work visas",
    icon: Briefcase,
  },
  {
    value: "student",
    title: "Student",
    description: "Study in Australia as a pathway to PR",
    icon: GraduationCap,
  },
  {
    value: "family",
    title: "Partner / Parent",
    description: "Sponsored by a partner or family member",
    icon: Users,
  },
];

export function FastAuditForm({ onComplete, onBack }: FastAuditFormProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("goal");
  const [occupationOptions, setOccupationOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AuditFormData>({
    goal: "skilled",
    visa: "",
    occupation: "",
    experience: "",
    relationshipStatus: "",
    sponsorStatus: "",
  });

  // Occupations are only needed for the skilled branch; fetch lazily when reached.
  useEffect(() => {
    if (step !== "skilled" || occupationOptions.length > 0) return;
    setLoading(true);
    apiClient
      .get<any>("/occupations")
      .then((response) => {
        const data = Array.isArray(response)
          ? response
          : response?.data || [];
        setOccupationOptions(
          data.map((occ: any) => ({
            value: occ.anzsco_code || occ.id,
            label: occ.occupation_name || occ.title || "",
          })),
        );
      })
      .catch(() => setOccupationOptions([]))
      .finally(() => setLoading(false));
  }, [step, occupationOptions.length]);

  // ---- Step 1: goal selection routes the whole flow ----
  const handleSelectGoal = (goal: Goal) => {
    setFormData((prev) => ({ ...prev, goal }));
    if (goal === "student") {
      navigate(STUDENT_ROUTE);
      return;
    }
    setStep(goal === "family" ? "family" : "skilled");
  };

  // ---- Skilled branch ----
  const skilledFilled = [
    formData.visa,
    formData.occupation,
    formData.experience,
  ].filter(Boolean).length;
  const skilledProgress = (skilledFilled / 3) * 100;
  const skilledComplete = skilledFilled === 3;

  const submitSkilled = async () => {
    if (!skilledComplete) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsSubmitting(false);
    onComplete({ ...formData, goal: "skilled" });
  };

  // ---- Family branch ----
  const familyComplete = Boolean(
    formData.relationshipStatus && formData.sponsorStatus,
  );

  const submitFamily = async () => {
    if (!familyComplete) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSubmitting(false);
    // Family onboarding lives in the relationship form engine.
    navigate(FAMILY_ROUTE);
  };

  const backToGoal = () => {
    setStep("goal");
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-glacier-dark">
          60-Second Strategy Audit
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-glass">
        <AnimatePresence mode="wait">
          {/* ---------- Step 1: Goal ---------- */}
          {step === "goal" && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
            >
              <h3 className="mb-1 text-lg font-bold text-navy">
                What is your primary goal for migrating to Australia?
              </h3>
              <p className="mb-6 text-sm text-navy-muted">
                We'll tailor the next questions to your pathway.
              </p>
              <div className="space-y-3">
                {goalCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.value}
                      type="button"
                      onClick={() => handleSelectGoal(card.value)}
                      className="group flex w-full items-center gap-4 rounded-xl border-2 border-navy/10 bg-background p-4 text-left transition-all hover:border-gold/40 hover:bg-gold/5"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/5 group-hover:bg-gold/10">
                        <Icon className="h-5 w-5 text-navy group-hover:text-gold-dark" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-base font-semibold text-navy">
                          {card.title}
                        </span>
                        <span className="block text-sm text-navy-muted">
                          {card.description}
                        </span>
                      </span>
                      <ArrowRight className="h-5 w-5 text-navy-muted transition-transform group-hover:translate-x-1 group-hover:text-navy" />
                    </button>
                  );
                })}
              </div>
              <button
                onClick={onBack}
                className="mt-6 w-full py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {/* ---------- Step 2a: Skilled / Employer ---------- */}
          {step === "skilled" && (
            <motion.div
              key="skilled"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    Skilled &amp; Employer pathway
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {skilledComplete ? "Ready!" : `${3 - skilledFilled} to go`}
                  </p>
                </div>
                <Progress value={skilledProgress} className="h-2 bg-muted" />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileCheck className="w-4 h-4 text-accent" />
                    Current Visa
                  </Label>
                  <Select
                    value={formData.visa}
                    onValueChange={(value) =>
                      setFormData({ ...formData, visa: value })
                    }
                  >
                    <SelectTrigger className="h-14 text-base border-border bg-background hover:border-glacier/50 transition-colors">
                      <SelectValue placeholder="Select your visa subclass" />
                    </SelectTrigger>
                    <SelectContent>
                      {visaOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="py-3"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Briefcase className="w-4 h-4 text-primary" />
                    ANZSCO Occupation
                  </Label>
                  <Select
                    value={formData.occupation}
                    onValueChange={(value) =>
                      setFormData({ ...formData, occupation: value })
                    }
                  >
                    <SelectTrigger className="h-14 text-base border-border bg-background hover:border-glacier/50 transition-colors">
                      <SelectValue
                        placeholder={
                          loading
                            ? "Loading occupations..."
                            : "Select your occupation"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {occupationOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="py-3"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Clock className="w-4 h-4 text-glacier-dark" />
                    Years of Experience
                  </Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) =>
                      setFormData({ ...formData, experience: value })
                    }
                  >
                    <SelectTrigger className="h-14 text-base border-border bg-background hover:border-glacier/50 transition-colors">
                      <SelectValue placeholder="Select years of experience" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="py-3"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button
                  onClick={submitSkilled}
                  disabled={!skilledComplete || isSubmitting}
                  variant="elite"
                  size="lg"
                  className={cn(
                    "w-full h-14 text-base transition-all duration-300",
                    skilledComplete && !isSubmitting && "shadow-gold-glow",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Your Profile...
                    </>
                  ) : (
                    <>
                      Get My Strategy
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
                <button
                  onClick={backToGoal}
                  className="w-full py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Change goal
                </button>
              </div>
            </motion.div>
          )}

          {/* ---------- Step 2b: Partner / Parent ---------- */}
          {step === "family" && (
            <motion.div
              key="family"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground">
                  Family &amp; Partner pathway
                </p>
                <p className="text-xs text-muted-foreground">
                  No work or occupation details needed here.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Heart className="w-4 h-4 text-accent" />
                    Relationship status
                  </Label>
                  <Select
                    value={formData.relationshipStatus}
                    onValueChange={(value) =>
                      setFormData({ ...formData, relationshipStatus: value })
                    }
                  >
                    <SelectTrigger className="h-14 text-base border-border bg-background hover:border-glacier/50 transition-colors">
                      <SelectValue placeholder="Select your relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="py-3"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <UserCheck className="w-4 h-4 text-primary" />
                    Your sponsor is a…
                  </Label>
                  <Select
                    value={formData.sponsorStatus}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sponsorStatus: value })
                    }
                  >
                    <SelectTrigger className="h-14 text-base border-border bg-background hover:border-glacier/50 transition-colors">
                      <SelectValue placeholder="Select sponsor status" />
                    </SelectTrigger>
                    <SelectContent>
                      {sponsorOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="py-3"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button
                  onClick={submitFamily}
                  disabled={!familyComplete || isSubmitting}
                  variant="elite"
                  size="lg"
                  className={cn(
                    "w-full h-14 text-base transition-all duration-300",
                    familyComplete && !isSubmitting && "shadow-gold-glow",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Preparing your check...
                    </>
                  ) : (
                    <>
                      Continue to Family Eligibility
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
                <button
                  onClick={backToGoal}
                  className="w-full py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Change goal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Your information is secure and never shared
      </p>
    </motion.div>
  );
}
