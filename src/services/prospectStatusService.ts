import { apiClient } from '@/lib/apiClient';

/**
 * Reads the funnel state of the visitor's own prospect record.
 *
 * This exists so the post-payment page can report what actually happened.
 * Landing on the Stripe success URL proves only that a browser navigated
 * there — the booking is confirmed when Stripe's webhook reaches our backend,
 * which is typically a second or two later and occasionally much longer. A
 * page that announces "paid!" on arrival is lying a small percentage of the
 * time, and it is exactly the percentage that generates support email.
 *
 * The endpoint is public but double-keyed: it needs the uuid AND the human
 * reference, so neither identifier is useful on its own.
 */

export type ProspectStage =
  | 'captured'
  | 'pre_screened'
  | 'booked'
  | 'consulted'
  | 'engaged'
  | 'disqualified';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface ProspectStatus {
  prospect_id: string;
  human_ref: string;
  stage: ProspectStage;
  statutory_eligible: boolean | null;
  client_fit: boolean | null;
  /** The only flag the confirmation page should trust. */
  consult_confirmed: boolean;
  booking: {
    id: string;
    status: BookingStatus;
    scheduled_at: string | null;
    scheduled_end_at: string | null;
    join_url: string | null;
    reschedule_url: string | null;
    cancel_url: string | null;
  } | null;
}

function unwrap<T>(response: T | { data: T }): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

class ProspectStatusService {
  async get(prospectId: string, humanRef: string): Promise<ProspectStatus> {
    const response = await apiClient.get<
      ProspectStatus | { data: ProspectStatus }
    >(`/prospects/${encodeURIComponent(prospectId)}/status`, {
      params: { ref: humanRef },
    });
    return unwrap(response);
  }

  /**
   * Polls until the webhook has landed, then stops.
   *
   * Backs off rather than hammering: the endpoint is rate-limited (it has to
   * be — the reference is short), and a tight retry loop would lock the
   * visitor out of their own status page at the worst possible moment.
   *
   * Resolves with the last status either way. A timeout here is NOT a failed
   * payment, and the caller must not present it as one — it means we could not
   * confirm yet, which is a different sentence.
   */
  async pollUntilConfirmed(
    prospectId: string,
    humanRef: string,
    options: {
      attempts?: number;
      onUpdate?: (status: ProspectStatus) => void;
      signal?: AbortSignal;
    } = {},
  ): Promise<ProspectStatus | null> {
    const attempts = options.attempts ?? 6;
    let last: ProspectStatus | null = null;

    for (let i = 0; i < attempts; i++) {
      if (options.signal?.aborted) return last;

      try {
        last = await this.get(prospectId, humanRef);
        options.onUpdate?.(last);
        if (last.consult_confirmed || last.booking?.status === 'confirmed') {
          return last;
        }
      } catch (error) {
        // Swallow and retry: a 404 on the first attempt is usually the record
        // not being visible yet rather than a wrong reference, and surfacing
        // it immediately would tell the user their booking failed when it did
        // not. The caller decides what to say once the loop is done.
        if (i === attempts - 1) throw error;
      }

      // No sleep after the final attempt — there is nothing left to wait for,
      // and the visitor would sit on a spinner for the length of the last
      // backoff before being told anything.
      if (i === attempts - 1) break;

      // 1s, 2s, 3s, 4s, 5s — ~15s total, which comfortably covers a normal
      // webhook while still ending rather than spinning forever.
      const delay = Math.min(1000 * (i + 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    return last;
  }
}

export const prospectStatusService = new ProspectStatusService();
