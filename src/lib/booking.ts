import { apiClient } from '@/lib/apiClient';

/**
 * The book-then-pay half of the funnel.
 *
 * The order is deliberate: the prospect picks a slot FIRST (which creates a
 * pending, unpaid booking) and pays SECOND to confirm it. Someone who picks a
 * time and then abandons checkout leaves behind a pending booking — that is
 * the agent's follow-up queue, not a bug, and it is the reason this order was
 * chosen over pay-then-book.
 */

const CALENDLY_CONSULT_URL = import.meta.env.VITE_CALENDLY_CONSULT_URL as
  | string
  | undefined;

export interface OpenSchedulerOptions {
  /** From the pre-screen result. Without it the booking cannot be linked. */
  prospectId: string;
  name?: string;
  email?: string;
  /** Shown to the prospect and passed through for reconciliation. */
  humanRef?: string;
  /**
   * Open in the same tab (default) or a new one. Same tab is usually right —
   * Calendly's own confirmation page is a fine place to land.
   */
  target?: '_self' | '_blank';
}

/**
 * Sends the prospect to Calendly with their prospect id attached.
 *
 * The id rides on `utm_content`. That looks like an odd choice, but it is the
 * one field Calendly reliably echoes back in the invitee webhook payload, and
 * the webhook is where the booking gets linked to the prospect. If this stops
 * being passed, bookings arrive unlinked and the backend logs an error saying
 * exactly that.
 *
 * Prefilling name and email is not just convenience — a mismatch between the
 * Calendly invitee email and the prospect email is the main way a booking ends
 * up impossible to reconcile by hand.
 */
export function openScheduler(options: OpenSchedulerOptions): void {
  if (!CALENDLY_CONSULT_URL) {
    // Loud rather than silent: a dead Book button is the single most expensive
    // failure in this funnel.
    console.error(
      'VITE_CALENDLY_CONSULT_URL is not set — the scheduler cannot be opened.',
    );
    throw new Error('Scheduling is not configured.');
  }

  if (!options.prospectId) {
    throw new Error('A prospect id is required to open the scheduler.');
  }

  const url = new URL(CALENDLY_CONSULT_URL);

  // The link back to our record. Do not remove.
  url.searchParams.set('utm_content', options.prospectId);
  if (options.humanRef) {
    url.searchParams.set('utm_campaign', options.humanRef);
  }
  url.searchParams.set('utm_source', 'migrationpath');
  url.searchParams.set('utm_medium', 'pre_screen');

  if (options.name) url.searchParams.set('name', options.name);
  if (options.email) url.searchParams.set('email', options.email);

  // Calendly's own styling params — harmless if the event type overrides them.
  url.searchParams.set('hide_gdpr_banner', '1');

  window.open(url.toString(), options.target ?? '_self');
}

export interface CheckoutSession {
  checkout_url: string;
  payment_id: string;
}

function unwrap<T>(response: T | { data: T }): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

/**
 * Creates a hosted Stripe Checkout session and redirects to it.
 *
 * Note what is NOT sent: an amount. The consult fee is fixed server side from
 * a Stripe Price id. If the client could name the price, anyone could book a
 * consult for a cent.
 *
 * Redirect rather than an embedded card form is what keeps PCI scope at its
 * lightest — no card data ever touches our origin or our API.
 */
export async function payToConfirmConsultation(
  prospectId: string,
  bookingId?: string,
): Promise<never | void> {
  if (!prospectId) {
    throw new Error('A prospect id is required to start checkout.');
  }

  const response = await apiClient.post<
    CheckoutSession | { data: CheckoutSession }
  >('/payments/consultation/checkout', {
    prospect_id: prospectId,
    ...(bookingId ? { booking_id: bookingId } : {}),
    purpose: 'consultation',
  });

  const session = unwrap(response);

  if (!session?.checkout_url) {
    throw new Error('Could not start the payment. Please try again.');
  }

  // Full navigation, not window.open — a popup blocker eating the checkout
  // window looks to the user like the pay button is broken.
  window.location.assign(session.checkout_url);
}

/**
 * ⚠️ Landing on the success URL does NOT mean the payment succeeded.
 *
 * It is a browser navigation; anyone can type that URL. The booking is
 * confirmed only when Stripe's webhook reaches the backend, which may be a
 * second or two after the redirect.
 *
 * So the confirmation page should say "we're confirming your booking" and read
 * the real state from the API, rather than announcing success on arrival.
 * Use the human_ref from the pre-screen result to look it up.
 */
export function getReferenceFromReturnUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}
