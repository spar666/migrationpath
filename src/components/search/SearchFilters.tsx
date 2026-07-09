import { useState } from "react";
import { Filter, X, MapPin, FileCheck, Calendar, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface FilterState {
  isRegional: boolean | null;
  agePoints: number;
  englishPoints: number;
  visaSubclasses: string[];
}

interface SearchFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const visaSubclassOptions = [
  { value: "189", label: "189", description: "Skilled Independent" },
  { value: "190", label: "190", description: "State Nominated" },
  { value: "491", label: "491", description: "Regional Provisional" },
];

// Age points mapping
const agePointsLabels: Record<number, string> = {
  0: "Any Age",
  25: "25-32 (30 pts)",
  30: "33-39 (25 pts)",
  15: "40-44 (15 pts)",
};

// English points mapping
const englishPointsLabels: Record<number, string> = {
  0: "Any Level",
  10: "Competent (10 pts)",
  20: "Proficient (20 pts)",
};

function FilterContent({
  filters,
  onFiltersChange,
}: SearchFiltersProps) {
  const toggleVisaSubclass = (visa: string) => {
    const current = filters.visaSubclasses;
    const updated = current.includes(visa)
      ? current.filter((v) => v !== visa)
      : [...current, visa];
    onFiltersChange({ ...filters, visaSubclasses: updated });
  };

  const activeFilterCount = [
    filters.isRegional !== null,
    filters.agePoints > 0,
    filters.englishPoints > 0,
    filters.visaSubclasses.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Location Type - Regional vs Metro */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <MapPin className="h-4 w-4 text-accent" />
          Location Type
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={filters.isRegional === true ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 rounded-xl transition-all h-11 text-sm font-semibold",
              filters.isRegional === true
                ? "bg-gold text-navy hover:bg-gold/90 shadow-sm"
                : "border-navy/15 text-navy hover:bg-navy/5"
            )}
            onClick={() =>
              onFiltersChange({
                ...filters,
                isRegional: filters.isRegional === true ? null : true,
              })
            }
          >
            <span className="mr-1.5">🌾</span>
            Regional (+5)
          </Button>
          <Button
            type="button"
            variant={filters.isRegional === false ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 rounded-xl transition-all h-11 text-sm font-semibold",
              filters.isRegional === false
                ? "bg-navy text-white hover:bg-navy-light shadow-sm"
                : "border-navy/15 text-navy hover:bg-navy/5"
            )}
            onClick={() =>
              onFiltersChange({
                ...filters,
                isRegional: filters.isRegional === false ? null : false,
              })
            }
          >
            <span className="mr-1.5">🏙️</span>
            Metro
          </Button>
        </div>
      </div>

      {/* Age Points Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy">
            <Calendar className="h-4 w-4 text-navy-muted" />
            Age Points
          </div>
          <span className="text-sm font-semibold text-gold-dark">
            {filters.agePoints > 0 ? `${filters.agePoints} pts` : ''}
          </span>
        </div>
        <Slider
          value={[filters.agePoints]}
          onValueChange={([value]) =>
            onFiltersChange({ ...filters, agePoints: value })
          }
          max={30}
          step={5}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Any</span>
          <span>15 pts</span>
          <span>25 pts</span>
          <span>30 pts</span>
        </div>
      </div>

      {/* English Points Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy">
            <Languages className="h-4 w-4 text-navy-muted" />
            English Score
          </div>
          <span className="text-sm font-semibold text-gold-dark">
            {englishPointsLabels[filters.englishPoints] || ''}
          </span>
        </div>
        <Slider
          value={[filters.englishPoints]}
          onValueChange={([value]) =>
            onFiltersChange({ ...filters, englishPoints: value })
          }
          max={20}
          step={10}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Any</span>
          <span>Competent</span>
          <span>Proficient</span>
        </div>
      </div>

      {/* Visa Subclass Chips */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-navy">
          <FileCheck className="h-4 w-4 text-navy-muted" />
          Visa Subclass
        </div>
        <div className="flex flex-wrap gap-2">
          {visaSubclassOptions.map((visa) => {
            const isSelected = filters.visaSubclasses.includes(visa.value);
            return (
              <button
                key={visa.value}
                type="button"
                onClick={() => toggleVisaSubclass(visa.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all border",
                  isSelected
                    ? "bg-gold/10 text-navy border-gold shadow-sm"
                    : "bg-white text-navy-muted border-navy/15 hover:bg-navy/5 hover:text-navy"
                )}
              >
                <span className="font-bold">{visa.label}</span>
                <span className="text-xs opacity-80">
                  {visa.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() =>
            onFiltersChange({
              isRegional: null,
              agePoints: 0,
              englishPoints: 0,
              visaSubclasses: [],
            })
          }
        >
          <X className="mr-2 h-4 w-4" />
          Clear all filters
        </Button>
      )}
    </div>
  );
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const activeFilterCount = [
    filters.isRegional !== null,
    filters.agePoints > 0,
    filters.englishPoints > 0,
    filters.visaSubclasses.length > 0,
  ].filter(Boolean).length;

  const TriggerButton = (
    <Button
      type="button"
      variant="outline"
      className="h-14 gap-2 rounded-xl border-border px-4 text-muted-foreground hover:text-foreground"
    >
      <Filter className="h-4 w-4" />
      <span className="hidden sm:inline">Filters</span>
      {activeFilterCount > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {activeFilterCount}
        </span>
      )}
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filter Pathways</DrawerTitle>
            <DrawerDescription>
              Refine your search with PR-specific filters
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90">
                Apply Filters
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
      <PopoverContent
        className="w-96 border-navy/10 bg-white p-6 shadow-xl"
        align="end"
        sideOffset={8}
      >
        <div className="mb-6">
          <h4 className="text-lg font-bold text-navy">Filter Pathways</h4>
          <p className="text-sm text-navy-muted">
            Refine your search with PR-specific filters
          </p>
        </div>
        <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
      </PopoverContent>
    </Popover>
  );
}
