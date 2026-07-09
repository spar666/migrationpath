import { useMemo, useEffect, useState } from "react";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/home/CourseCard";
import { OccupationSearch } from "./OccupationSearch";
import { SearchFilters, type FilterState } from "./SearchFilters";
import { courseService, type Course } from "@/services/courseService";

// TODO: Define Occupation type from backend API
interface Occupation {
  id: string;
  title: string;
  anzsco_code: string;
  [key: string]: any;
}

interface SearchResultsGridProps {
  searchQuery: string;
  selectedOccupation: Occupation | null;
  filters: FilterState;
  onSearchChange: (query: string) => void;
  onOccupationSelect: (occupation: Occupation) => void;
  onFiltersChange: (filters: FilterState) => void;
  onBack: () => void;
}

export function SearchResultsGrid({
  searchQuery,
  selectedOccupation,
  filters,
  onSearchChange,
  onOccupationSelect,
  onFiltersChange,
  onBack,
}: SearchResultsGridProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  // Debounce search query input to avoid over-fetching
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch courses from API using advanced search
  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const occupationTitle = selectedOccupation
          ? (selectedOccupation.title || selectedOccupation.occupation || selectedOccupation.name)
          : debouncedSearchQuery;

        const payload: any = {};
        if (occupationTitle) {
          payload.selectedOccupation = {
            occupation: occupationTitle,
          };
        }

        // Add additional filters if present
        if (filters.isRegional !== null) {
          payload.isRegional = filters.isRegional;
        }
        if (filters.visaSubclasses && filters.visaSubclasses.length > 0) {
          payload.visaSubclasses = filters.visaSubclasses;
        }

        // If no search query/occupation and no filters are selected, fetch all courses as fallback
        const hasFilters = occupationTitle || filters.isRegional !== null || (filters.visaSubclasses && filters.visaSubclasses.length > 0);
        const data = hasFilters
          ? await courseService.searchAdvanced(payload)
          : await courseService.getCourses();

        if (isMounted) {
          setCourses(data);
        }
      } catch (err) {
        console.error("Failed to fetch advanced search courses:", err);
        if (isMounted) {
          setError("Failed to load courses. Please try again.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchCourses();
    return () => { isMounted = false; };
  }, [selectedOccupation, debouncedSearchQuery, filters.isRegional, filters.visaSubclasses]);

  // Real-time filtering with useMemo for performance
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const hasSearchApplied = !!selectedOccupation || !!debouncedSearchQuery;
      
      // Only run text query matches client-side if we fell back to loading all courses
      if (!hasSearchApplied && searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          (course.courseTitle || "").toLowerCase().includes(query) ||
          (course.universityName || "").toLowerCase().includes(query) ||
          (course.anzscoTitle || "").toLowerCase().includes(query) ||
          (course.anzscoCode || "").includes(query);
        if (!matchesQuery) return false;
      }

      // Apply regional filter (optional)
      if (filters.isRegional === true && !course.isRegional) {
        return false;
      }
      if (filters.isRegional === false && course.isRegional) {
        return false;
      }

      // Filter by visa subclass if selected
      if (filters.visaSubclasses && filters.visaSubclasses.length > 0) {
        if (course.visaSubclasses && course.visaSubclasses.length > 0) {
          const hasMatchingVisa = filters.visaSubclasses.some((visa) =>
            course.visaSubclasses?.includes(visa)
          );
          if (!hasMatchingVisa) return false;
        }
      }

      return true;
    });
  }, [courses, searchQuery, debouncedSearchQuery, selectedOccupation, filters]);

  return (
    <div className="animate-fade-in">
      {/* Sticky Search Header */}
      <div className="mb-6 rounded-2xl bg-white/80 p-4 shadow-sm backdrop-blur-sm border border-navy/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="w-fit gap-2 text-navy-muted hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <OccupationSearch
              value={searchQuery}
              onChange={onSearchChange}
              onSelect={onOccupationSelect}
              placeholder="Refine your search..."
              className="flex-1"
            />
            <SearchFilters filters={filters} onFiltersChange={onFiltersChange} />
          </div>
        </div>
      </div>

      {/* Results Header with Count */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy">
            {selectedOccupation
              ? selectedOccupation.title
              : searchQuery
                ? `Results for "${searchQuery}"`
                : "All Pathways"}
          </h2>
          {selectedOccupation && (
            <p className="text-sm text-glacier-dark font-medium">
              ANZSCO {selectedOccupation.anzsco_code}
            </p>
          )}
        </div>
        
        {/* Result Count Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2 text-sm font-semibold text-gold-dark border border-gold/20">
          <Search className="h-4 w-4" />
          <span>
            <strong>{filteredCourses.length}</strong> Pathway{filteredCourses.length !== 1 ? "s" : ""} Found
          </span>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.isRegional !== null || filters.agePoints > 0 || filters.englishPoints > 0 || filters.visaSubclasses.length > 0) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-navy-muted">Active filters:</span>
          {filters.isRegional === true && (
            <span className="inline-flex items-center rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-dark border border-gold/20">
              🌾 Regional (+5)
            </span>
          )}
          {filters.isRegional === false && (
            <span className="inline-flex items-center rounded-full bg-navy/10 px-3 py-1 text-xs font-semibold text-navy border border-navy/15">
              🏙️ Metro
            </span>
          )}
          {filters.agePoints > 0 && (
            <span className="inline-flex items-center rounded-full bg-glacier/10 px-3 py-1 text-xs font-semibold text-glacier-dark border border-glacier/20">
              Age: {filters.agePoints} pts
            </span>
          )}
          {filters.englishPoints > 0 && (
            <span className="inline-flex items-center rounded-full bg-glacier/10 px-3 py-1 text-xs font-semibold text-glacier-dark border border-glacier/20">
              English: {filters.englishPoints} pts
            </span>
          )}
          {filters.visaSubclasses.map((visa) => (
            <span
              key={visa}
              className="inline-flex items-center rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-dark border border-gold/20"
            >
              Visa {visa}
            </span>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-navy/40 mb-4" />
          <p className="text-navy-muted font-medium">Loading pathways...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/50 py-16 text-center">
          <p className="text-red-600 font-medium mb-2">{error}</p>
          <Button variant="outline" className="mt-2 rounded-xl" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      {/* Results Grid */}
      {!isLoading && !error && filteredCourses.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const getQualification = (title: string) => {
              const t = (title || "").toLowerCase();
              if (t.includes("master")) return "Master's Degree";
              if (t.includes("bachelor")) return "Bachelor's Degree";
              if (t.includes("diploma")) return "Graduate Diploma";
              return "Bachelor's Degree";
            };
            return (
              <CourseCard
                key={course.id}
                id={course.id}
                courseName={course.courseTitle}
                university={course.universityName}
                anzscoCode={course.anzscoCode}
                occupation={course.anzscoTitle}
                duration={course.duration}
                qualification={getQualification(course.courseTitle)}
                isRegional={course.isRegional}
                annualFees={course.annualFees}
                visaSubclasses={course.visaSubclasses}
              />
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy/10 bg-white/50 py-16 text-center">
          <div className="mb-4 rounded-full bg-navy/5 p-4">
            <Search className="h-8 w-8 text-navy-muted" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-navy">
            No pathways found
          </h3>
          <p className="max-w-sm text-navy-muted">
            Try adjusting your search criteria or filters to discover more migration pathways.
          </p>
          <Button
            variant="outline"
            className="mt-4 rounded-xl border-navy/15 text-navy hover:bg-navy/5"
            onClick={() => {
              onSearchChange("");
              onFiltersChange({
                isRegional: null,
                agePoints: 0,
                englishPoints: 0,
                visaSubclasses: [],
              });
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
