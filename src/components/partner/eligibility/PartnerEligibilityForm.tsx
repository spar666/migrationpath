import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Loader2,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ConsultationCTA } from "@/components/common/ConsultationCTA";
import {
  partnerEligibilityService,
  type PartnerEligibilityResult,
} from "@/services/partnerEligibilityService";
import { getErrorMessage } from "@/lib/errorHandler";
import {
  FORM_STEPS,
  type Answers,
  type FieldDef,
  type StepDef,
} from "./formDefinition";

type Phase = "cover" | "quiz" | "submitting" | "result";

/** Replace {applicant}/{sponsor} tokens with the collected first names. */
function personalize(text: string, a: Answers): string {
  const applicant = (a.applicantFirstName as string) || "the applicant";
  const sponsor = (a.sponsorFirstName as string) || "the sponsor";
  return text.replaceAll("{applicant}", applicant).replaceAll("{sponsor}", sponsor);
}

function visibleFields(step: StepDef, answers: Answers): FieldDef[] {
  return step.fields.filter((f) => !f.showWhen || f.showWhen(answers));
}

function isAnswered(field: FieldDef, answers: Answers): boolean {
  const v = answers[field.id];
  if (Array.isArray(v)) return v.length > 0;
  return typeof v === "string" && v.trim().length > 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Today's date as YYYY-MM-DD in local time, comparable to date-input values. */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Validation message for a visible field, or null when it's valid. */
function validationError(field: FieldDef, answers: Answers): string | null {
  const v = answers[field.id];
  if (!isAnswered(field, answers)) {
    return field.required === false ? null : "This question is required.";
  }
  if (field.type === "email" && typeof v === "string" && !EMAIL_RE.test(v.trim())) {
    return "Please enter a valid email address.";
  }
  if (field.type === "date" && typeof v === "string") {
    const today = todayISO();
    if (field.pastOnly && v > today) return "This date can't be in the future.";
    if (field.futureOnly && v < today) return "This date can't be in the past.";
  }
  return null;
}

export function PartnerEligibilityForm() {
  const [phase, setPhase] = useState<Phase>("cover");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<PartnerEligibilityResult | null>(null);

  const step = FORM_STEPS[stepIndex];
  const fields = useMemo(() => visibleFields(step, answers), [step, answers]);
  const progress = ((stepIndex + 1) / FORM_STEPS.length) * 100;

  const setAnswer = (field: FieldDef, value: Answers[string]) => {
    setAnswers((prev) => {
      const next = { ...prev, [field.id]: value };
      // Drop answers of questions that are no longer visible so stale values
      // can't leak into validation, submission or the eligibility outcome.
      for (const s of FORM_STEPS) {
        for (const f of s.fields) {
          if (f.showWhen && next[f.id] !== undefined && !f.showWhen(next)) {
            delete next[f.id];
          }
        }
      }
      return next;
    });
  };

  const stepValid = fields.every((f) => !validationError(f, answers));

  const goNext = async () => {
    if (!stepValid) {
      setShowErrors(true);
      // Bring the first invalid question into view so the user sees why
      // the step won't advance.
      requestAnimationFrame(() => {
        document
          .querySelector('[data-field-invalid="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setShowErrors(false);
    if (stepIndex < FORM_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    // Final step — submit to the backend.
    setPhase("submitting");
    setSubmitError(null);
    try {
      const res = await partnerEligibilityService.submit(answers);
      setResult(res);
      setPhase("result");
    } catch (error) {
      console.error("Eligibility submission failed:", error);
      const message = getErrorMessage(error);
      setSubmitError(
        message && message !== "An unexpected error occurred"
          ? message
          : "Something went wrong while submitting your answers. Please try again.",
      );
      setPhase("quiz");
    }
  };

  const goBack = () => {
    setShowErrors(false);
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else setPhase("cover");
  };

  return (
    <section className="bg-cloud py-10 md:py-16">
      <div className="container max-w-2xl px-4 md:px-6">
          {phase === "cover" && (
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-navy/10 bg-white p-8 shadow-soft-sm md:p-10"
            >
              <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15">
                <HeartHandshake className="h-7 w-7 text-gold-dark" />
              </span>
              <h1 className="text-3xl font-bold text-navy md:text-4xl">
                Check your eligibility for a partner visa
              </h1>
              <p className="mt-2 text-sm font-semibold text-navy-muted">
                Subclasses 820, 801, 309, 100, 300
              </p>
              <div className="my-6 border-t border-navy/10" />
              <p className="text-navy-muted leading-relaxed">
                Complete a short questionnaire to see if you meet the Australian
                Government's eligibility criteria for a partner visa.
              </p>
              <p className="mt-3 text-navy-muted">Time to complete: 5 minutes.</p>
              <div className="mt-6 rounded-xl border border-navy/10 bg-cloud px-4 py-3 text-sm text-navy-muted">
                🔒 We protect your information in accordance with our privacy
                policy.
              </div>
              <Button
                variant="elite"
                size="lg"
                className="mt-8 h-14 w-full gap-2 text-base"
                onClick={() => setPhase("quiz")}
              >
                Check your eligibility
                <ArrowRight className="h-5 w-5" />
              </Button>
            </motion.div>
          )}

          {(phase === "quiz" || phase === "submitting") && (
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
                    Step {stepIndex + 1} of {FORM_STEPS.length}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="rounded-2xl border-2 border-navy/10 bg-white p-6 shadow-soft-sm md:p-8">
                {step.title && (
                  <h2 className="mb-6 text-2xl font-bold text-navy">
                    {personalize(step.title, answers)}
                  </h2>
                )}

                <div className="space-y-7">
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

                {submitError && (
                  <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {submitError}
                  </p>
                )}

                <div className="mt-8 flex items-center justify-between gap-4">
                  <Button
                    variant="ghost"
                    onClick={goBack}
                    disabled={phase === "submitting"}
                    className="gap-1.5 text-navy-muted"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    variant="elite"
                    size="lg"
                    onClick={goNext}
                    disabled={phase === "submitting"}
                    className="h-12 min-w-40 gap-2"
                  >
                    {phase === "submitting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking…
                      </>
                    ) : stepIndex === FORM_STEPS.length - 1 ? (
                      "See my results"
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
          )}

          {phase === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border-2 border-navy/10 bg-white p-8 shadow-soft-sm md:p-10"
            >
              <ResultScreen result={result} />
            </motion.div>
          )}
      </div>
    </section>
  );
}

function FieldControl({
  field,
  answers,
  onChange,
  error,
}: {
  field: FieldDef;
  answers: Answers;
  onChange: (field: FieldDef, value: Answers[string]) => void;
  error: string | null;
}) {
  const label = personalize(field.label, answers);
  const value = answers[field.id];

  return (
    <div data-field-invalid={error ? "true" : undefined}>
      <Label className="text-base font-semibold text-navy">
        {label}
        {field.required === false && (
          <span className="ml-2 text-xs font-normal text-navy-muted">
            (optional)
          </span>
        )}
      </Label>
      {field.hint && (
        <p className="mt-1 text-sm text-navy-muted">{personalize(field.hint, answers)}</p>
      )}
      {field.bullets && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy-muted">
          {field.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        {field.type === "radio" && (
          <RadioGroup
            value={(value as string) ?? ""}
            onValueChange={(v) => onChange(field, v)}
            className="gap-2.5"
          >
            {field.options?.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                  value === opt
                    ? "border-gold bg-gold/5 text-navy"
                    : "border-navy/10 text-navy hover:border-navy/25"
                }`}
              >
                <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                <span>{opt}</span>
              </label>
            ))}
          </RadioGroup>
        )}

        {field.type === "checkboxes" && (
          <div className="space-y-2.5">
            {field.options?.map((opt) => {
              const selected = Array.isArray(value) && value.includes(opt);
              return (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                    selected
                      ? "border-gold bg-gold/5 text-navy"
                      : "border-navy/10 text-navy hover:border-navy/25"
                  }`}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) => {
                      const current = Array.isArray(value) ? value : [];
                      onChange(
                        field,
                        checked
                          ? [...current, opt]
                          : current.filter((v) => v !== opt),
                      );
                    }}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {field.type === "select" && (
          <Select
            value={(value as string) ?? ""}
            onValueChange={(v) => onChange(field, v)}
          >
            <SelectTrigger className="h-12 rounded-xl border-2 border-navy/10 bg-white text-navy">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(field.type === "text" || field.type === "email" || field.type === "date") && (
          <Input
            type={field.type === "email" ? "email" : field.type === "date" ? "date" : "text"}
            value={(value as string) ?? ""}
            maxLength={field.maxLength}
            min={field.type === "date" && field.futureOnly ? todayISO() : undefined}
            max={field.type === "date" && field.pastOnly ? todayISO() : undefined}
            aria-invalid={error ? true : undefined}
            onChange={(e) => onChange(field, e.target.value)}
            className="h-12 rounded-xl border-2 border-navy/10 bg-white text-navy"
          />
        )}

        {field.type === "textarea" && (
          <Textarea
            value={(value as string) ?? ""}
            maxLength={field.maxLength}
            onChange={(e) => onChange(field, e.target.value)}
            className="min-h-24 rounded-xl border-2 border-navy/10 bg-white text-navy"
          />
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ResultScreen({ result }: { result: PartnerEligibilityResult }) {
  const names = `${result.applicantFirstName} & ${result.sponsorFirstName}`;

  if (result.outcome === "eligible") {
    return (
      <div className="text-center">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/15">
          <CheckCircle2 className="h-9 w-9 text-gold-dark" />
        </span>
        <h2 className="text-3xl font-bold text-navy">
          Great news, {names}!
        </h2>
        <p className="mt-3 text-lg text-navy-muted">
          Based on your answers, you look like a strong candidate for a partner
          visa.
        </p>
        <div className="mx-auto mt-6 max-w-md space-y-4 text-left text-navy-muted leading-relaxed">
          <p>
            The next step is to book a free 30-minute consultation with one of
            our migration specialists.
          </p>
          <p>
            This meeting is an opportunity to learn more about your situation
            and develop your visa strategy — and your chance to ask any
            pressing questions and receive guidance from a knowledgeable
            professional.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-sm">
          <ConsultationCTA />
        </div>
      </div>
    );
  }

  if (result.outcome === "high_effort") {
    return (
      <div className="text-center">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-navy/5">
          <ShieldAlert className="h-9 w-9 text-navy" />
        </span>
        <h2 className="text-2xl font-bold text-navy md:text-3xl">
          We're sorry {names}, your case needs specialist attention.
        </h2>
        <div className="mx-auto mt-5 max-w-md space-y-4 text-left text-navy-muted leading-relaxed">
          <p>
            We've reviewed your answers and determined that, while you may be
            eligible for a partner visa, your application is more complex than
            our standard process supports.
          </p>
          <p>
            We recommend speaking with our team directly so a registered
            migration agent can review your circumstances one-on-one.
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-sm">
          <ConsultationCTA label="Talk to our team" />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-navy/5">
        <Mail className="h-9 w-9 text-navy" />
      </span>
      <h2 className="text-2xl font-bold text-navy md:text-3xl">
        We're sorry {names}, we won't be able to help with this application.
      </h2>
      <div className="mx-auto mt-5 max-w-md space-y-4 text-left text-navy-muted leading-relaxed">
        <p>
          We've reviewed your answers and determined that you don't meet the
          necessary criteria for a partner visa application at this time.
        </p>
        <p>
          We understand this may be disappointing and encourage you to review
          the requirements and explore other visa options that may be available
          to you — our team can help you find an alternative pathway.
        </p>
      </div>
      <div className="mx-auto mt-8 max-w-sm">
        <ConsultationCTA label="Explore other pathways" />
      </div>
    </div>
  );
}
