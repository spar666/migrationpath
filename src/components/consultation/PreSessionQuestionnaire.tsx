import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Users,
  Shield,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  Loader2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { authService } from "@/services/authService";
import { toast } from "sonner";

interface PreSessionQuestionnaireProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface QuestionnaireData {
  // Step 1: Professional
  current_occupation: string;
  years_experience: number | null;
  english_test_type: string | null;
  english_scores: {
    listening?: number;
    reading?: number;
    writing?: number;
    speaking?: number;
    overall?: number;
  } | null;
  date_of_birth: string;

  // Step 2: Personal
  marital_status: string | null;
  has_children: boolean;
  partner_skills: {
    occupation?: string;
    years_experience?: number;
    english_test_type?: string;
    english_scores?: {
      listening?: number;
      reading?: number;
      writing?: number;
      speaking?: number;
      overall?: number;
    };
  } | null;

  // Step 3: Legal
  has_health_issues: boolean;
  has_criminal_record: boolean;
  visa_refusal_history: boolean;
}

const STEPS = [
  { id: 1, label: "Professional", icon: Briefcase },
  { id: 2, label: "Personal", icon: Users },
  { id: 3, label: "Legal", icon: Shield },
];

const ENGLISH_TESTS = [
  { value: "ielts", label: "IELTS" },
  { value: "pte", label: "PTE Academic" },
  { value: "toefl", label: "TOEFL iBT" },
  { value: "oet", label: "OET" },
  { value: "cambridge", label: "Cambridge C1/C2" },
  { value: "none", label: "No test yet" },
];

const MARITAL_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "de_facto", label: "De Facto" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

const EXPERIENCE_YEARS = [
  { value: "0", label: "Less than 1 year" },
  { value: "1", label: "1-2 years" },
  { value: "3", label: "3-4 years" },
  { value: "5", label: "5-7 years" },
  { value: "8", label: "8-10 years" },
  { value: "10", label: "10+ years" },
];

