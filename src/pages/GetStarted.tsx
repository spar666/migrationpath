import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Calculator, Heart, ShieldCheck } from "lucide-react";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";

/**
 * The one front door.
 *
 * Every primary "get started" CTA on the site now lands here instead of on a
 * price list. The old /quote page anchored the first conversation on cost and
 * ended at a dashboard that no longer exists; this asks the only question that
 * actually changes what we do next — which situation are you in — and hands
 * the visitor straight to the matching questionnaire.
 *
 * A router, not a form. Nothing is collected on this page: every destination
 * below already asks its own questions properly, and a field asked twice is a
 * field answered once.
 *
 * Two situations are deliberately missing. The recent-graduate (485) lead form
 * and the internationally-recognised-expert (858) funnel do not exist yet, so
 * offering them here would route people to a 404. Add each option in this list
 * as its funnel comes online — nothing else needs to change.
 */

const OPTIONS = [
  {
    to: "/points-calculator",
    icon: Calculator,
    title: "I'm a skilled worker applying on points",
    body: "Skilled Independent, State Nominated or Regional. Start by scoring your points profile — it decides which subclasses are even open to you.",
    action: "Score my points",
  },
  {
    to: "/partner-audit",
    icon: Heart,
    title: "I'm applying through a partner or family member",
    body: "Partner, parent and family sponsorship. The eligibility check covers your relationship, your sponsor and the evidence you'll need.",
    action: "Check partner eligibility",
  },
  {
    to: "/pre-screen",
    icon: Briefcase,
    title: "I'm employer-sponsored, or I'm a business sponsoring someone",
    body: "Skills in Demand, ENS and regional sponsorship. Two minutes of questions and we'll tell you where you stand — from either side.",
    action: "Start the pre-screen",
  },
];

export default function GetStarted() {
  useEffect(() => {
    document.title = "Get started | MigrationPath";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cloud pb-20 md:pb-0">
      <Header />

      <main className="flex-1">
        <section className="relative gradient-navy text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(198,161,91,0.12)_0%,transparent_60%)]" />
          <div className="container relative px-4 md:px-6 py-16 md:py-20">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-luxury text-accent">
                Get Started
              </span>
              <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                Which of these sounds like you?
              </h1>
              <p className="mt-4 text-lg text-white/80 leading-relaxed">
                Australia's migration system asks completely different questions of a
                skilled applicant, a partner applicant and a sponsored worker. Pick the one
                that fits and we'll take you straight to the right assessment.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="grid gap-5 md:gap-6 lg:grid-cols-3 max-w-6xl">
              {OPTIONS.map((option, index) => (
                <motion.div
                  key={option.to}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link
                    to={option.to}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-soft-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-soft-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center mb-5 shrink-0">
                      <option.icon className="w-6 h-6 text-navy" />
                    </div>

                    <h2 className="text-lg font-bold text-navy leading-snug mb-3">
                      {option.title}
                    </h2>

                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {option.body}
                    </p>

                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                      {option.action}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 max-w-6xl rounded-xl border border-border/60 bg-white/60 p-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Not sure yet?</span>{" "}
                Speak to a MARA-registered agent first — a{" "}
                <Link to="/consultation" className="font-medium text-accent hover:underline">
                  consultation
                </Link>{" "}
                sorts out which pathway applies before you fill in anything.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
              <span>
                Every assessment is reviewed by MARA-registered agents. No account needed.
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
