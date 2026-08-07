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

/**
 * A 404 from the status endpoint is a verdict, not a hiccup.
 *
 * The endpoint is double-keyed on (id, human_ref), and it returns 404 both when
 * the prospect does not exist and when the reference does not match — so a 404
 * means "this identity is not valid", full stop. Retrying cannot change that.
 *
 * It matters because the identity usually comes from localStorage, which
 * outlives the database. After a reset — or simply a record that was never
 * committed — the browser keeps presenting an id nothing recognises, and every
 * poll spends its full budget before showing "taking a little longer than
 * usual". Which is the wrong thing to say: nothing is taking longer, the
 * reference is dead.
 */
export function isUnknownProspect(error: unknown): boolean {
  return (error as { status?: number })?.status === 404;
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
   * Tells the backend about a slot the browser just watched Calendly confirm.
   *
   * The booking is otherwise created only by Calendly's invitee webhook, which
   * can be late, misconfigured, or — on localhost, where Calendly has no public
   * URL to reach — never arrive at all. Reporting it here means checkout has
   * something to charge for either way; the webhook corrects the detail when it
   * lands.
   */
  async reportBooking(
    prospectId: string,
    humanRef: string,
    details: {
      inviteeUri?: string;
      eventUri?: string;
      startsAt?: string;
      endsAt?: string;
    } = {},
  ): Promise<ProspectStatus> {
    const response = await apiClient.post<
      ProspectStatus | { data: ProspectStatus }
    >(
      `/prospects/${encodeURIComponent(prospectId)}/booking?ref=${encodeURIComponent(humanRef)}`,
      {
        invitee_uri: details.inviteeUri,
        event_uri: details.eventUri,
        starts_at: details.startsAt,
        ends_at: details.endsAt,
      },
    );
    return unwrap(response);
  }

  /**
   * Waits for the slot the visitor just picked to show up.
   *
   * The booking row is created by Calendly's invitee webhook, which is a
   * server-to-server call racing the visitor's own browser. Someone who books
   * and immediately clicks Pay can arrive before it lands — and checkout then
   * fails with "choose a consultation time", which reads as though the time
   * they just chose did not count.
   *
   * Short and impatient on purpose: this runs while someone is looking at a
   * spinner having already committed, so it gives the webhook a few seconds
   * and then lets them get on with it rather than holding them indefinitely.
   * Resolves with whatever it last saw, booking or not — the caller decides
   * what to say about that.
   */
  async pollUntilBooked(
    prospectId: string,
    humanRef: string,
    options: { attempts?: number; signal?: AbortSignal } = {},
  ): Promise<ProspectStatus | null> {
    const attempts = options.attempts ?? 4;
    let last: ProspectStatus | null = null;

    for (let i = 0; i < attempts; i++) {
      if (options.signal?.aborted) return last;

      try {
        last = await this.get(prospectId, humanRef);
        if (last.booking) return last;
      } catch (error) {
        // Stop immediately on a dead reference. Spending the whole retry
        // budget on an identity the server has told us it does not recognise
        // just delays the honest answer.
        if (isUnknownProspect(error)) throw error;

        // Any other read failure must not block checkout — the backend
        // resolves the booking server side anyway, and a visitor who cannot
        // pay is a lost sale. Only the last attempt is worth reporting.
        if (i === attempts - 1) {
          console.error('Could not read prospect status:', error);
        }
      }

      if (i === attempts - 1) break;

      // 800ms, 1.6s, 2.4s — about 5s total, which covers a normal webhook
      // without making someone who genuinely has no booking wait around.
      await new Promise((resolve) => setTimeout(resolve, 800 * (i + 1)));
    }

    return last;
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
        // A 404 here is definitive — the endpoint is double-keyed, so it means
        // the id or the reference is wrong, and fifteen more seconds of polling
        // will not make an unknown prospect known. Everything else is worth a
        // retry: a transient blip on the first attempt is usually the record
        // not being visible yet, and surfacing that immediately would tell the
        // visitor their booking failed when it did not.
        if (isUnknownProspect(error)) throw error;
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
