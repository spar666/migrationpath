/**
 * Carries the prospect identity across the funnel's two external round trips:
 *
 *   /pre-screen -> Calendly -> /consult/book -> Stripe -> /consult/confirmed
 *
 * Both hops leave our origin entirely, so component state and router state are
 * both gone by the time the visitor comes back. Without this the returning
 * prospect is anonymous and their own confirmation page cannot tell them
 * anything — which is the moment they are most likely to email support.
 *
 * localStorage rather than sessionStorage, for the same reason as
 * pendingQuote.ts: people book on their phone, close the tab, and open the
 * Stripe receipt link later. sessionStorage would silently lose them.
 *
 * Only the id and the reference are stored — never contact details or answers.
 * This is a shared-device risk surface, and the id alone is useless without the
 * reference, which is how the status endpoint is keyed.
 */

const STORAGE_KEY = 'migrationpath.prospect';
/**
 * Long enough to cover "book now, pay from the email link tomorrow", short
 * enough that a stale prospect on a shared machine does not linger for weeks.
 */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface ProspectSession {
  prospectId: string;
  humanRef: string;
  /** Prefills Calendly so the invitee email matches the prospect email. */
  name?: string;
  email?: string;
  /** Drives whether the book page offers the applicant or business copy. */
  party?: 'applicant' | 'business';
  savedAt: number;
}

export function saveProspectSession(
  session: Omit<ProspectSession, 'savedAt'>,
): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...session, savedAt: Date.now() }),
    );
  } catch {
    // Private browsing and full-storage both throw here. Non-fatal: the book
    // page falls back to the query string, which is why openScheduler also
    // puts the reference on the URL.
  }
}

export function getProspectSession(): ProspectSession | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ProspectSession;
    if (!parsed?.prospectId || !parsed?.humanRef) {
      clearProspectSession();
      return null;
    }
    if (Date.now() - parsed.savedAt > TTL_MS) {
      clearProspectSession();
      return null;
    }
    return parsed;
  } catch {
    clearProspectSession();
    return null;
  }
}

export function clearProspectSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Resolves the prospect from the URL first, then storage.
 *
 * URL wins deliberately. If someone forwards their confirmation link to a
 * colleague, or opens it in a different browser, the query string is the only
 * identity available — and if it disagrees with storage, the link the user
 * just clicked is the one they meant.
 */
export function resolveProspect(search: string): {
  prospectId: string | null;
  humanRef: string | null;
  session: ProspectSession | null;
} {
  const params = new URLSearchParams(search);
  const session = getProspectSession();

  const fromUrlId = params.get('prospect_id') || params.get('prospect');
  const fromUrlRef = params.get('ref');

  return {
    prospectId: fromUrlId || session?.prospectId || null,
    humanRef: fromUrlRef || session?.humanRef || null,
    session,
  };
}
