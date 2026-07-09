import { motion } from "framer-motion";
import { Check, Clock, Globe, GraduationCap, Briefcase, Sparkles, Info, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Step {
  id: number;
  label: string;
  shortLabel: string;
  icon: typeof Clock;
  tooltip: string;
}

const CATEGORY_META_STEP: Record<string, { icon: typeof Clock; tooltip: string }> = {
  Age: {
    icon: Clock,
    tooltip: "2026 DHA Rules: Ages 25-32 receive maximum 30 points. Points decrease after 32, with no points awarded for 45+."
  },
  English: {
    icon: Globe,
    tooltip: "Superior English (IELTS 8+/PTE 79+) = 20 points. Proficient (IELTS 7+/PTE 65+) = 10 points. This is one of the biggest point boosters."
  },
  Education: {
    icon: GraduationCap,
    tooltip: "PhD = 20 points, Bachelor's/Master's = 15 points, Diploma = 10 points. Australian study adds +5 bonus points."
  },
  Experience: {
    icon: Briefcase,
    tooltip: "8+ years skilled experience = 15 points. Australian experience earns additional bonus points. Partner skills can add up to 10 points."
  },
  Partner: {
    icon: Heart,
    tooltip: "Single applicants and those with skilled partners receive maximum points. Partner English also adds points."
  },
  Results: {
    icon: Sparkles,
    tooltip: "See your total score and personalized recommendations based on 2026 invitation rounds."
  },
};

interface BreadcrumbStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  totalSteps?: number;
  stepLabels?: string[];
}

export function BreadcrumbStepper({
  currentStep,
  onStepClick,
  totalSteps,
  stepLabels
}: BreadcrumbStepperProps) {
  // Use dynamic steps if provided, otherwise use a default fallback
  const steps = stepLabels
    ? stepLabels.map((label, index) => {
      const meta = CATEGORY_META_STEP[label] || {
        icon: Clock,
        tooltip: `Select your ${label} options to see your points.`
      };
      return {
        id: index + 1,
        label,
        shortLabel: label.substring(0, 4),
        icon: meta.icon,
        tooltip: meta.tooltip,
      };
    })
    : []; // Fallback empty since the wizard always provides labels
  return (
    <div className="w-full">
      {/* Desktop Breadcrumb */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isClickable = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center relative">
                {/* Step Circle */}
                <motion.button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  whileHover={isClickable ? { scale: 1.05 } : undefined}
                  whileTap={isClickable ? { scale: 0.95 } : undefined}
                  className={cn(
                    "relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300",
                    isCompleted && "gradient-navy shadow-navy-glow cursor-pointer",
                    isActive && "gradient-gold shadow-gold-glow ring-4 ring-accent/20",
                    !isCompleted && !isActive && "bg-muted border-2 border-border",
                    isClickable && "hover:ring-2 hover:ring-primary/30"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <Icon className={cn(
                      "w-6 h-6",
                      isActive ? "text-navy" : "text-muted-foreground"
                    )} />
                  )}

                  {/* Active Pulse Ring */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-accent"
                      initial={{ opacity: 1, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.3 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.button>

                {/* Label with Tooltip */}
                <div className="flex items-center gap-1 mt-3">
                  <span className={cn(
                    "text-sm font-medium",
                    isCompleted || isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-0.5 rounded-full hover:bg-muted transition-colors">
                        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-xs p-4 bg-card border border-border shadow-lg"
                    >
                      <div className="space-y-2">
                        <p className="font-semibold text-foreground">Why this matters</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.tooltip}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 mx-4 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      isCompleted ? "gradient-navy" : "bg-transparent"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted ? "100%" : "0%" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Breadcrumb */}
      <div className="flex md:hidden items-center justify-between px-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                  isCompleted && "gradient-navy",
                  isActive && "gradient-gold shadow-gold-glow",
                  !isCompleted && !isActive && "bg-muted"
                )}>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive ? "text-navy" : "text-muted-foreground"
                    )} />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-1.5 font-medium",
                  isCompleted || isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.shortLabel}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 rounded-full bg-muted">
                  {isCompleted && (
                    <div className="h-full w-full gradient-navy rounded-full" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
