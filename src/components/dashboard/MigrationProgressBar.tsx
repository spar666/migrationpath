import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Local type definitions
type PersonaType = "student" | "skilled" | "onshore-skilled" | "partner" | "employer";

interface MigrationProgressBarProps {
  persona: PersonaType;
  currentStep?: number;
}

const journeySteps: Record<PersonaType, string[]> = {
  student: ["Enrollment", "485 Visa", "Skills Assessment", "EOI Submitted", "PR Granted"],
  skilled: ["Skills Assessment", "EOI Submitted", "Invitation", "Visa Lodged", "PR Granted"],
  "onshore-skilled": ["Experience Building", "Skills Validation", "EOI Optimized", "State Nomination", "PR Granted"],
  partner: ["Documentation", "Application Lodged", "Stage 1 Grant", "Waiting Period", "Stage 2 Grant"],
  employer: ["Nomination", "Visa Lodged", "Visa Grant", "2-Year Tenure", "186 PR"],
};

export function MigrationProgressBar({ persona, currentStep = 1 }: MigrationProgressBarProps) {
  const steps = journeySteps[persona] || journeySteps.student;
  const progressPercent = ((currentStep) / steps.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Your Migration Journey</h3>
        <span className="text-xs text-muted-foreground">
          Step {currentStep} of {steps.length}
        </span>
      </div>
      
      <Progress value={progressPercent} className="h-2" />
      
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;

          return (
            <div 
              key={step} 
              className={cn(
                "flex flex-col items-center gap-1.5 flex-1",
                index === 0 && "items-start",
                index === steps.length - 1 && "items-end"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                isComplete && "bg-success text-success-foreground",
                isCurrent && "bg-accent text-accent-foreground ring-2 ring-accent/30",
                isPending && "bg-muted text-muted-foreground"
              )}>
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium text-center leading-tight max-w-16",
                isComplete && "text-success",
                isCurrent && "text-foreground",
                isPending && "text-muted-foreground"
              )}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
