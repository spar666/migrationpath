import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useOccupationSearch, useRealSearch, OccupationSearchResult } from "@/hooks/useOccupationSearch";
import { cn } from "@/lib/utils";
import { VisaEligibilityCard } from "./VisaEligibilityCard";

interface OccupationSearchToolProps {
  className?: string;
  onSelectOccupation?: (occupation: OccupationSearchResult) => void;
}

export function OccupationSearchTool({ className, onSelectOccupation }: OccupationSearchToolProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedOccupation, setSelectedOccupation] = useState<OccupationSearchResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results: occupationResults, isLoading: isOccupationLoading } = useOccupationSearch(query);
  const { results: realSearchResults, isLoading: isRealSearchLoading } = useRealSearch(query);

  const isLoading = isOccupationLoading || isRealSearchLoading;

  useEffect(() => {
    const hasResults = occupationResults.length > 0 || realSearchResults.length > 0;
    if ((hasResults || isLoading) && query.length >= 2) {
      setIsOpen(true);
    } else if (query.length < 2) {
      setIsOpen(false);
    }
    setHighlightedIndex(-1);
  }, [occupationResults, realSearchResults, query, isLoading]);

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
        setHighlightedIndex((prev) =>
          prev < occupationResults.length + realSearchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && (occupationResults[highlightedIndex] || realSearchResults[highlightedIndex])) {
          handleSelect(occupationResults[highlightedIndex] || realSearchResults[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (occupation: OccupationSearchResult) => {
    setQuery(occupation.title);
    setSelectedOccupation(occupation);
    setIsOpen(false);
    onSelectOccupation?.(occupation);
    inputRef.current?.blur();
  };

  const getListBadges = (occ: OccupationSearchResult) => {
    const badges: string[] = [];
    if (occ.on_mltssl) badges.push("MLTSSL");
    if (occ.on_stsol) badges.push("STSOL");
    if (occ.on_rol) badges.push("ROL");
    return badges;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Input */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search by occupation or ANZSCO code..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selectedOccupation) setSelectedOccupation(null);
            }}
            onFocus={() => {
              if (occupationResults?.length > 0 && query.length >= 2) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="h-14 w-full rounded-xl border-border bg-card pl-12 pr-12 text-base shadow-sm transition-shadow focus:shadow-md"
          />
          {isLoading ? (
            <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          ) : query.length > 0 ? (
            <ChevronDown
              className={cn(
                "absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          ) : null}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && (occupationResults.length > 0 || realSearchResults.length > 0 || isLoading) && (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg animate-fade-in">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border flex justify-between items-center">
              <span>Search Results</span>
              {isLoading && (
                <span className="flex items-center gap-1.5 text-[10px] normal-case text-accent font-normal">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating...
                </span>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {/* Occupation Results Section */}
              {occupationResults.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30">
                    Occupations
                  </div>
                  <ul>
                    {occupationResults.map((occupation, index) => (
                      <li
                        key={`occ-${occupation.id}`}
                        className={cn(
                          "flex cursor-pointer items-center justify-between px-4 py-3 transition-colors",
                          highlightedIndex === index ? "bg-accent/10" : "hover:bg-muted/50"
                        )}
                        onClick={() => handleSelect(occupation)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground">
                            {occupation.title}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ANZSCO {occupation.anzsco_code}
                          </span>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {getListBadges(occupation).map((badge) => (
                            <span
                              key={badge}
                              className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Real Search Results Section */}
              {realSearchResults.length > 0 && (
                <div className="py-2 border-t border-border/50">
                  <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30">
                    General Results
                  </div>
                  <ul className="py-1">
                    {Array.isArray(realSearchResults) && realSearchResults.map((result: any, index) => (
                      <li
                        key={`real-${index}`}
                        className="flex cursor-pointer items-center px-4 py-2.5 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {result.title || result.name || JSON.stringify(result).substring(0, 30)}
                          </span>
                          {result.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {result.description}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Loading State when no results yet */}
              {isLoading && occupationResults.length === 0 && realSearchResults.length === 0 && (
                <div className="px-4 py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-accent/60" />
                  <p className="text-sm animate-pulse">Searching across all sources...</p>
                </div>
              )}

              {/* No results message */}
              {!isLoading && query.length >= 2 && occupationResults.length === 0 && realSearchResults.length === 0 && (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  No matches found for "{query}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Visa Eligibility Card */}
      {selectedOccupation && (
        <VisaEligibilityCard occupation={selectedOccupation} />
      )}
    </div>
  );
}
