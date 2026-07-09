import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Loader2, GraduationCap, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  useSmartSuggestions,
  type OccupationSuggestion,
  type CourseSuggestion,
} from '@/hooks/useSmartSuggestions';

type FlatItem =
  | ({ kind: 'occupation' } & OccupationSuggestion)
  | ({ kind: 'course' } & CourseSuggestion);

interface SmartSearchProps {
  value: string;
  onChange: (value: string) => void;
  /**
   * Called when the user commits a query — either by selecting a suggestion
   * (occupations pass their ANZSCO code for an exact SKILLED match) or by
   * pressing Enter on free text. The parent resolves intent from here.
   */
  onResolve: (query: string) => void;
  placeholder?: string;
  className?: string;
  isResolving?: boolean;
  onFocus?: () => void;
}

export function SmartSearch({
  value,
  onChange,
  onResolve,
  placeholder = 'Search an occupation, ANZSCO code, university or degree…',
  className,
  isResolving = false,
  onFocus,
}: SmartSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, isLoading } = useSmartSuggestions(value);

  // Flatten grouped suggestions into a single keyboard-navigable list.
  const flatItems = useMemo<FlatItem[]>(
    () => [
      ...suggestions.occupations.map((o) => ({ kind: 'occupation' as const, ...o })),
      ...suggestions.courses.map((c) => ({ kind: 'course' as const, ...c })),
    ],
    [suggestions],
  );

  const hasResults = flatItems.length > 0;

  useEffect(() => {
    setIsOpen(hasResults && value.length >= 2);
    setHighlightedIndex(-1);
  }, [hasResults, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const commit = (query: string, display: string) => {
    onChange(display);
    setIsOpen(false);
    inputRef.current?.blur();
    onResolve(query);
  };

  const selectItem = (item: FlatItem) => {
    if (item.kind === 'occupation') {
      // ANZSCO code drives an exact SKILLED classification.
      commit(item.anzscoCode || item.title, item.title);
    } else {
      commit(item.courseName, item.courseName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && flatItems[highlightedIndex]) {
        selectItem(flatItems[highlightedIndex]);
      } else if (value.trim().length >= 2) {
        // Free-text submit — let the backend classify it.
        setIsOpen(false);
        onResolve(value.trim());
      }
      return;
    }
    if (!isOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < flatItems.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const renderRow = (item: FlatItem, index: number) => {
    const active = highlightedIndex === index;
    return (
      <li
        key={`${item.kind}-${item.kind === 'occupation' ? item.anzscoCode : item.id}`}
        className={cn(
          'flex cursor-pointer items-center justify-between px-5 py-3.5 transition-colors',
          active ? 'bg-gold/5' : 'bg-white hover:bg-gold/5',
        )}
        onClick={() => selectItem(item)}
        onMouseEnter={() => setHighlightedIndex(index)}
      >
        {item.kind === 'occupation' ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold text-navy">
              {item.title}
            </span>
            <span className="text-sm font-medium text-glacier-dark">
              ANZSCO {item.anzscoCode}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold text-navy">
              {item.courseName}
            </span>
            <span className="text-sm font-medium text-glacier-dark">
              {item.university}
            </span>
          </div>
        )}
      </li>
    );
  };

  const occCount = suggestions.occupations.length;

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          {isLoading || isResolving ? (
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
            if (hasResults) setIsOpen(true);
            onFocus?.();
          }}
          onKeyDown={handleKeyDown}
          className="h-14 w-full rounded-xl border-2 border-navy/15 bg-white pl-12 pr-4 text-base shadow-sm transition-all focus:ring-2 focus:ring-navy/10 focus:border-navy/30"
        />
      </div>

      {isOpen && hasResults && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border-2 border-navy/15 bg-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <ul className="max-h-[360px] overflow-y-auto">
            {occCount > 0 && (
              <li className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-navy border-b border-navy/10 bg-muted/30">
                <Briefcase className="h-3.5 w-3.5 text-gold" />
                Occupations
              </li>
            )}
            {flatItems.slice(0, occCount).map((item, i) => renderRow(item, i))}

            {suggestions.courses.length > 0 && (
              <li className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-navy border-y border-navy/10 bg-muted/30">
                <GraduationCap className="h-3.5 w-3.5 text-glacier-dark" />
                Courses / Degrees
              </li>
            )}
            {flatItems
              .slice(occCount)
              .map((item, i) => renderRow(item, occCount + i))}
          </ul>
        </div>
      )}
    </div>
  );
}
