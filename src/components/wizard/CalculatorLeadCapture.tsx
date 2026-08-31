import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarCheck, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { saveProspectSession } from "@/lib/prospectSession";
import { getErrorMessage } from "@/lib/errorHandler";
import { preScreenService, type PreScreenResult } from "@/services/preScreenService";
import type {
  StructuredPointsResult,
  UserProfileInput,
} from "@/services/pointsService";

/**
 * The calculator's only conversion path.
 *
 * The score itself is never gated — it renders above this, free, for anyone.
 * What sits behind the form is the part that needs a conversation: which of
 * 189 / 190 / 491 the score actually reaches, and therefore what to do next.
 * Gating the number instead would trade the site's most-used free tool for a
 * handful of reluctant emails.
 *
 * On submit this posts to `/pre-screen` — the same endpoint the employer and
 * partner funnels use — so a calculator lead lands in the one prospect
 * pipeline rather than a second, parallel list an agent has to remember to
 * check. The full input set, the score, the breakdown and the derived
 * per-subclass figures all ride along in `raw_answers`, so whoever picks up
 * the follow-up sees exactly what the visitor saw.
 */

/**
 * Legislated nomination points, not estimates.
 *
 * A 190 nomination is worth 5 and a 491 state/family sponsorship is worth 15,
 * fixed in the Migration Regulations — they are not invitation predictions and
 * nothing here claims a likelihood of being invited, which would need round
 * data this site does not have.
 *
 * They are still two numbers living in frontend code, which is the thing the
 * pass-mark wiring exists to avoid. They belong in `policy_config` next to
 * `points.gsmPassMark`; until the engine returns per-subclass totals, this is
 * the honest interim.
 */
const NOMINATION_POINTS = { "189": 0, "190": 5, "491": 15 } as const;

const SUBCLASS_LABELS: Record<keyof typeof NOMINATION_POINTS, string> = {
  "189": "Skilled Independent",
  "190": "State Nominated",
  "491": "Skilled Work Regional",
};

const SUBCLASS_NOTES: Record<keyof typeof NOMINATION_POINTS, string> = {
  "189": "No nomination needed. Your score as calculated.",
  "190": "With a state nomination (+5).",
  "491": "With state or family sponsorship (+15).",
};

/** Shown above the checkbox, and stored verbatim against the record. */
const CONSENT_TEXT =
  "I agree that MigrationPath may collect and use the details above to assess " +
  "my enquiry and contact me about it, as described in the Privacy Policy. " +
  "This assessment is a preliminary indication only and is not immigration advice.";

interface CalculatorLeadCaptureProps {
  profile: UserProfileInput;
  result: StructuredPointsResult;
}

