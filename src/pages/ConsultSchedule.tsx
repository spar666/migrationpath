import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, CalendarCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CalendlyEmbed,
  type ScheduledEventDetails,
} from '@/components/consultation/CalendlyEmbed';
import { openScheduler } from '@/lib/booking';
import { getProspectSession, resolveProspect } from '@/lib/prospectSession';
import { prospectStatusService } from '@/services/prospectStatusService';

/**
 * Step 2 of 3: pick a time.
 *
 * This page exists so the calendar runs on our origin. Linking out to
 * calendly.com ends the journey on Calendly's confirmation screen with the slot
 * held and the fee unpaid, and the only way back is a dashboard setting no test
 * can assert on. Hosting the widget here makes the hand-off to payment ordinary
 * code — see `onScheduled` below.
 *
 * The identity comes from the URL first and localStorage second, the same rule
 * /consult/book uses: a forwarded link is the only identity available in a
 * different browser, and when the two disagree the link the visitor just
 * clicked is the one they meant.
 */
export default function ConsultSchedule() {
  const navigate = useNavigate();
  const { prospectId, humanRef } = useMemo(
    () => resolveProspect(window.location.search),
    [],
  );
  const session = useMemo(() => getProspectSession(), []);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [handingOff, setHandingOff] = useState(false);

  useEffect(() => {
    document.title = 'Choose your consultation time | MigrationPath';
  }, []);

  /**
   * Calendly says the booking was made. Record it, then hand to payment.
   *
   * The report is what makes the next page work. The booking row is otherwise
   * created only by Calendly's invitee webhook — a server-to-server call that
   * is late under load, silent when the subscription or signing key is wrong,
   * and undeliverable altogether in local development. Without a row, checkout
   * has nothing to charge for and rejects the visitor over a slot they just
   * watched themselves book.
   *
   * Awaited rather than fired-and-forgotten: the whole point is that the row
   * exists before the payment page asks for it. But a failure here is not
   * allowed to strand anyone — the webhook may still land, so we move them on
   * either way and let /consult/book report what it actually finds.
   */
  const goToPayment = async (details: ScheduledEventDetails = {}) => {
    setHandingOff(true);

    if (prospectId && humanRef) {
      try {
        await prospectStatusService.reportBooking(prospectId, humanRef, details);
      } catch (error) {
        console.error('Could not record the booking:', error);
      }
    }

    navigate(`/consult/book?prospect_id=${prospectId}&ref=${humanRef ?? ''}`, {
      replace: true,
    });
  };

  /** Last resort when the widget will not load: send them off-site. */
  const openOffSite = () => {
    if (!prospectId) return;
    openScheduler({
      prospectId,
      humanRef: humanRef ?? undefined,
      name: session?.name,
      email: session?.email,
      target: '_blank',
    });
  };

  if (!prospectId) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-navy">
          We could not find your assessment
        </h1>
        <p className="mt-4 leading-relaxed text-navy-muted">
          The link may be incomplete, or this might be a different browser from
          the one you started in. Your assessment is safe — run the check again
          and you will be brought straight back here.
        </p>
        <Button asChild variant="elite" size="lg" className="mt-8 h-12">
          <Link to="/partner-audit">Back to the eligibility check</Link>
        </Button>
      </Shell>
    );
  }

  return (
    <Shell wide>
      <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15">
        <CalendarCheck className="h-7 w-7 text-gold-dark" />
      </span>

      <p className="text-xs font-semibold uppercase tracking-widest text-navy-muted">
        Step 2 of 3
      </p>
      <h1 className="mt-1 text-2xl font-bold text-navy md:text-3xl">
        Choose a time that suits you
      </h1>
      <p className="mt-3 leading-relaxed text-navy-muted">
        Pick a slot below. We will hold it for you, and you confirm it with the
        consultation fee on the next step.
      </p>

      {handingOff ? (
        <div className="mt-8 flex items-center gap-3 text-navy-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Time booked — taking you to the last step…</span>
        </div>
      ) : embedFailed ? (
        <div className="mt-8">
          <p className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              The calendar would not load here. You can still book in a new tab —
              come back to this page afterwards to pay and confirm.
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="elite" size="lg" onClick={openOffSite}>
              Open the calendar in a new tab
            </Button>
            {/* Booked off-site, so we saw no Calendly message and have no
                identifiers to report — just the fact that they say a slot
                exists. That is still worth recording: it gives checkout
                something to charge for, and the webhook fills in the rest. */}
            <Button variant="outline" size="lg" onClick={() => goToPayment()}>
              I have already picked a time
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <CalendlyEmbed
            prospectId={prospectId}
            humanRef={humanRef ?? undefined}
            name={session?.name}
            email={session?.email}
            medium={session?.party === 'business' ? 'pre_screen' : 'partner_audit'}
            onScheduled={goToPayment}
            onUnavailable={(error) => {
              console.error('Calendly embed unavailable:', error);
              setEmbedFailed(true);
            }}
          />
        </div>
      )}

      {humanRef && (
        <div className="mt-8 border-t border-navy/10 pt-6 text-sm text-navy-muted">
          Reference:{' '}
          <span className="font-mono font-semibold text-navy">{humanRef}</span>
        </div>
      )}
    </Shell>
  );
}

function Shell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-cloud py-10 md:py-16">
      <div className={`container px-4 md:px-6 ${wide ? 'max-w-3xl' : 'max-w-xl'}`}>
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