export function PreSessionQuestionnaire({
  open,
  onOpenChange,
  onComplete,
}: PreSessionQuestionnaireProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<QuestionnaireData>({
    current_occupation: "",
    years_experience: null,
    english_test_type: null,
    english_scores: null,
    date_of_birth: "",
    marital_status: null,
    has_children: false,
    partner_skills: null,
    has_health_issues: false,
    has_criminal_record: false,
    visa_refusal_history: false,
  });

  const progress = (step / STEPS.length) * 100;
  const showPartnerFields = data.marital_status === "married" || data.marital_status === "de_facto";

  const updateData = (updates: Partial<QuestionnaireData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const updateEnglishScore = (field: string, value: number) => {
    setData((prev) => ({
      ...prev,
      english_scores: {
        ...prev.english_scores,
        [field]: value,
      },
    }));
  };

  const updatePartnerSkills = (updates: Partial<NonNullable<QuestionnaireData["partner_skills"]>>) => {
    setData((prev) => ({
      ...prev,
      partner_skills: {
        ...prev.partner_skills,
        ...updates,
      },
    }));
  };

  const updatePartnerEnglishScore = (field: string, value: number) => {
    setData((prev) => ({
      ...prev,
      partner_skills: {
        ...prev.partner_skills,
        english_scores: {
          ...prev.partner_skills?.english_scores,
          [field]: value,
        },
      },
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.current_occupation.trim() !== "" && data.date_of_birth !== "";
      case 2:
        return data.marital_status !== null;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const user = await authService.me();
      if (!user) {
        toast.error("Please log in to continue");
        return;
      }

      await apiClient.post('/consultation/questionnaire', {
        responses: {
          current_occupation: data.current_occupation,
          years_experience: data.years_experience,
          english_test_type: data.english_test_type,
          english_scores: data.english_scores,
          date_of_birth: data.date_of_birth,
          marital_status: data.marital_status,
          has_children: data.has_children,
          partner_skills: data.partner_skills,
          has_health_issues: data.has_health_issues,
          has_criminal_record: data.has_criminal_record,
          visa_refusal_history: data.visa_refusal_history,
        },
      });

      toast.success("Assessment complete! Booking link is now available.");
      onComplete();
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Professional Background</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="occupation">Current or Target Occupation *</Label>
        <Input
          id="occupation"
          placeholder="e.g., Software Engineer, Accountant, Registered Nurse"
          value={data.current_occupation}
          onChange={(e) => updateData({ current_occupation: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob">Date of Birth *</Label>
        <Input
          id="dob"
          type="date"
          value={data.date_of_birth}
          onChange={(e) => updateData({ date_of_birth: e.target.value })}
          max={new Date().toISOString().split("T")[0]}
        />
      </div>

      <div className="space-y-2">
        <Label>Years of Experience in Occupation</Label>
        <Select
          value={data.years_experience?.toString() || ""}
          onValueChange={(v) => updateData({ years_experience: parseInt(v) })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select experience level" />
          </SelectTrigger>
          <SelectContent>
            {EXPERIENCE_YEARS.map((exp) => (
              <SelectItem key={exp.value} value={exp.value}>
                {exp.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>English Test Type</Label>
        <Select
          value={data.english_test_type || ""}
          onValueChange={(v) => updateData({ english_test_type: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your English test" />
          </SelectTrigger>
          <SelectContent>
            {ENGLISH_TESTS.map((test) => (
              <SelectItem key={test.value} value={test.value}>
                {test.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data.english_test_type && data.english_test_type !== "none" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border"
        >
          <Label className="text-sm text-muted-foreground">Enter Your Scores</Label>
          <div className="grid grid-cols-2 gap-3">
            {["listening", "reading", "writing", "speaking"].map((skill) => (
              <div key={skill} className="space-y-1">
                <Label className="text-xs capitalize">{skill}</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="9"
                  placeholder="0.0"
                  value={data.english_scores?.[skill as keyof typeof data.english_scores] || ""}
                  onChange={(e) => updateEnglishScore(skill, parseFloat(e.target.value))}
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Overall Score</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="9"
              placeholder="0.0"
              value={data.english_scores?.overall || ""}
              onChange={(e) => updateEnglishScore("overall", parseFloat(e.target.value))}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Personal Information</h3>
      </div>

      <div className="space-y-2">
        <Label>Marital Status *</Label>
        <Select
          value={data.marital_status || ""}
          onValueChange={(v) => updateData({ marital_status: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your status" />
          </SelectTrigger>
          <SelectContent>
            {MARITAL_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
        <Label htmlFor="children" className="cursor-pointer">
          Do you have dependent children?
        </Label>
        <Switch
          id="children"
          checked={data.has_children}
          onCheckedChange={(checked) => updateData({ has_children: checked })}
        />
      </div>

      {showPartnerFields && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-4 p-4 rounded-lg bg-accent/5 border border-accent/20"
        >
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
              Partner Points
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Your partner&apos;s skills may contribute additional points to your application.
          </p>

          <div className="space-y-2">
            <Label>Partner&apos;s Occupation</Label>
            <Input
              placeholder="e.g., Accountant, Engineer"
              value={data.partner_skills?.occupation || ""}
              onChange={(e) => updatePartnerSkills({ occupation: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Partner&apos;s Years of Experience</Label>
            <Select
              value={data.partner_skills?.years_experience?.toString() || ""}
              onValueChange={(v) => updatePartnerSkills({ years_experience: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_YEARS.map((exp) => (
                  <SelectItem key={exp.value} value={exp.value}>
                    {exp.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Partner&apos;s English Test</Label>
            <Select
              value={data.partner_skills?.english_test_type || ""}
              onValueChange={(v) => updatePartnerSkills({ english_test_type: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                {ENGLISH_TESTS.map((test) => (
                  <SelectItem key={test.value} value={test.value}>
                    {test.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {data.partner_skills?.english_test_type && data.partner_skills.english_test_type !== "none" && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
              <Label className="text-sm text-muted-foreground">Partner&apos;s Scores</Label>
              <div className="grid grid-cols-2 gap-3">
                {["listening", "reading", "writing", "speaking"].map((skill) => (
                  <div key={skill} className="space-y-1">
                    <Label className="text-xs capitalize">{skill}</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      placeholder="0.0"
                      value={data.partner_skills?.english_scores?.[skill as keyof NonNullable<typeof data.partner_skills>["english_scores"]] || ""}
                      onChange={(e) => updatePartnerEnglishScore(skill, parseFloat(e.target.value))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Legal & Health Declarations</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        These questions help us understand any factors that may affect your visa eligibility.
        All information is confidential.
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
          <div className="space-y-0.5">
            <Label htmlFor="health" className="cursor-pointer font-medium">
              Health Concerns
            </Label>
            <p className="text-xs text-muted-foreground">
              Any significant health conditions requiring treatment
            </p>
          </div>
          <Switch
            id="health"
            checked={data.has_health_issues}
            onCheckedChange={(checked) => updateData({ has_health_issues: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
          <div className="space-y-0.5">
            <Label htmlFor="criminal" className="cursor-pointer font-medium">
              Criminal History
            </Label>
            <p className="text-xs text-muted-foreground">
              Any criminal convictions or charges
            </p>
          </div>
          <Switch
            id="criminal"
            checked={data.has_criminal_record}
            onCheckedChange={(checked) => updateData({ has_criminal_record: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
          <div className="space-y-0.5">
            <Label htmlFor="refusal" className="cursor-pointer font-medium">
              Visa Refusal History
            </Label>
            <p className="text-xs text-muted-foreground">
              Previous visa refusals or cancellations from any country
            </p>
          </div>
          <Switch
            id="refusal"
            checked={data.visa_refusal_history}
            onCheckedChange={(checked) => updateData({ visa_refusal_history: checked })}
          />
        </div>
      </div>

      {(data.has_health_issues || data.has_criminal_record || data.visa_refusal_history) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            We&apos;ll discuss these factors during your consultation to find the best pathway forward.
          </p>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            2-minute assessment
          </div>
          <DialogTitle>Pre-Session Intake</DialogTitle>
          <DialogDescription>
            To provide the most accurate migration advice, please complete this quick assessment.
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-3 pt-2">
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isCompleted = s.id < step;
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    isActive
                      ? "text-primary font-medium"
                      : isCompleted
                      ? "text-accent"
                      : "text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="py-4 min-h-[300px]">
          <AnimatePresence mode="wait">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {step < STEPS.length ? (
            <Button onClick={handleNext} disabled={!canProceed()} className="gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Complete & Book
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