export function CalculatorLeadCapture({ profile, result }: CalculatorLeadCaptureProps) {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  // Honeypot. Real visitors never see it; bots that fill every input do.
  const [website, setWebsite] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<PreScreenResult | null>(null);

  const passMark = result.passMark;
  const subclasses = (Object.keys(NOMINATION_POINTS) as Array<
    keyof typeof NOMINATION_POINTS
  >).map((subclass) => {
    const total = result.totalPoints + NOMINATION_POINTS[subclass];
    return {
      subclass,
      total,
      // Only claimed when the engine told us the mark. Without it we show the
      // figure and say nothing about whether it clears anything.
      meetsPassMark: passMark === undefined ? null : total >= passMark,
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !consent) {
      setError("Please enter your name and email, and agree to the notice.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const prospect = await preScreenService.submit({
        party: "applicant",
        contact: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          consent_given: true,
          consent_text: CONSENT_TEXT,
        },
        applicant: {
          age: profile.age,
        },
        // Everything the agent needs to open the call already informed: what
        // was entered, what it scored, and what that means per subclass.
        raw_answers: {
          calculator_inputs: {
            age: profile.age,
            english_level: profile.englishLevel,
            qualification: profile.qualification,
            overseas_work_years: profile.overseasWorkYears,
            australian_work_years: profile.australianWorkYears,
            regional_study: profile.regionalStudy,
          },
          calculator_score: {
            total_points: result.totalPoints,
            breakdown: result.breakdown,
            work_cap_applied: result.workCapApplied,
            below_pass_mark: result.belowPassMark,
            pass_mark: result.passMark,
          },
          competitiveness: subclasses.reduce(
            (acc, row) => ({ ...acc, [row.subclass]: row.total }),
            {} as Record<string, number>,
          ),
          website: website || undefined,
        },
        source: "points_calculator",
      });

      // Persist before showing the booking CTA: /consult/schedule and the
      // Stripe round trip after it both need this identity, and the visitor
      // leaves our origin in between.
      saveProspectSession({
        prospectId: prospect.prospect_id,
        humanRef: prospect.human_ref,
        name: fullName.trim(),
        email: email.trim(),
        party: "applicant",
      });

      setCaptured(prospect);
    } catch (err) {
      console.error("Calculator lead capture failed:", err);
      const message = getErrorMessage(err);
      setError(
        message && message !== "An unexpected error occurred"
          ? message
          : "Something went wrong saving your details. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const book = () => {
    if (!captured) return;
    navigate(
      `/consult/schedule?prospect_id=${captured.prospect_id}&ref=${captured.human_ref}`,
    );
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white shadow-glass">
      <AnimatePresence mode="wait">
        {!captured ? (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h3 className="text-base font-bold text-white">
              Which of 189 / 190 / 491 are you competitive for?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Your score is above and it stays free. Enter your details and
              we&rsquo;ll show how it lands against each subclass — and a
              registered agent will talk you through the options.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="calc-lead-name" className="text-xs font-medium text-white/70">
                  Full name
                </Label>
                <Input
                  id="calc-lead-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  disabled={submitting}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="calc-lead-email" className="text-xs font-medium text-white/70">
                  Email address
                </Label>
                <Input
                  id="calc-lead-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={submitting}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="calc-lead-phone" className="text-xs font-medium text-white/70">
                  Phone <span className="text-white/40">(optional)</span>
                </Label>
                <Input
                  id="calc-lead-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+61 400 000 000"
                  disabled={submitting}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              {/* Honeypot — off-screen rather than hidden, and labelled so a
                  screen reader knows to skip it. */}
              <div className="absolute -left-[9999px]">
                <Label htmlFor="calc-lead-website">Leave this field blank</Label>
                <Input
                  id="calc-lead-website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="flex items-start gap-3 pt-1">
                <Checkbox
                  id="calc-lead-consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  disabled={submitting}
                  className="mt-0.5 border-white/30 data-[state=checked]:bg-gold data-[state=checked]:text-navy"
                />
                <Label
                  htmlFor="calc-lead-consent"
                  className="text-xs font-normal leading-relaxed text-white/60"
                >
                  {CONSENT_TEXT}
                </Label>
              </div>

              {error && (
                <p className="rounded-lg bg-destructive/20 px-3 py-2 text-sm text-white">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="elite"
                className="h-12 w-full gap-2 text-base"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Show my subclass breakdown
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="flex items-center gap-2 text-base font-bold text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Your score against each subclass
            </h3>

            <div className="mt-4 space-y-2">
              {subclasses.map((row) => (
                <div
                  key={row.subclass}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      Subclass {row.subclass}
                      <span className="ml-2 font-normal text-white/50">
                        {SUBCLASS_LABELS[row.subclass]}
                      </span>
                    </p>
                    <p className="text-xs text-white/50">
                      {SUBCLASS_NOTES[row.subclass]}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-xl font-bold text-white">
                      {row.total}
                    </span>
                    {row.meetsPassMark !== null && (
                      <span
                        className={
                          row.meetsPassMark
                            ? "text-[11px] font-semibold text-emerald-400"
                            : "text-[11px] text-white/40"
                        }
                      >
                        {row.meetsPassMark ? "meets pass mark" : "below pass mark"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs leading-relaxed text-white/50">
              Meeting the pass mark is the entry requirement, not an invitation.
              Which subclass is realistic depends on your occupation and the
              state you target — that is the conversation to have next.
            </p>

            <div className="mt-5 rounded-lg border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
                Your reference
              </p>
              <p className="mt-1 font-mono text-lg font-bold tracking-wider text-white">
                {captured.human_ref}
              </p>
            </div>

            <Button
              variant="elite"
              className="mt-5 h-12 w-full gap-2 text-base"
              onClick={book}
            >
              <CalendarCheck className="h-4 w-4" />
              Book your consultation
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="mt-2 text-center text-xs text-white/40">
              Pick a time first — you confirm it with the consultation fee on
              the next step.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
