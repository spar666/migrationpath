import React from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { VISA_TYPES, VisaType, VisaMetadata } from "@/types/migrationRules";
import { Card, CardContent } from "@/components/ui/card";

interface VisaSelectorStepProps {
  selectedId: VisaType | null;
  onSelect: (visa: VisaMetadata) => void;
}

export function VisaSelectorStep({ selectedId, onSelect }: VisaSelectorStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-navy">Select Your Visa Type</h2>
        <p className="text-muted-foreground">
          Your visa selection determines which points test or eligibility criteria will be applied.
        </p>
      </div>

      <div className="grid gap-3">
        {VISA_TYPES.map((visa) => (
          <Card
            key={visa.id}
            className={cn(
              "relative overflow-hidden cursor-pointer transition-all duration-200 hover:border-accent/50",
              selectedId === visa.id 
                ? "border-accent bg-accent/5 ring-1 ring-accent" 
                : "border-border bg-card"
            )}
            onClick={() => onSelect(visa)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  selectedId === visa.id ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                )}>
                  {selectedId === visa.id ? <Check className="w-5 h-5" /> : <span className="text-sm font-bold">{visa.id}</span>}
                </div>
                <div>
                  <p className="font-semibold text-navy">{visa.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {visa.group} • {visa.action === "Points" ? "Points Test" : "Checklist"}
                  </p>
                </div>
              </div>
              <ChevronRight className={cn(
                "w-5 h-5 transition-transform",
                selectedId === visa.id ? "text-accent translate-x-1" : "text-muted-foreground"
              )} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
