import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarCheck,
  CreditCard,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openScheduler, payToConfirmConsultation } from '@/lib/booking';
import { getProspectSession, resolveProspect } from '@/lib/prospectSession';
import { getErrorMessage } from '@/lib/errorHandler';
import { prospectStatusService, type ProspectStatus } from '@/services/prospectStatusService';

/**
 * The pay-to-confirm step, and the page Stripe sends people back to when they
 * abandon checkout (STRIPE_CANCEL_URL).
 *
 * Those two jobs are the same page on purpose. Someone who bounced off the
 * payment screen has already picked a time — their booking exists, unpaid, and
 * what they need is the same button they just walked away from, not an error.
 * Nothing here scolds them for it.
 *
 * The slot is held before payment by design: an unpaid booking is the agent's
 * follow-up queue, not a failure state.
 */

function formatSlot(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export default function ConsultBook() {
  const { prospectId, humanRef } = useMemo(
    () => resolveProspect(window.location.search),
    [],
  );
  const session = useMemo(() => getProspectSession(), []);

  const [status, setStatus] = useState<ProspectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Confirm your consultation | MigrationPath';
  }, []);

  useEffect(() => {
    if (!prospectId || !humanRef) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    prospectStatusService
      .get(prospectId, humanRef)
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch((err) => {
        // Non-fatal. Not being able to read the booking should not block the
        // pay button — the checkout call resolves the booking server side
        // anyway, and a visitor who can't pay is a lost sale.
        console.error('Could not read prospect status:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [prospectId, humanRef]);

  const pay = async () => {
    if (!prospectId) return;
    setPaying(true);
    setError(null);
    try {
      // Redirects on success, so nothing after this runs in the happy path.
      await payToConfirmConsultation(prospectId, status?.booking?.id);
    } catch (err) {
      console.error('Could not start checkout:', err);
      const message = getErrorMessage(err);
      setError(
        message && message !== 'An unexpected error occurred'
          ? message
          : 'We could not start the payment. Please try again, or contact us with your reference.',
      );
      setPaying(false);
    }
  };

  const rebook = () => {
    if (!prospectId) return;
    try {
      openScheduler({
        prospectId,
        humanRef: humanRef ?? undefined,
        name: session?.name,
        email: session?.email,
      });
    } catch (err) {
      console.error('Could not open the scheduler:', err);
      setError(
        'We could not open the booking calendar. Please contact us and quote your reference.',
      );
    }
  };

  // No identity at all — a cold visitor, a cleared browser, or a link that
  // lost its query string. Send them back to the start rather than showing a
  // pay button that cannot work.
  if (!prospectId || !humanRef) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-navy">
          We could not find your assessment
        </h1>
        <p className="mt-4 leading-relaxed text-navy-muted">
          The link may be incomplete, or this might be a different browser from
          the one you started in. Your assessment is safe — if you have your
          reference, contact us and we will pick it up. Otherwise you can run it
          again in a few minutes.
        </p>
        <Button asChild variant="elite" size="lg" className="mt-8 h-12">
          <Link to="/pre-screen">Start a new assessment</Link>
        </Button>
      </Shell>
    );
  }

  const alreadyConfirmed =
    status?.consult_confirmed || status?.booking?.status === 'confirmed';
  const slot = formatSlot(status?.booking?.scheduled_at ?? null);
  const hasBooking = Boolean(status?.booking);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-navy-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading your booking…</span>
        </div>
      </Shell>
    );
  }

  if (alreadyConfirmed) {
    return (
      <Shell>
        <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
          <ShieldCheck className="h-7 w-7 text-emerald-600" />
        </span>
        <h1 className="text-2xl font-bold text-navy">
          This consultation is already confirmed
        </h1>
        {slot && (
          <p className="mt-4 text-navy">
            <strong>{slot}</strong>
          </p>
        )}
        <p className="mt-4 leading-relaxed text-navy-muted">
          Nothing further to pay. Your reference is{' '}
          <span className="font-mono font-semibold text-navy">{humanRef}</span>.
        </p>
        {status?.booking?.join_url && (
          <Button asChild variant="elite" size="lg" className="mt-8 h-12">
            <a href={status.booking.join_url} target="_blank" rel="noreferrer">
              Join link
            </a>
          </Button>
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15">
        <CalendarCheck className="h-7 w-7 text-gold-dark" />
      </span>

      <h1 className="text-2xl font-bold text-navy md:text-3xl">
        {hasBooking
          ? 'One step left — confirm your time'
          : 'Pick a time, then confirm it'}
      </h1>

      {slot && (
        <div className="mt-6 rounded-xl border border-navy/10 bg-cloud px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-muted">
            Your slot, held for now
          </p>
          <p className="mt-1 font-semibold text-navy">{slot}</p>
        </div>
      )}

      <p className="mt-6 leading-relaxed text-navy-muted">
        {hasBooking
          ? 'Your time is held but not yet confirmed. Paying the consultation fee confirms it and puts your assessment in front of the agent before the call.'
          : 'We could not find a booked time against your reference yet. If you have just picked one, give it a moment and refresh — otherwise choose a time first.'}
      </p>

      {!hasBooking && (
        <Button
          variant="outline"
          size="lg"
          className="mt-6 h-12 w-full"
          onClick={rebook}
        >
          Choose a time
        </Button>
      )}

      <Button
        variant="elite"
        size="lg"
        className="mt-4 h-14 w-full gap-2 text-base"
        onClick={pay}
        disabled={paying}
      >
        {paying ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Taking you to checkout…
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Pay to confirm
          </>
        )}
      </Button>

      <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-navy-muted">
        <ShieldCheck className="h-4 w-4" />
        Payment is handled by Stripe. Card details never touch our systems.
      </p>

      {error && (
        <p className="mt-6 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <div className="mt-8 border-t border-navy/10 pt-6 text-sm text-navy-muted">
        Reference:{' '}
        <span className="font-mono font-semibold text-navy">{humanRef}</span>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cloud py-10 md:py-16">
      <div className="container max-w-xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-navy/10 bg-white p-8 shadow-soft-sm md:p-10"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
