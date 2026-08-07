import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarCheck, Clock, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearProspectSession, resolveProspect } from '@/lib/prospectSession';
import {
  isUnknownProspect,
  prospectStatusService,
  type ProspectStatus,
} from '@/services/prospectStatusService';

/**
 * Where Stripe sends people after a successful checkout (STRIPE_SUCCESS_URL).
 *
 * ⚠️ Arriving here does NOT mean the payment succeeded. It is a browser
 * navigation — anyone can type this URL — and the booking is only really
 * confirmed once Stripe's webhook reaches our backend, usually a second or two
 * behind the redirect.
 *
 * So this page reads the actual state and reports it, rather than
 * congratulating on arrival. It opens on "confirming", not "confirmed".
 *
 * The timeout branch is written carefully: failing to confirm within ~15
 * seconds is not a failed payment, and telling someone their payment failed
 * when their card was charged is the single worst thing this page could do.
 */

type View = 'checking' | 'confirmed' | 'pending' | 'unknown';

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

export default function ConsultConfirmed() {
  const { prospectId, humanRef } = useMemo(
    () => resolveProspect(window.location.search),
    [],
  );

  const [view, setView] = useState<View>('checking');
  const [status, setStatus] = useState<ProspectStatus | null>(null);

  useEffect(() => {
    document.title = 'Your consultation | MigrationPath';
  }, []);

  useEffect(() => {
    if (!prospectId || !humanRef) {
      setView('unknown');
      return;
    }

    const controller = new AbortController();

    prospectStatusService
      .pollUntilConfirmed(prospectId, humanRef, {
        signal: controller.signal,
        onUpdate: setStatus,
      })
      .then((final) => {
        if (controller.signal.aborted) return;
        // Render from the RETURNED value, not from whatever the last onUpdate
        // happened to leave behind. The two can disagree — onUpdate fires only
        // on a successful poll — and if they do, the resolved value is the
        // authoritative one. Deriving `view` from here while `status` came
        // from the callback meant a confirmed booking could render without its
        // join link.
        if (final) setStatus(final);
        if (final?.consult_confirmed || final?.booking?.status === 'confirmed') {
          setView('confirmed');
        } else {
          setView('pending');
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;

        // A 404 is a different thing entirely. The endpoint is double-keyed, so
        // it means this id and reference are not a pair the server knows — the
        // usual cause being a localStorage session that outlived the record it
        // pointed at. Showing "taking a little longer than usual" there is
        // false comfort: nothing is in flight, and it never will be.
        if (isUnknownProspect(error)) {
          clearProspectSession();
          setView('unknown');
          return;
        }

        console.error('Could not confirm booking state:', error);
        // Still 'pending', not an error state — see the note above.
        setView('pending');
      });

    return () => controller.abort();
  }, [prospectId, humanRef]);

  const slot = formatSlot(status?.booking?.scheduled_at ?? null);

  return (
    <div className="min-h-screen bg-cloud py-10 md:py-16">
      <div className="container max-w-xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-navy/10 bg-white p-8 shadow-soft-sm md:p-10"
        >
          {view === 'checking' && (
            <>
              <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15">
                <Loader2 className="h-7 w-7 animate-spin text-gold-dark" />
              </span>
              <h1 className="text-2xl font-bold text-navy md:text-3xl">
                Confirming your booking…
              </h1>
              <p className="mt-4 leading-relaxed text-navy-muted">
                Your payment has gone through to Stripe. We are waiting for it
                to reach us, which usually takes a few seconds. You can leave
                this page — it will not affect your booking.
              </p>
            </>
          )}

          {view === 'confirmed' && (
            <>
              <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                <ShieldCheck className="h-7 w-7 text-emerald-600" />
              </span>
              <h1 className="text-2xl font-bold text-navy md:text-3xl">
                You’re booked in
              </h1>

              {slot && (
                <div className="mt-6 flex gap-3 rounded-xl border border-navy/10 bg-cloud px-4 py-4">
                  <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-navy-muted">
                      Your consultation
                    </p>
                    <p className="mt-1 font-semibold text-navy">{slot}</p>
                  </div>
                </div>
              )}

              <p className="mt-6 leading-relaxed text-navy-muted">
                Your agent has your assessment already, so the call starts with
                your situation rather than with paperwork. A calendar invite is
                on its way to your inbox.
              </p>

              <div className="mt-6 space-y-3">
                {status?.booking?.join_url && (
                  <Button asChild variant="elite" size="lg" className="h-12 w-full">
                    <a
                      href={status.booking.join_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join link
                    </a>
                  </Button>
                )}
                {status?.booking?.reschedule_url && (
                  <Button asChild variant="outline" className="h-11 w-full">
                    <a
                      href={status.booking.reschedule_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Reschedule
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}

          {view === 'pending' && (
            <>
              <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15">
                <Clock className="h-7 w-7 text-gold-dark" />
              </span>
              <h1 className="text-2xl font-bold text-navy md:text-3xl">
                Taking a little longer than usual
              </h1>
              <p className="mt-4 leading-relaxed text-navy-muted">
                We have not been able to confirm your booking on this screen
                yet. <strong>This does not mean anything went wrong</strong> — if
                your card went through, the payment is recorded and your booking
                will confirm shortly. You will get an email either way.
              </p>
              <p className="mt-4 leading-relaxed text-navy-muted">
                If you have not heard from us within the hour, contact us and
                quote your reference — do not pay again.
              </p>
              <Button
                variant="outline"
                className="mt-6 h-11 w-full"
                onClick={() => window.location.reload()}
              >
                Check again
              </Button>
            </>
          )}

          {view === 'unknown' && (
            <>
              <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15">
                <Mail className="h-7 w-7 text-gold-dark" />
              </span>
              <h1 className="text-2xl font-bold text-navy md:text-3xl">
                Check your email for confirmation
              </h1>
              <p className="mt-4 leading-relaxed text-navy-muted">
                We could not identify your booking from this link — most likely
                this is a different browser from the one you booked in. If you
                completed payment, your confirmation email is the record that
                matters.
              </p>
              <Button asChild variant="outline" className="mt-6 h-11 w-full">
                <Link to="/pre-screen">Back to the start</Link>
              </Button>
            </>
          )}

          {humanRef && (
            <div className="mt-8 border-t border-navy/10 pt-6 text-sm text-navy-muted">
              Reference:{' '}
              <span className="font-mono font-semibold text-navy">
                {humanRef}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
