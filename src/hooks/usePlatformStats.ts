import { useEffect, useState } from "react";
import { statsService } from "@/services/statsService";

/**
 * The one source of the counts shown on public pages.
 *
 * Two pages rendered this independently and disagreed, because each carried
 * its own hardcoded fallback — "200+ Occupations", "50+ Universities", "500+
 * Courses" — displayed before the fetch resolved and left in place when it
 * failed. Those numbers were nobody's measurement: they shipped as filler and
 * became the site's public claim whenever `/stats` was slow or down.
 *
 * So: no fallback. `null` until a real count arrives, and the caller renders
 * nothing in the meantime. A missing figure is honest; a made-up one is not.
 */
export interface PlatformCounts {
  occupations: number;
}

export function usePlatformStats(): PlatformCounts | null {
  const [counts, setCounts] = useState<PlatformCounts | null>(null);

  useEffect(() => {
    let isMounted = true;
    statsService
      .getStats()
      .then((data) => {
        if (!isMounted) return;
        // Guard the shape as well as the request. A zero or a missing field is
        // not a number worth printing, and `${undefined}` renders the word.
        if (typeof data?.occupations === "number" && data.occupations > 0) {
          setCounts({ occupations: data.occupations });
        }
      })
      .catch((error) => console.error("Failed to fetch platform stats:", error));
    return () => {
      isMounted = false;
    };
  }, []);

  return counts;
}
