import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, Clock, Lock, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreScreenForm } from '@/components/prescreen/PreScreenForm';
import { PreScreenResult } from '@/components/prescreen/PreScreenResult';
import type { Answers } from '@/components/prescreen/formDefinition';
import type {
  PreScreenResult as Result,
  ProspectParty,
} from '@/services/preScreenService';

/**
 * The funnel entry point.
 *
 * Deliberately without the site header and footer. This is a
 * distraction-free page: every link out of it is a lead that does not finish
 * the questionnaire, and the whole point of the page is that people finish it.
 *
 * The party fork is the first click rather than a question inside the form
 * because employer-sponsored genuinely has two sides — a worker seeking
 * sponsorship and a business seeking to sponsor need different questions, and
 * asking one set with "if you are a business, skip to 12" loses both.
 */

type Phase = 'splash' | 'form' | 'result';

const PARTY_CARDS: Array<{
  party: ProspectParty;
  icon: typeof UserRound;
  title: string;
  body: string;
}> = [
  {
    party: 'applicant',
    icon: UserRound,
    title: 'I’m looking to be sponsored',
    body: 'You want to work in Australia and need an employer to sponsor you — or you already have one lined up.',
  },
  {
    party: 'business',
    icon: Briefcase,
    title: 'I’m a business looking to sponsor',
    body: 'You have a role you cannot fill locally and want to know whether you can sponsor someone for it.',
  },
];

export default function PreScreen() {
  const [phase, setPhase] = useState<Phase>('splash');
  const [party, setParty] = useState<ProspectParty>('applicant');
  const [result, setResult] = useState<Result | null>(null);
  const [answers, setAnswers] = useState<Answers>({});

  /**
   * noindex, and removed again on unmount.
   *
   * A funnel entry page competing with the marketing site in search results
   * splits traffic and, worse, can surface a half-finished questionnaire URL
   * as the brand's top result. The cleanup matters because this is an SPA —
   * a tag left behind here would silently deindex every page the visitor
   * navigates to next.
   */
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    const previousTitle = document.title;
    document.title = 'Check your eligibility | MigrationPath';

    return () => {
      document.head.removeChild(meta);
      document.title = previousTitle;
    };
  }, []);

  const start = (selected: ProspectParty) => {
    setParty(selected);
    setPhase('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const complete = (submitted: Result, submittedAnswers: Answers) => {
    setResult(submitted);
    setAnswers(submittedAnswers);
    setPhase('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-cloud py-10 md:py-16">
      <div className="container max-w-2xl px-4 md:px-6">
        {phase === 'splash' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-2xl border-2 border-navy/10 bg-white p-8 shadow-soft-sm md:p-10">
              <h1 className="text-3xl font-bold text-navy md:text-4xl">
                Can you use an employer-sponsored visa?
              </h1>
              <p className="mt-4 leading-relaxed text-navy-muted">
                Answer a few questions and we will tell you where you stand —
                against the Department's requirements, and against what we can
                realistically help with. You get the result on screen, not in a
                sales call.
              </p>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-muted">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  About 3 minutes
                </span>
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  No account needed
                </span>
              </div>

              <div className="my-8 border-t border-navy/10" />

              <p className="text-sm font-semibold uppercase tracking-widest text-navy-muted">
                Which one are you?
              </p>

              <div className="mt-4 grid gap-4">
                {PARTY_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.party}
                      type="button"
                      onClick={() => start(card.party)}
                      className="group flex items-start gap-4 rounded-2xl border-2 border-navy/10 bg-white p-5 text-left transition-all hover:border-gold hover:shadow-soft-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15">
                        <Icon className="h-5 w-5 text-gold-dark" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold text-navy">
                          {card.title}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-navy-muted">
                          {card.body}
                        </span>
                      </span>
                      <ArrowRight className="mt-3 h-5 w-5 shrink-0 text-navy-muted transition-transform group-hover:translate-x-1 group-hover:text-gold-dark" />
                    </button>
                  );
                })}
              </div>

              <p className="mt-8 text-xs leading-relaxed text-navy-muted">
                This is a preliminary assessment, not immigration advice. We
                collect your details only to assess your enquiry and contact you
                about it — you will be asked to consent before anything is
                recorded.
              </p>
            </div>
          </motion.div>
        )}

        {phase === 'form' && (
          <PreScreenForm
            party={party}
            onComplete={complete}
            onExit={() => setPhase('splash')}
          />
        )}

        {phase === 'result' && result && (
          <PreScreenResult
            result={result}
            name={answers.full_name as string | undefined}
            email={answers.email as string | undefined}
          />
        )}
      </div>
    </div>
  );
}
