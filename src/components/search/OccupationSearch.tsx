import { useState, useRef, useEffect } from "react";
import { Search, Loader2, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useOccupationSearch } from "@/hooks/useOccupationSearch";

// TODO: Define Occupation type from backend API
interface Occupation {
  id: string;
  title: string;
  anzsco_code: string;
  [key: string]: any;
}

interface OccupationSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (occupation: Occupation) => void;
  onFocus?: () => void;
  placeholder?: string;
  className?: string;
}

export function OccupationSearch({
  value,
  onChange,
  onSelect,
  onFocus,
  placeholder = "Search by occupation or ANZSCO code...",
  className,
}: OccupationSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results: suggestions, isLoading } = useOccupationSearch(value);

  useEffect(() => {
    if (suggestions.length > 0 && value.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    setHighlightedIndex(-1);
  }, [suggestions, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (occupation: Occupation) => {
    onChange(occupation.title);
    onSelect(occupation);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-5 w-5 text-navy-muted transition-colors group-focus-within:text-navy" />
          )}
        </div>

        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
            onFocus?.();
          }}
          onKeyDown={handleKeyDown}
          className="h-14 w-full rounded-xl border-2 border-navy/15 bg-white pl-12 pr-12 text-base shadow-sm transition-all focus:ring-2 focus:ring-navy/10 focus:border-navy/30"
        />

        {isOpen && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <ChevronUp className="h-5 w-5 text-navy-muted" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border-2 border-navy/15 bg-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-3 text-xs font-bold text-navy uppercase tracking-[0.15em] text-center border-b border-navy/10">
            High Priority Occupations
          </div>
          <ul className="max-h-[320px] overflow-y-auto divide-y divide-border/50">
            {suggestions.map((occ, index) => (
              <li
                key={occ.anzsco_code || index}
                className={cn(
                  "flex cursor-pointer items-center justify-between px-5 py-4 transition-all",
                  highlightedIndex === index
                    ? "bg-gold/5"
                    : index % 2 === 1 ? "bg-muted/20" : "bg-white",
                  "hover:bg-gold/5"
                )}
                onClick={() => handleSelect(occ)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-base font-semibold text-navy">
                    {occ.title}
                  </span>
                  <span className="text-sm font-medium text-glacier-dark">
                    ANZSCO {occ.anzsco_code}
                  </span>
                </div>
                <span className="inline-flex items-center rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-dark border border-gold/20">
                  Priority
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}