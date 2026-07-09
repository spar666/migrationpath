import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Local type definitions
type PersonaType = "skilled" | "onshore-skilled" | "student" | "partner" | "employer";

const personas = [
  { id: "student" as const, name: "Student", description: "Australian study to PR" },
  { id: "skilled" as const, name: "Skilled", description: "Points-based migration" },
  { id: "onshore-skilled" as const, name: "Onshore", description: "Australian worker" },
  { id: "partner" as const, name: "Partner", description: "Partnered migration" },
  { id: "employer" as const, name: "Employer", description: "Employer sponsored" },
];

interface PersonaPickerProps {
  selected: PersonaType;
  onChange: (persona: PersonaType) => void;
}

export function PersonaPicker({ selected, onChange }: PersonaPickerProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobilePersonaPicker selected={selected} onChange={onChange} />;
  }

  return <DesktopPersonaPicker selected={selected} onChange={onChange} />;
}

function DesktopPersonaPicker({ selected, onChange }: PersonaPickerProps) {
  const getEmoji = (id: string) => {
    const emojiMap: Record<string, string> = {
      student: "🎓",
      skilled: "💼",
      "onshore-skilled": "🏢",
      partner: "💑",
      employer: "👔"
    };
    return emojiMap[id] || "📋";
  };

  return (
    <div className="inline-flex items-center rounded-xl bg-card border border-border p-1.5 shadow-sm">
      {personas.map((persona) => {
        const isSelected = selected === persona.id;

        return (
          <button
            key={persona.id}
            onClick={() => onChange(persona.id as PersonaType)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isSelected
                ? "text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="activePersona"
                className="absolute inset-0 gradient-navy rounded-lg"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 text-lg">{getEmoji(persona.id)}</span>
            <span className="relative z-10">{persona.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function MobilePersonaPicker({ selected, onChange }: PersonaPickerProps) {
  const getEmoji = (id: string) => {
    const emojiMap: Record<string, string> = {
      student: "🎓",
      skilled: "💼",
      "onshore-skilled": "🏢",
      partner: "💑",
      employer: "👔"
    };
    return emojiMap[id] || "📋";
  };

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
      {personas.map((persona) => {
        const isSelected = selected === persona.id;

        return (
          <motion.button
            key={persona.id}
            onClick={() => onChange(persona.id as PersonaType)}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
              isSelected
                ? "gradient-navy border-transparent text-white shadow-navy-glow"
                : "bg-card border-border text-foreground hover:border-glacier/50"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                isSelected ? "bg-accent/20" : "bg-muted"
              )}
            >
              {getEmoji(persona.id)}
            </div>
            <div className="text-center">
              <p
                className={cn(
                  "font-semibold text-sm",
                  isSelected ? "text-white" : "text-foreground"
                )}
              >
                {persona.name}
              </p>
              <p
                className={cn(
                  "text-xs mt-0.5 line-clamp-1",
                  isSelected ? "text-white/70" : "text-muted-foreground"
                )}
              >
                {persona.description}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
