import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { occupationService } from '@/services/occupationService';

/**
 * Occupation picker backed by the real occupations catalogue.
 *
 * The nominated occupation is the single fact that decides an
 * employer-sponsored result, and it is decided by ANZSCO code, not by a job
 * title someone typed. So this only ever emits a code the catalogue actually
 * returned — a free-text box would produce codes that match nothing and put
 * every submission into "cannot determine".
 */

export interface OccupationChoice {
  anzsco_code: string;
  occupation_name: string;
  primary_list?: string | null;
}

interface ApiOccupation {
  anzsco_code?: string;
  occupation_name?: string;
  primary_list?: string | null;
}

/** The API wraps list responses inconsistently; accept either shape. */
function readRows(response: unknown): ApiOccupation[] {
  const body = response as { data?: unknown };
  const inner = (body?.data ?? response) as { data?: unknown };
  const rows = Array.isArray(inner) ? inner : (inner?.data ?? []);
  return Array.isArray(rows) ? (rows as ApiOccupation[]) : [];
}

export function OccupationSearchField({
  id,
  value,
  onSelect,
  onClear,
  describedBy,
  invalid,
}: {
  id: string;
  /** The selected occupation's display label, or '' when nothing is chosen. */
  value: string;
  onSelect: (choice: OccupationChoice) => void;
  onClear: () => void;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OccupationChoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Close on outside click so the list does not sit over the Next button.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Debounced, and stale responses are discarded — typing fast otherwise
    // lets an earlier request land after a later one and show the wrong list.
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      occupationService
        .searchOccupations({ q: term, limit: 8 } as never)
        .then((response) => {
          if (cancelled) return;
          setResults(
            readRows(response)
              .filter((row) => row.anzsco_code && row.occupation_name)
              .map((row) => ({
                anzsco_code: row.anzsco_code as string,
                occupation_name: row.occupation_name as string,
                primary_list: row.primary_list ?? null,
              })),
          );
          setFailed(false);
        })
        .catch((error) => {
          if (cancelled) return;
          console.error('Occupation search failed:', error);
          setResults([]);
          setFailed(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-gold bg-gold/5 px-4 py-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <Check className="h-4 w-4 shrink-0 text-gold-dark" />
          <span className="truncate text-sm font-medium text-navy">{value}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            onClear();
            setQuery('');
            setResults([]);
          }}
          className="shrink-0 rounded-lg p-1 text-navy-muted transition-colors hover:bg-navy/5 hover:text-navy"
          aria-label="Change occupation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-muted" />
        <Input
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Start typing an occupation or ANZSCO code…"
          className="pl-9"
          autoComplete="off"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-navy-muted" />
        )}
      </div>

      {open && query.trim().length >= 2 && !loading && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border-2 border-navy/10 bg-white shadow-soft-sm">
          {results.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto">
              {results.map((row) => (
                <li key={row.anzsco_code}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(row);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-cloud"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-navy">
                        {row.occupation_name}
                      </span>
                      <span className="text-xs text-navy-muted">
                        ANZSCO {row.anzsco_code}
                      </span>
                    </span>
                    {row.primary_list && (
                      <span className="shrink-0 rounded-full bg-navy/5 px-2 py-0.5 text-xs font-semibold text-navy">
                        {row.primary_list}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-navy-muted">
              {failed
                ? 'We could not load the occupation list. You can continue — an agent will confirm the occupation with you.'
                : 'No matching occupation. Try the ANZSCO code, or a broader job title.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
