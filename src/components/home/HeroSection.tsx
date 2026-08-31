import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Users,
  GraduationCap,
  Compass,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsultationCTA } from "@/components/common/ConsultationCTA";
import { SmartSearch } from "@/components/search/SmartSearch";
import { MigrationOutlookBanner } from "./MigrationOutlookBanner";
import { useIntentRouter } from "@/hooks/useIntentRouter";
import { type SkilledIntentResult } from "@/services/searchService";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

/**
 * Two states, not four.
 *
 * The hero used to swap in a "60-Second Onshore Strategy Audit" and the
 * strategy preview it produced. Both are gone with the onshore track: the
 * audit ended by handing the visitor to the pre-screen anyway, so it was five
 * questions asked twice, and the preview's numbers were an estimate nobody
 * downstream could use. Anyone who does not know where they fit now goes to
 * /get-started, which asks the same "which are you" question once and routes.
 */
type FlowState = "entry" | "skilled-result";

const FAMILY_ROUTE = "/partner-audit";
const EMPLOYER_SPONSORED_ROUTE = "/pre-screen";
const UNSURE_ROUTE = "/get-started";

interface HeroSectionProps {
  onSearchFocus?: () => void;
}

export function HeroSection({ onSearchFocus }: HeroSectionProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { config: siteConfig } = useSiteConfig();
  const homeConfig = siteConfig?.home;

  const [flowState, setFlowState] = useState<FlowState>("entry");
  const [searchQuery, setSearchQuery] = useState("");
  const [skilled, setSkilled] = useState<SkilledIntentResult | null>(null);

  const stats = usePlatformStats();

  // ---- Smart query router state logic ----
  const { resolve, isResolving } = useIntentRouter({
    onSkilled: (result) => {
      setSkilled(result);
      setFlowState("skilled-result");
    },
    // STUDENT + FAMILY navigate via the hook's defaults.
    onUnknown: () => navigate(UNSURE_ROUTE), // "unsure" -> the splitter
  });

  const handleSearchFocus = () => {
    if (isMobile && onSearchFocus) onSearchFocus();
  };

  const resetToEntry = () => {
    setFlowState("entry");
    setSkilled(null);
    setSearchQuery("");
  };

  const showEntry = flowState === "entry";
  const showSkilled = flowState === "skilled-result";

  return (
    <section className="relative overflow-hidden bg-cloud">
      {/* Animated background orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-32 right-[-10%] h-[500px] w-[500px] rounded-full bg-glacier/15 blur-[100px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 left-[-10%] h-[400px] w-[400px] rounded-full bg-navy/8 blur-[100px]"
          animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(213 75% 14%) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container px-4 py-16 md:px-6 md:py-24">
        <AnimatePresence mode="wait">
          {/* ---------- Two-Pronged Entry ---------- */}
          {showEntry && (
            <motion.div
              key="entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mx-auto max-w-4xl text-center">
                {/* "Trusted by 10,000+ migrants" stood here. There are no
                    users yet, so it was a fabricated social proof claim on the
                    first thing every visitor reads. Put a real number back
                    when there is one to put. */}
                <motion.div
                  className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold-dark shadow-soft-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Sparkles className="h-4 w-4 text-gold" />
                  MARA-registered migration agents
                </motion.div>

                <motion.h1
                  className="mb-6 text-4xl font-bold tracking-tight text-navy sm:text-5xl md:text-6xl leading-[1.05]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                >
                  {homeConfig?.heroHeadline || "Your Pathway to Australian Migration"}
                </motion.h1>

                <motion.p
                  className="mb-12 text-lg text-navy-muted md:text-xl max-w-2xl mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  {homeConfig?.heroSubtext || "Tell us where you're headed and we'll take you straight to the right pathway — no guessing which visa category you fit."}
                </motion.p>
              </div>

              {/* Two columns */}
              <motion.div
                className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Left — Work & Study Track */}
                <div className="flex min-w-0 flex-col rounded-2xl border-2 border-navy/10 bg-white p-6 text-left shadow-soft-sm">
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/5">
                      <GraduationCap className="h-5 w-5 text-navy" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-navy">
                        Work &amp; Study Track
                      </h2>
                      <p className="text-sm text-navy-muted">
                        Search an occupation or ANZSCO code
                      </p>
                    </div>
                  </div>
                  <SmartSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onResolve={resolve}
                    onFocus={handleSearchFocus}
                    isResolving={isResolving}
                  />
                  <p className="mt-3 text-xs text-navy-muted">
                    e.g. “261313”, “Software Engineer”, “Registered Nurse”
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    className="mt-4 h-auto min-h-12 w-full whitespace-normal text-base gap-2"
                    onClick={() => navigate(EMPLOYER_SPONSORED_ROUTE)}
                  >
                    Check Employer Sponsored Visa Eligibility
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Right — Family & Partner Track */}
                <div className="flex min-w-0 flex-col justify-between rounded-2xl border-2 border-gold/30 bg-gradient-to-br from-navy to-navy-dark p-6 text-left shadow-soft-sm">
                  <div>
                    <div className="mb-4 flex items-center gap-2.5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
                        <Users className="h-5 w-5 text-gold" />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          Family &amp; Partner Track
                        </h2>
                        <p className="text-sm text-white/70">
                          Partner or spouse sponsorship
                        </p>
                      </div>
                    </div>
                    <p className="mb-6 text-sm text-white/80 leading-relaxed">
                      Skip the career tools — go straight to a PR eligibility
                      check built around your relationship or sponsor.
                    </p>
                  </div>
                  <Button
                    variant="elite"
                    size="lg"
                    className="h-auto min-h-14 w-full whitespace-normal text-base gap-2"
                    onClick={() => navigate(FAMILY_ROUTE)}
                  >
                    Check Family &amp; Partner PR Eligibility
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>

              {/* Global fallback: the Get Started splitter */}
              <motion.button
                type="button"
                onClick={() => navigate(UNSURE_ROUTE)}
                className="mx-auto mt-5 flex max-w-4xl w-full items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-glacier/50 bg-glacier/5 px-6 py-5 text-left transition-colors hover:border-glacier hover:bg-glacier/10"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-glacier/15">
                    <Compass className="h-5 w-5 text-glacier-dark" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-base font-bold text-navy">
                      Unsure of your visa standing?
                    </span>
                    <span className="text-sm text-navy-muted">
                      Answer one question and we'll point you at the right check
                    </span>
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-navy" />
              </motion.button>

              {/* One real count, or nothing. Rendered only once /stats
                  answers — there is no placeholder figure to fall back on. */}
              {stats && (
                <motion.div
                  className="mt-12 flex flex-wrap items-center justify-center gap-10 text-sm text-navy-muted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-center">
                    <span className="block text-3xl font-bold text-navy">
                      {stats.occupations.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-widest text-glacier-dark">
                      Occupations assessed
                    </span>
                  </div>
                </motion.div>
              )}

              <MigrationOutlookBanner />
            </motion.div>
          )}

          {/* ---------- SKILLED split-screen result ---------- */}
          {showSkilled && skilled && (
            <motion.div
              key="skilled-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mx-auto max-w-4xl"
            >
              <div className="mb-6 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-dark border border-gold/20">
                  <Award className="h-3.5 w-3.5" />
                  {skilled.occupation.primaryList ?? "Skilled"} occupation
                </span>
                <h2 className="mt-3 text-2xl font-bold text-navy sm:text-3xl">
                  {skilled.occupation.title}
                </h2>
                <p className="text-sm text-navy-muted">
                  ANZSCO {skilled.occupation.anzscoCode}
                  {skilled.occupation.assessingAuthority
                    ? ` · Assessed by ${skilled.occupation.assessingAuthority}`
                    : ""}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <VisaStreamCard
                  title="Points-Tested"
                  subtitle="Independent & state-nominated (189 / 190 / 491)"
                  visas={skilled.pointsTested}
                  accent="navy"
                />
                <VisaStreamCard
                  title="Employer-Sponsored"
                  subtitle="Core Skills & nomination (482 / 186)"
                  visas={skilled.employerSponsored}
                  accent="gold"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <ConsultationCTA fullWidth={false} size="lg" className="h-12" />
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12"
                  onClick={resetToEntry}
                >
                  ← New search
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}

/** Compact eligibility column for one visa stream. */
function VisaStreamCard({
  title,
  subtitle,
  visas,
  accent,
}: {
  title: string;
  subtitle: string;
  visas: SkilledIntentResult["pointsTested"];
  accent: "navy" | "gold";
}) {
  const eligible = visas.length > 0;
  return (
    <div className="rounded-2xl border-2 border-navy/10 bg-white p-6 text-left shadow-soft-sm">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-lg font-bold text-navy">{title}</h3>
        <span
          className={
            eligible
              ? accent === "gold"
                ? "rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold-dark border border-gold/20"
                : "rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-semibold text-navy border border-navy/15"
              : "rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
          }
        >
          {eligible ? `${visas.length} option${visas.length > 1 ? "s" : ""}` : "Not eligible"}
        </span>
      </div>
      <p className="mb-4 text-sm text-navy-muted">{subtitle}</p>

      {eligible ? (
        <ul className="space-y-2.5">
          {visas.map((visa) => (
            <li
              key={visa.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-navy/10 bg-cloud/60 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-navy">
                  Subclass {visa.subclassNumber}
                  {visa.name ? ` — ${visa.name}` : ""}
                </p>
                <p className="text-xs text-navy-muted">{visa.streamTitle}</p>
              </div>
              <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-glacier-dark">
                {visa.residencyType}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-navy/15 bg-muted/20 px-4 py-6 text-center text-sm text-navy-muted">
          No direct eligibility via this stream for this occupation.
        </p>
      )}
    </div>
  );
}
