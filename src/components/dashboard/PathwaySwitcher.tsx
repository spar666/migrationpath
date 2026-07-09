import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Settings2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Local type definitions
type PersonaType = "student" | "skilled" | "onshore-skilled" | "partner" | "employer";

interface Persona {
  id: PersonaType;
  name: string;
  description: string;
}

const personas: Persona[] = [
  { id: "student", name: "Student", description: "Aspiring migration through skill acquisition" },
  { id: "skilled", name: "Skilled", description: "Skilled professional seeking migration" },
  { id: "onshore-skilled", name: "Onshore Skilled", description: "Currently in Australia on skilled visa" },
  { id: "partner", name: "Partner", description: "Sponsored by Australian partner" },
  { id: "employer", name: "Employer", description: "Seeking skilled migrants" },
];

interface PathwaySwitcherProps {
  currentPersona: PersonaType;
  userId: string;
  onPersonaChange: (newPersona: PersonaType) => void;
}

export function PathwaySwitcher({ currentPersona, userId, onPersonaChange }: PathwaySwitcherProps) {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>(currentPersona);

  const handleSave = async () => {
    if (selectedPersona === currentPersona) {
      setOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      // TODO: Replace with actual backend API endpoint POST /api/v1/personas/switch
      onPersonaChange(selectedPersona);
      toast.success("Pathway updated successfully!");
      setOpen(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Switch Pathway</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch Your Migration Pathway</DialogTitle>
          <DialogDescription>
            Select the pathway that best describes your current migration goal. Your dashboard will update instantly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {personas.map((persona) => {
            const getEmoji = (id: PersonaType) => {
              const emojiMap: Record<PersonaType, string> = {
                student: "🎓",
                skilled: "💼",
                "onshore-skilled": "🏢",
                partner: "👫",
                employer: "🏭",
              };
              return emojiMap[id] || "🌍";
            };

            const isSelected = selectedPersona === persona.id;
            const isCurrent = currentPersona === persona.id;
            
            return (
              <button
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border text-left transition-all",
                  isSelected 
                    ? "border-accent bg-accent/10 ring-1 ring-accent" 
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg",
                  isSelected ? "bg-accent" : "bg-muted"
                )}>
                  {getEmoji(persona.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("font-medium", isSelected && "text-foreground")}>
                      {persona.name}
                    </p>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{persona.description}</p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleSave} 
            disabled={isUpdating || selectedPersona === currentPersona}
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
