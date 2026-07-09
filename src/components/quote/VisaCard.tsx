import { cn } from "@/lib/utils";
import { Check, Sparkles } from "lucide-react";

interface VisaCardProps {
  code: string;
  name: string;
  description: string;
  professionalFee: number;
  governmentFee: number;
  isSelected: boolean;
  onSelect: () => void;
  popular?: boolean;
}

export function VisaCard({
  code,
  name,
  description,
  professionalFee,
  governmentFee,
  isSelected,
  onSelect,
  popular,
}: VisaCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative w-full p-5 md:p-6 rounded-xl border text-left transition-all duration-200",
        "shadow-card hover:shadow-card-hover hover:-translate-y-0.5",
        isSelected
          ? "border-accent bg-accent/5 ring-1 ring-accent/20"
          : "border-border bg-card hover:border-primary/20"
      )}
    >
      {popular && (
        <span className="absolute -top-3 left-4 inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded-full shadow-soft-sm">
          <Sparkles className="w-3 h-3" />
          Most Popular
        </span>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
              Subclass {code}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1 leading-tight">{name}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              From <span className="font-bold text-foreground text-base">${professionalFee.toLocaleString()}</span>
            </span>
          </div>
        </div>
        
        <div
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-1",
            isSelected
              ? "bg-accent border-accent shadow-glow-accent"
              : "border-border bg-secondary"
          )}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-accent-foreground" />}
        </div>
      </div>
    </button>
  );
}
