import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/apiClient";

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

interface PopularOccupation {
  code: string;
  title: string;
  points: number;
}

const recentSearches = [
  "Software Engineer",
  "Data Analyst",
  "Civil Engineer",
];

export function MobileSearchOverlay({
  isOpen,
  onClose,
  onSearch,
}: MobileSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [popularOccupations, setPopularOccupations] = useState<PopularOccupation[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiClient.get<any>("/occupations")
        .then((response) => {
          const data = Array.isArray(response) ? response : (response?.data || []);
          setPopularOccupations(
            data.slice(0, 6).map((occ: any) => ({
              code: occ.anzsco_code || "",
              title: occ.occupation_name || occ.title || "",
              points: occ.points_value || 15,
            }))
          );
        })
        .catch(() => {
          setPopularOccupations([]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSearch = (searchQuery: string) => {
    onSearch(searchQuery);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background"
        >
          <div className="sticky top-0 z-10 bg-background border-b border-border">
            <div className="flex items-center gap-3 p-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search occupations, courses..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && query.trim()) {
                      handleSearch(query);
                    }
                  }}
                  className="w-full h-12 pl-12 pr-4 text-base rounded-xl border-border bg-muted/50"
                  style={{ fontSize: "16px" }}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0 h-12 w-12 rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto pb-24" style={{ height: "calc(100vh - 80px)" }}>
            {recentSearches.length > 0 && !query && (
              <div className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Recent Searches
                </h3>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-muted/50 transition-colors"
                    >
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-base text-foreground">{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-accent" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Popular Occupations
                </h3>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {popularOccupations.map((occupation) => (
                    <motion.button
                      key={occupation.code}
                      onClick={() => handleSearch(occupation.title)}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-border/50 text-left active:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                          <Star className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-base text-foreground">
                            {occupation.title}
                          </p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {occupation.code}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 mx-4 rounded-2xl bg-muted/30">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Search Tips
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Search by occupation name or ANZSCO code</li>
                <li>• Filter by regional locations for +5 points</li>
                <li>• Compare multiple pathways side-by-side</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
