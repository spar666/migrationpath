import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveProspectSession } from '@/lib/prospectSession';
import type { PreScreenResult as Result } from '@/services/preScreenService';

/**
 * The dual-gate result screen.
 *
 * Two independent flags come back, and collapsing them into one verdict would
 * lose the case that matters commercially: someone who meets the Department's
 * rules but is not a client we can help (`statutory_eligible` true,
 * `client_fit` false). They get an honest answer and a referral, not a booking
 * link — taking their money for a consult we cannot act on is how a migration
 * practice earns complaints.
 *
 * So there are three outcomes, not two, and only the first shows a Book button.
 */

type Outcome = 'proceed' | 'not_a_fit' | 'not_eligible';

function outcomeOf(result: Result): Outcome {
  if (result.can_book) return 'proceed';
  if (result.statutory_eligible) return 'not_a_fit';
  return 'not_eligible';
}

const PRESENTATION: Record<
  Outcome,
  {
    icon: typeof CheckCircle2;
    iconClass: string;
    ringClass: string;
    heading: string;
    lede: string;
  }
> = {
  proceed: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    ringClass: 'bg-emerald-500/10',
    heading: 'You look eligible — let’s talk',
    lede: 'Based on what you told us you meet the requirements as we understand them, and this is the kind of case we can take on. The next step is a consultation with a registered agent.',
  },
  not_a_fit: {
    icon: Info,
    iconClass: 'text-gold-dark',
    ringClass: 'bg-gold/15',
    heading: 'You may be eligible, but we’re not the right firm',
    lede: 'Your answers suggest you could meet the requirements. This particular matter sits outside what we take on, so it would be wrong of us to sell you a consultation. Here is what we would do in your position.',
  },
  not_eligible: {
    icon: ShieldAlert,
    iconClass: 'text-destructive',
    ringClass: 'bg-destructive/10',
    heading: 'Not yet — here’s what’s in the way',
    lede: 'Based on what you told us, an employer-sponsored application would not succeed as things stand today. That is often a timing problem rather than a permanent one.',
  },
};

function ReasonList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'neutral' | 'warning';
}) {
  if (!items?.length) return null;

  const Icon = tone === 'warning' ? AlertTriangle : CheckCircle2;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-navy-muted">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-navy">
            <Icon
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                tone === 'warning' ? 'text-destructive' : 'text-emerald-600'
              }`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PreScreenResult({
  result,
  name,
  email,
}: {
  result: Result;
  name?: string;
  email?: string;
}) {
  const navigate = useNavigate();
  const outcome = outcomeOf(result);
  const presentation = PRESENTATION[outcome];
  const Icon = presentation.icon;

  /**
   * To the calendar we host, not to calendly.com.
   *
   * Sending someone off-site ended the journey on Calendly's own confirmation
   * page (`/invitees/<uuid>`) holding an unpaid slot, with nothing pointing
   * back at the consultation fee. That page is a dead end we do not control:
   * the only way to move someone off it is a redirect configured inside the
   * Calendly dashboard, which nobody can see is missing and no test can assert
   * on. /consult/schedule runs the same calendar on our origin and moves them
   * to payment itself.
   */
  const book = () => {
    saveProspectSession({
      prospectId: result.prospect_id,
      humanRef: result.human_ref,
      name,
      email,
    });
    navigate(
      `/consult/schedule?prospect_id=${result.prospect_id}&ref=${result.human_ref}`,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border-2 border-navy/10 bg-white p-8 shadow-soft-sm md:p-10"
    >
      <span
        className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${presentation.ringClass}`}
      >
        <Icon className={`h-7 w-7 ${presentation.iconClass}`} />
      </span>

      <h1 className="text-3xl font-bold text-navy md:text-4xl">
        {presentation.heading}
      </h1>
      <p className="mt-4 leading-relaxed text-navy-muted">
        {presentation.lede}
      </p>

      {result.recommended_label && outcome !== 'not_eligible' && (
        <div className="mt-6 rounded-xl border border-navy/10 bg-cloud px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-navy-muted">
            Most likely pathway
          </p>
          <p className="mt-1 font-semibold text-navy">
            {result.recommended_label}
            {result.recommended_subclass && (
              <span className="ml-2 font-normal text-navy-muted">
                (subclass {result.recommended_subclass})
              </span>
            )}
          </p>
        </div>
      )}

      <ReasonList title="What works in your favour" items={result.reasons} tone="neutral" />
      <ReasonList title="What’s in the way" items={result.blockers} tone="warning" />
      <ReasonList title="What to do next" items={result.next_steps} tone="neutral" />

      {/* The reference. Shown to everyone regardless of outcome — an
          ineligible person who improves their position in six months should be
          able to quote it and pick up where they left off. */}
      <div className="mt-8 rounded-xl border border-navy/10 bg-cloud px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-navy-muted">
          Your reference
        </p>
        <p className="mt-1 font-mono text-xl font-bold tracking-wider text-navy">
          {result.human_ref}
        </p>
        <p className="mt-2 text-sm text-navy-muted">
          Quote this in any email or call about your enquiry. We have emailed it
          to you as well.
        </p>
      </div>

      {outcome === 'proceed' && (
        <>
          <Button
            variant="elite"
            size="lg"
            className="mt-8 h-14 w-full gap-2 text-base"
            onClick={book}
          >
            <CalendarCheck className="h-5 w-5" />
            Book your consultation
            <ArrowRight className="h-5 w-5" />
          </Button>
          <p className="mt-3 text-center text-sm text-navy-muted">
            Pick a time first — you confirm it with the consultation fee on the
            next step.
          </p>
        </>
      )}

      {outcome === 'not_a_fit' && (
        <div className="mt-8 rounded-xl border border-navy/10 bg-cloud px-4 py-4 text-sm leading-relaxed text-navy-muted">
          We have kept your details. If your circumstances change — a different
          employer, a different role — reply to our email with your reference and
          we will re-assess at no charge.
        </div>
      )}

      {outcome === 'not_eligible' && (
        <div className="mt-8 rounded-xl border border-navy/10 bg-cloud px-4 py-4 text-sm leading-relaxed text-navy-muted">
          If you work through the points above and your position changes, quote
          your reference and we will re-run this for you. Nothing here is a
          permanent decision.
        </div>
      )}

      {/* Not boilerplate. A pre-screen that reads as advice is a regulatory
          problem, and the engine's thresholds are configuration that changes
          at least annually. */}
      <p className="mt-8 border-t border-navy/10 pt-6 text-xs leading-relaxed text-navy-muted">
        This is an automated preliminary assessment based only on the answers
        you gave. It is not immigration advice and is not a decision by the
        Department of Home Affairs. Only a registered migration agent can advise
        on your circumstances.
      </p>
    </motion.div>
  );
}
