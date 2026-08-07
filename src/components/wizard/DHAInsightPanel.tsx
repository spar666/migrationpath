import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Info, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DHAInsightPanelProps {
  category: string;
}

interface InsightData {
  title: string;
  insight: string;
  proTip: string;
  source?: string;
}

const CATEGORY_INSIGHTS: Record<string, InsightData> = {
  Age: {
    title: "Age Points",
    insight: "The 25-32 age bracket receives maximum points (30). DHA prioritizes working-age migrants who can contribute for 30+ years.",
    proTip: "If you're approaching 33, consider lodging your EOI before your birthday to lock in higher points.",
    source: "DHA Points Table 2026",
  },
  English: {
    title: "English Proficiency",
    insight: "Superior English (20 pts) is often the deciding factor in 190 state invitations. States like NSW prioritize 8+ IELTS bands.",
    proTip: "PTE Academic is often considered easier to score high bands than IELTS. Consider retaking if you scored Proficient.",
    source: "State Nomination Guidelines",
  },
  Education: {
    title: "Education Qualifications",
    insight: "Australian qualifications receive 5 bonus points. A PhD from an Australian institution gives you 25 total education points.",
    proTip: "Regional study adds 5 points AND unlocks specific state streams like SA and Tasmania priority pathways.",
    source: "Migration Regulations 2026",
  },
  Experience: {
    title: "Work Experience",
    insight: "8+ years of skilled experience in your nominated occupation maximizes this category. Australian experience is valued 2x higher.",
    proTip: "Ensure your employer reference letters explicitly mention your ANZSCO duties. Generic letters often fail Skills Assessment.",
    source: "Skills Assessment Bodies",
  },
  Partner: {
    title: "Partner Status",
    insight: "Single applicants and those with skilled partners (10 pts) or partners with competent English (5 pts) receive significant boosts.",
    proTip: "If your partner has skilled experience, ensure they complete their Skills Assessment early to claim these critical 10 points.",
    source: "SkillSelect Regulation",
  },
  Results: {
    title: "Your Results",
    insight: "EOIs with high scores typically receive invitations faster. 65-80 points may wait longer depending on occupation demand.",
    proTip: "Consider state nomination (190) for an instant 5-point boost. Regional (491) adds 15 points with a 3-year regional commitment.",
    source: "SkillSelect Statistics",
  },
};

export function DHAInsightPanel({ category }: DHAInsightPanelProps) {
  const insight = CATEGORY_INSIGHTS[category];

  if (!insight) return null;

  return (
    <div className="space-y-4">
      {/* DHA Insight Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-glacier/20 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-glacier" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-luxury text-glacier/80 mb-1">
                DHA Insight
              </p>
              <h4 className="text-sm font-bold text-white">{insight.title}</h4>
            </div>
          </div>

          <p className="text-sm text-white/80 leading-relaxed mb-4">
            {insight.insight}
          </p>

          {insight.source && (
            <p className="text-xs text-white/40 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Source: {insight.source}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Pro-Tip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`pro-tip-${category}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-accent/10 border border-accent/30 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-navy" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
                  Pro-Tip
                </span>
              </div>
              <p className="text-sm text-white/90 leading-relaxed">
                {insight.proTip}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
