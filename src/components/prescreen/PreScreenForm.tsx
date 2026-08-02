import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  preScreenService,
  type PreScreenResult,
  type ProspectParty,
} from '@/services/preScreenService';
import { getErrorMessage } from '@/lib/errorHandler';
import { saveProspectSession } from '@/lib/prospectSession';
import { FieldControl } from './FieldControl';
import {
  CONSENT_TEXT,
  stepsForParty,
  toPayload,
  type Answers,
  type FieldDef,
  type StepDef,
} from './formDefinition';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function visibleFields(step: StepDef, answers: Answers): FieldDef[] {
  return step.fields.filter((f) => !f.showWhen || f.showWhen(answers));
}

function isAnswered(field: FieldDef, answers: Answers): boolean {
  const v = answers[field.id];
  if (Array.isArray(v)) return v.length > 0;
  return typeof v === 'string' && v.trim().length > 0;
}

/** Validation message for a visible field, or null when it's valid. */
function validationError(field: FieldDef, answers: Answers): string | null {
  if (!isAnswered(field, answers)) {
    return field.required === false ? null : 'This question is required.';
  }

  const raw = (answers[field.id] as string).trim();

  if (field.type === 'email' && !EMAIL_RE.test(raw)) {
    return 'Please enter a valid email address.';
  }

  if (field.type === 'number') {
    const parsed = Number(raw.replace(/[,$\s]/g, ''));
    if (!Number.isFinite(parsed)) return 'Please enter a number.';
    if (field.min !== undefined && parsed < field.min) {
      return `Please enter ${field.min} or more.`;
    }
    if (field.max !== undefined && parsed > field.max) {
      return `Please enter ${field.max} or less.`;
    }
  }

  return null;
}

/**
 * The questionnaire runner.
 *
 * Consent sits on the final step and gates submission, tied to the visible
 * notice text — the backend rejects a submission without it, and stores the
 * exact wording shown. A pre-ticked box would not be consent, so it starts
 * unchecked and there is no way to skip it.
 */
export function PreScreenForm({
  party,
  onComplete,
  onExit,
}: {
  party: ProspectParty;
  onComplete: (result: PreScreenResult, answers: Answers) => void;
  onExit: () => void;
}) {
  const steps = useMemo(() => stepsForParty(party), [party]);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [consent, setConsent] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const step = steps[stepIndex];
  const fields = useMemo(() => visibleFields(step, answers), [step, answers]);
  const isLastStep = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const setAnswer = (field: FieldDef, value: Answers[string]) => {
    setAnswers((prev) => {
      const next = { ...prev, [field.id]: value };
      // Drop answers to questions that are no longer visible, so a stale value
      // from a branch the user backed out of cannot reach the engine and
      // change the verdict.
      for (const s of steps) {
        for (const f of s.fields) {
          if (f.showWhen && next[f.id] !== undefined && !f.showWhen(next)) {
            delete next[f.id];
          }
        }
      }
      return next;
    });
  };

  const stepValid =
    fields.every((f) => !validationError(f, answers)) &&
    (!isLastStep || consent);

  const goNext = async () => {
    if (!stepValid) {
      setShowErrors(true);
      requestAnimationFrame(() => {
        document
          .querySelector('[data-field-invalid="true"]')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    setShowErrors(false);

    if (!isLastStep) {
      setStepIndex(stepIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await preScreenService.submit(toPayload(party, answers));

      // Persist before handing off: the result screen leads to Calendly, and
      // once the visitor leaves our origin this is the only way back to their
      // record.
      saveProspectSession({
        prospectId: result.prospect_id,
        humanRef: result.human_ref,
        name: (answers.full_name as string) || undefined,
        email: (answers.email as string) || undefined,
        party,
      });

      onComplete(result, answers);
    } catch (error) {
      console.error('Pre-screen submission failed:', error);
      const message = getErrorMessage(error);
      setSubmitError(
        message && message !== 'An unexpected error occurred'
          ? message
          : 'Something went wrong while submitting your answers. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    setShowErrors(false);
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onExit();
    }
  };

  return (
    <motion.div
      key={`step-${step.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-navy-muted">
          <span>{step.name}</span>
          <span>
            Step {stepIndex + 1} of {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="rounded-2xl border-2 border-navy/10 bg-white p-6 shadow-soft-sm md:p-8">
        {step.title && (
          <h2 className="text-2xl font-bold text-navy">{step.title}</h2>
        )}
        {step.intro && (
          <p className="mt-2 text-sm leading-relaxed text-navy-muted">
            {step.intro}
          </p>
        )}

        <div className="mt-6 space-y-7">
          {fields.map((field) => (
            <FieldControl
              key={field.id}
              field={field}
              answers={answers}
              onChange={setAnswer}
              error={showErrors ? validationError(field, answers) : null}
            />
          ))}
        </div>

        {isLastStep && (
          <div
            className="mt-8 rounded-xl border border-navy/10 bg-cloud p-4"
            data-field-invalid={showErrors && !consent ? 'true' : undefined}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                className="mt-0.5"
                aria-describedby="consent-notice"
              />
              <span
                id="consent-notice"
                className="text-sm leading-relaxed text-navy-muted"
              >
                {CONSENT_TEXT}
              </span>
            </label>
            {showErrors && !consent && (
              <p className="mt-2 text-sm text-destructive">
                We need your consent before we can record your details.
              </p>
            )}
          </div>
        )}

        {submitError && (
          <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={submitting}
            className="gap-1.5 text-navy-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="elite"
            size="lg"
            onClick={goNext}
            disabled={submitting}
            className="h-12 min-w-40 gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking…
              </>
            ) : isLastStep ? (
              'See my result'
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
