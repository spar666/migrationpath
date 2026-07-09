import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  searchService,
  type IntentResult,
  type SkilledIntentResult,
} from '@/services/searchService';

export interface IntentRouterCallbacks {
  /** SKILLED: default keeps the result in state for inline split-screen render. */
  onSkilled?: (result: SkilledIntentResult) => void;
  /** STUDENT: default navigates to the student course-matching screen. */
  onStudent?: (result: Extract<IntentResult, { intent: 'STUDENT' }>) => void;
  /** FAMILY: default navigates to the relationship form engine. */
  onFamily?: (result: Extract<IntentResult, { intent: 'FAMILY' }>) => void;
  /** UNKNOWN: default opens the 60-second onshore audit fallback. */
  onUnknown?: (result: Extract<IntentResult, { intent: 'UNKNOWN' }>) => void;
}

const STUDENT_ROUTE = '/pathways/student';

/**
 * Central state logic for the smart query router. Call `resolve(query)` from the
 * search box or the audit; it classifies the query server-side and dispatches to
 * the correct funnel. SKILLED results are returned in `skilledResult` so the hero
 * can render the split-screen inline; the other intents navigate by default but
 * can be overridden via callbacks.
 */
export function useIntentRouter(callbacks: IntentRouterCallbacks = {}) {
  const navigate = useNavigate();
  const [isResolving, setIsResolving] = useState(false);
  const [skilledResult, setSkilledResult] =
    useState<SkilledIntentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setSkilledResult(null);
    setError(null);
  }, []);

  const resolve = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setIsResolving(true);
      setError(null);
      try {
        const result = await searchService.resolveIntent(trimmed);

        switch (result.intent) {
          case 'SKILLED':
            if (callbacks.onSkilled) callbacks.onSkilled(result);
            else setSkilledResult(result);
            break;

          case 'STUDENT':
            if (callbacks.onStudent) callbacks.onStudent(result);
            else
              navigate(
                `${STUDENT_ROUTE}?q=${encodeURIComponent(result.query)}`,
              );
            break;

          case 'FAMILY':
            if (callbacks.onFamily) callbacks.onFamily(result);
            else navigate(result.redirectTo);
            break;

          case 'UNKNOWN':
          default:
            if (callbacks.onUnknown)
              callbacks.onUnknown(result as Extract<IntentResult, { intent: 'UNKNOWN' }>);
            break;
        }

        return result;
      } catch (err) {
        setError((err as Error).message || 'Could not resolve your search.');
        return undefined;
      } finally {
        setIsResolving(false);
      }
    },
    [callbacks, navigate],
  );

  return { resolve, isResolving, skilledResult, error, reset };
}
