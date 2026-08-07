import { motion } from "framer-motion";
import { Clock, Globe, GraduationCap, Briefcase, Heart, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PointsConfigItem } from "@/hooks/usePointsConfig";

interface DynamicChoiceStepProps {
  category: string;
  title: string;
  description: string;
  options: PointsConfigItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const CATEGORY_ICONS: { [key: string]: typeof Clock } = {
  Age: Clock,
  English: Globe,
  Education: GraduationCap,
  Experience: Briefcase,
  Partner: Heart,
};

export function DynamicChoiceStep({
  category,
  title,
  description,
  options,
  selectedId,
  onSelect,
}: DynamicChoiceStepProps) {
  const Icon = CATEGORY_ICONS[category] || HelpCircle;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-gold mb-4">
          <Icon className="w-8 h-8 text-navy" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-navy">{title}</h2>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(option.id)}
            className={cn(
              "relative flex flex-col items-start p-5 rounded-xl border-2 text-left transition-all duration-200",
              selectedId === option.id
                ? "border-accent bg-sand shadow-gold-glow"
                : "border-border bg-card hover:border-accent/50 hover:shadow-md"
            )}
          >
            {/* Points Badge */}
            <div
              className={cn(
                "absolute top-4 right-4 px-2.5 py-1 rounded-lg text-sm font-bold",
                selectedId === option.id
                  ? "bg-accent text-navy"
                  : "bg-muted text-muted-foreground"
              )}
            >
              +{option.points_value}
            </div>

            {/* Option Content */}
            <div className="pr-16 space-y-2">
              <h3 className="font-semibold text-foreground text-lg">
                {option.label}
              </h3>
            </div>

            {/* Selection Indicator */}
            {selectedId === option.id && (
              <motion.div
                layoutId={`selection-${category}`}
                className="absolute inset-0 rounded-xl border-2 border-accent pointer-events-none"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
