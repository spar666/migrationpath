import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck,
  Briefcase,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Target,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const visaOptions = [
  { value: "482", label: "482 - Temporary Skill Shortage" },
  { value: "485", label: "485 - Temporary Graduate" },
  { value: "sid", label: "Skills in Demand (SID) - 2026" },
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

interface AuditFormData {
  visa: string;
  occupation: string;
  experience: string;
}

interface QuickAuditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: AuditFormData) => void;
}

const steps = [
  { id: "visa", label: "Current Visa", icon: FileCheck },
  { id: "occupation", label: "Occupation", icon: Briefcase },
  { id: "experience", label: "Experience", icon: Clock },
  { id: "result", label: "Results", icon: Target },
];

function calculateSuccessProbability(data: AuditFormData): number {
  let probability = 50;

  if (data.visa === "sid") probability += 25;
  else if (data.visa === "482") probability += 15;
  else if (data.visa === "485") probability += 10;

  const expBoost: Record<string, number> = {
    "0-1": 0,
    "1-2": 5,
    "2-3": 10,
    "3-5": 15,
    "5+": 20,
  };
  probability += expBoost[data.experience] || 0;

  return Math.min(95, Math.max(40, probability));
}

export function QuickAuditModal({ open, onOpenChange, onComplete }: QuickAuditModalProps) {
  const [occupationOptions, setOccupationOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AuditFormData>({
    visa: "",
    occupation: "",
    experience: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      apiClient.get<any>("/occupations")
        .then((response) => {
          const data = Array.isArray(response) ? response : (response?.data || []);
          setOccupationOptions(
            data.map((occ: any) => ({
              value: occ.anzsco_code || occ.id,
              label: occ.occupation_name || occ.title || "",
            }))
          );
        })
        .catch(() => {
          setOccupationOptions([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!formData.visa;
      case 1: return !!formData.occupation;
      case 2: return !!formData.experience;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      setIsAnalyzing(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentStep(3);
    } else if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 3) setShowResult(false);
    }
  };

  const handleComplete = () => {
    onComplete(formData);
    onOpenChange(false);
    setCurrentStep(0);
    setFormData({ visa: "", occupation: "", experience: "" });
    setShowResult(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setCurrentStep(0);
      setFormData({ visa: "", occupation: "", experience: "" });
      setShowResult(false);
    }, 300);
  };

  const successProbability = calculateSuccessProbability(formData);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/50 bg-card">
        <div className="gradient-navy p-6 pb-8">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold text-white mb-1">
              Quick Strategy Audit
            </DialogTitle>
            <p className="text-sm text-white/70">
              Answer 3 questions to reveal your PR pathway
            </p>
          </DialogHeader>

          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                        isCompleted
                          ? "bg-gold text-navy"
                          : isActive
                          ? "bg-white/20 text-white ring-2 ring-gold"
                          : "bg-white/10 text-white/40"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2 transition-colors",
                        isActive ? "text-gold font-medium" : "text-white/50"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn("h-0.5 w-8 mx-1 transition-colors", isCompleted ? "bg-gold" : "bg-white/20")} />
                  )}
                </div>
              );
            })}
          </div>

          <Progress value={progress} className="mt-6 h-1.5 bg-white/10" />
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="visa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Label className="text-base font-medium">
                  What's your current visa subclass?
                </Label>
                <Select
                  value={formData.visa}
                  onValueChange={(value) => setFormData({ ...formData, visa: value })}
                >
                  <SelectTrigger className="h-14 text-base">
                    <SelectValue placeholder="Select your visa" />
                  </SelectTrigger>
                  <SelectContent>
                    {visaOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-3">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="occupation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Label className="text-base font-medium">
                  What's your nominated occupation?
                </Label>
                <Select
                  value={formData.occupation}
                  onValueChange={(value) => setFormData({ ...formData, occupation: value })}
                >
                  <SelectTrigger className="h-14 text-base">
                    <SelectValue placeholder={loading ? "Loading occupations..." : "Select your occupation"} />
                  </SelectTrigger>
                  <SelectContent>
                    {occupationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-3">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="experience"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Label className="text-base font-medium">
                  How much Australian work experience do you have?
                </Label>
                <Select
                  value={formData.experience}
                  onValueChange={(value) => setFormData({ ...formData, experience: value })}
                >
                  <SelectTrigger className="h-14 text-base">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-3">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {currentStep === 3 && showResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Your PR Success Probability
                  </p>
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <motion.circle
                        cx="64" cy="64" r="56" fill="none"
                        stroke="url(#successGradient)" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(successProbability / 100) * 352} 352`}
                        initial={{ strokeDasharray: "0 352" }}
                        animate={{ strokeDasharray: `${(successProbability / 100) * 352} 352` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(38 45% 57%)" />
                          <stop offset="100%" stopColor="hsl(38 55% 68%)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        className="text-3xl font-bold text-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        {successProbability}%
                      </motion.span>
                      <span className="text-xs text-muted-foreground">Success Rate</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div className="text-sm">
                      <p className="font-medium">Points Potential Identified</p>
                      <p className="text-muted-foreground text-xs">
                        We found optimization opportunities for your profile
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/5 border border-gold/10">
                    <Target className="h-5 w-5 text-gold" />
                    <div className="text-sm">
                      <p className="font-medium">Pathway Recommendation Ready</p>
                      <p className="text-muted-foreground text-xs">
                        Save your strategy to see full breakdown
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          {currentStep > 0 && currentStep < 3 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isAnalyzing}
              variant="elite"
              className={cn("flex-1", currentStep === 0 && "w-full")}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
                </>
              ) : currentStep === 2 ? (
                <>
                  <Target className="w-4 h-4 mr-2" /> Calculate Success
                </>
              ) : (
                <>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleComplete} variant="elite" className="w-full h-12 shadow-gold-glow">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Save Strategy to Dashboard
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
