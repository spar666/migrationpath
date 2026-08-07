import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { payToConfirmConsultation } from '@/lib/booking';
import { clearProspectSession, resolveProspect } from '@/lib/prospectSession';
import { getErrorMessage } from '@/lib/errorHandler';
import {
  isUnknownProspect,
  prospectStatusService,
  type ProspectStatus,
} from '@/services/prospectStatusService';

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
  const navigate = useNavigate();

  const [status, setStatus] = useState<ProspectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  /**
   * The stored identity is not one the server recognises.
   *
   * localStorage outlives the database. After a reset — or a record that was
   * never committed — the browser keeps presenting a reference nothing knows,
   * and without this the visitor is offered a pay button that can only 404.
   */
  const [unknownProspect, setUnknownProspect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Confirm your consultation | MigrationPath';
  }, []);

  useEffect(() => {
    if (!prospectId || !humanRef) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    // Polled rather than read once. Arriving here straight from the calendar
    // races Calendly's invitee webhook, which is what actually creates the
    // booking row — and losing that race used to mean checkout rejected them
    // with "choose a consultation time before paying", the one message that
    // makes no sense to someone who has just chosen one.
    prospectStatusService
      .pollUntilBooked(prospectId, humanRef, { signal: controller.signal })
      .then((s) => {
        if (!cancelled && s) setStatus(s);
      })
      .catch((error) => {
        if (cancelled) return;
        if (isUnknownProspect(error)) {
          // Drop it rather than let a dead reference follow them around for
          // the rest of its seven-day TTL.
          clearProspectSession();
          setUnknownProspect(true);
          return;
        }
        console.error('Could not read prospect status:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
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

  /** Manual retry for a webhook that took longer than the initial wait. */
  const recheck = async () => {
    if (!prospectId || !humanRef) return;
    setRechecking(true);
    try {
      const s = await prospectStatusService.pollUntilBooked(
        prospectId,
        humanRef,
        { attempts: 2 },
      );
      if (s) setStatus(s);
    } finally {
      setRechecking(false);
    }
  };

  /**
   * Back to the calendar for someone who reached this page without a slot.
   *
   * Goes to our own /consult/schedule rather than opening calendly.com: the
   * off-site version dropped them on Calendly's `/invitees/<uuid>` confirmation
   * page with the slot held and the fee unpaid, and nothing on that page leads
   * back here. The whole point of this screen is the payment that follows.
   */
  const rebook = () => {
    if (!prospectId) return;
    navigate(`/consult/schedule?prospect_id=${prospectId}&ref=${humanRef ?? ''}`);
  };

  // No identity, or an identity the server does not recognise. Both mean the
  // same thing to the visitor — there is nothing here to pay for — and both
  // want the same screen rather than a pay button that can only fail.
  if (!prospectId || !humanRef || unknownProspect) {
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
  // A read that SUCCEEDED and came back with no booking. Distinct from a read
  // that never succeeded (status === null), where we simply do not know.
  const knownWithoutBooking = status !== null && !status.booking;
  if (loading) {
    return (
      <Shell>
        <div className="flex items-center gap-3 text-navy-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          {/* Says "confirming", not "loading". Someone arriving straight from
              the calendar is watching us wait for their booking to register,
              and the wording should tell them their time was taken rather than
              leaving them wondering whether it was. */}
          <span>Confirming the time you picked…</span>
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

  // Waited for the webhook and were told, definitively, that there is no
  // booking.
  //
  // No pay button here, deliberately. Checkout requires a booking to attach the
  // payment to and rejects the request without one, so offering to pay would
  // send them to a button whose only outcome is an error.
  //
  // Note the condition: `knownWithoutBooking`, not `!hasBooking`. If we could
  // not read the status at all we do not know whether they have a slot, and the
  // optimistic branch below is the right one — the backend is the authority,
  // and hiding the pay button from someone who does hold a booking is a lost
  // sale caused by our own failed read.
  if (knownWithoutBooking) {
    return (
      <Shell>
        <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/5">
          <CalendarClock className="h-7 w-7 text-navy" />
        </span>

        <h1 className="text-2xl font-bold text-navy md:text-3xl">
          We have not got your time yet
        </h1>

        <p className="mt-4 leading-relaxed text-navy-muted">
          If you have just picked a slot, it can take a few moments to reach us
          — check again in a second. If you have not chosen a time yet, start
          there.
        </p>

        <Button
          variant="elite"
          size="lg"
          className="mt-8 h-12 w-full gap-2"
          onClick={recheck}
          disabled={rechecking}
        >
          {rechecking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking…
            </>
          ) : (
            'Check again'
          )}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="mt-3 h-12 w-full"
          onClick={rebook}
        >
          Choose a time
        </Button>

        <ReferenceFooter humanRef={humanRef} />
      </Shell>
    );
  }

  return (
    <Shell>
      <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15">
        <CalendarCheck className="h-7 w-7 text-gold-dark" />
      </span>

      <h1 className="text-2xl font-bold text-navy md:text-3xl">
        One step left — confirm your time
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
        Your time is held but not yet confirmed. Paying the consultation fee
        confirms it and puts your assessment in front of the agent before the
        call.
      </p>

      {/* Pay now is the primary action and pay later is secondary, but both are
          real choices rather than one option and an escape hatch. Someone who
          needs to check with a partner before spending money will leave the
          page either way; offered the choice they leave having told us so, and
          land somewhere that can bring them back. */}
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

      <ReferenceFooter humanRef={humanRef} />
    </Shell>
  );
}

function ReferenceFooter({ humanRef }: { humanRef: string | null }) {
  return (
    <div className="mt-8 border-t border-navy/10 pt-6 text-sm text-navy-muted">
      Reference:{' '}
      <span className="font-mono font-semibold text-navy">{humanRef}</span>
    </div>
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
