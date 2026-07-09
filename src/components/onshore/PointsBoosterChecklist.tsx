import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Circle, 
  Briefcase, 
  Languages, 
  FileCheck, 
  GraduationCap,
  ArrowRight,
  Sparkles,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  points: number;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  actionLabel?: string;
}

interface PointsBoosterChecklistProps {
  australianExperienceMonths?: number;
  currentEnglishLevel?: "competent" | "proficient" | "superior";
  hasSkillsAssessment?: boolean;
  className?: string;
}

export function PointsBoosterChecklist({
  australianExperienceMonths = 8,
  currentEnglishLevel = "proficient",
  hasSkillsAssessment = true,
  className,
}: PointsBoosterChecklistProps) {
  const initialItems: ChecklistItem[] = [
    {
      id: "aus-experience",
      label: "Claim 1 Year Australian Experience",
      points: 5,
      description: australianExperienceMonths >= 12 
        ? "Claimed! You have 12+ months of AU experience."
        : `${12 - australianExperienceMonths} months until you can claim this.`,
      icon: Briefcase,
      completed: australianExperienceMonths >= 12,
    },
    {
      id: "english-upgrade",
      label: "Upgrade English Test Score",
      points: currentEnglishLevel === "proficient" ? 10 : 20,
      description: currentEnglishLevel === "superior"
        ? "Maximum points achieved with Superior English."
        : `Upgrade to ${currentEnglishLevel === "proficient" ? "Superior" : "Proficient/Superior"} for more points.`,
      icon: Languages,
      completed: currentEnglishLevel === "superior",
      actionLabel: "Book PTE/IELTS",
    },
    {
      id: "skills-assessment",
      label: "Skills Assessment Validation",
      points: 0,
      description: hasSkillsAssessment 
        ? "Your skills have been verified by the assessing body."
        : "Required for all skilled visa applications.",
      icon: FileCheck,
      completed: hasSkillsAssessment,
      actionLabel: hasSkillsAssessment ? undefined : "Start Assessment",
    },
    {
      id: "naati",
      label: "NAATI Community Language",
      points: 5,
      description: "Earn 5 points by completing a NAATI CCL test in your language.",
      icon: Languages,
      completed: false,
      actionLabel: "Learn More",
    },
    {
      id: "professional-year",
      label: "Professional Year Program",
      points: 5,
      description: "12-month program combining coursework with internship experience.",
      icon: GraduationCap,
      completed: false,
      actionLabel: "Explore Programs",
    },
  ];

  const [items, setItems] = useState<ChecklistItem[]>(initialItems);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedPoints = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.points, 0);
  
  const potentialPoints = items
    .filter((item) => !item.completed)
    .reduce((sum, item) => sum + item.points, 0);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-navy" />
            </div>
            <span>Points Booster</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
              <Plus className="w-3 h-3 mr-1" />
              {potentialPoints} available
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-start gap-4 p-4 transition-colors",
                  item.completed ? "bg-accent/5" : "hover:bg-muted/30"
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                    item.completed
                      ? "bg-accent border-accent text-white"
                      : "border-border hover:border-accent/50"
                  )}
                >
                  {item.completed && <Check className="w-4 h-4" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className={cn(
                      "w-4 h-4 shrink-0",
                      item.completed ? "text-accent" : "text-muted-foreground"
                    )} />
                    <p className={cn(
                      "font-medium text-sm",
                      item.completed ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {item.label}
                    </p>
                    {item.points > 0 && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "ml-auto text-xs shrink-0",
                          item.completed 
                            ? "bg-accent/10 text-accent border-accent/30" 
                            : "bg-gold/10 text-gold border-gold/30"
                        )}
                      >
                        +{item.points} pts
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                  
                  {/* Action Button */}
                  {item.actionLabel && !item.completed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 text-xs text-primary hover:text-primary"
                    >
                      {item.actionLabel}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary Footer */}
        <div className="p-4 bg-muted/50 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Points Claimed</span>
            <span className="font-semibold text-accent">+{completedPoints}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
