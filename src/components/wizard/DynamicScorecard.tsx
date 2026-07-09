import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { 
  Award, 
  Clock, 
  Globe, 
  GraduationCap, 
  Briefcase, 
  Heart,
  TrendingUp,
  Sparkles,
  Target,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface DynamicScorecardProps {
  totalPoints: number;
  targetScore: number;
  breakdown: { [key: string]: { label: string; points: number } };
}

const CATEGORY_ICONS: { [key: string]: typeof Clock } = {
  Age: Clock,
  English: Globe,
  Education: GraduationCap,
  Experience: Briefcase,
  Partner: Heart,
};

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const controls = animate(prevValue.current, value, {
      duration: 0.5,
      onUpdate(val) {
        node.textContent = Math.round(val).toString();
      },
    });

    prevValue.current = value;

    return () => controls.stop();
  }, [value]);

  return <span ref={ref}>{value}</span>;
}

export function DynamicScorecard({ totalPoints, targetScore, breakdown }: DynamicScorecardProps) {
  const isPremium = totalPoints >= targetScore;
  const isCompetitive = totalPoints >= 65;
  const pointsToTarget = targetScore - totalPoints;

  // Derive dynamic threshold markers based on targetScore
  const minThreshold = 65; // absolute DHA minimum
  const goodThreshold = Math.max(minThreshold + 10, targetScore - 10);
  const premiumThreshold = targetScore;

  // Calculate gauge percentage (max 100 points displayed)
  const gaugePercentage = Math.min((totalPoints / 100) * 100, 100);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (gaugePercentage / 100) * circumference;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-luxury text-white/60 mb-1">
          Real-time Scorecard
        </p>
        <h3 className="text-lg font-bold text-white">Your PR Points</h3>
      </div>

      {/* Circular Gauge with Animated Number */}
      <div className="flex-shrink-0 mb-6">
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="10"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke={isPremium ? "url(#goldGradient)" : "url(#whiteGradient)"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C6A15B" />
                <stop offset="100%" stopColor="#E1B382" />
              </linearGradient>
              <linearGradient id="whiteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A9BCD0" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Content - Animated Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={totalPoints}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="text-center"
            >
              <span className={cn(
                "text-4xl font-bold tabular-nums",
                isPremium ? "text-accent" : "text-white"
              )} style={{ fontSize: '36px' }}>
                <AnimatedNumber value={totalPoints} />
              </span>
              <p className="text-sm text-white/60 mt-1">points</p>
            </motion.div>
          </div>

          {isPremium && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-10 h-10 rounded-full gradient-gold flex items-center justify-center shadow-gold-glow"
            >
              <Award className="w-5 h-5 text-navy" />
            </motion.div>
          )}
        </div>

        {/* Score Status */}
        <div className="text-center mt-4">
          {isPremium ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/40">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-accent">Premium Score</span>
            </div>
          ) : isCompetitive ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Competitive</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span className="text-sm font-medium text-white/60">Keep adding points</span>
            </div>
          )}
        </div>
      </div>

      {/* Target Score Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10"
      >
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-5 h-5 text-accent" />
          <span className="text-sm font-semibold text-white">Target: {targetScore} points</span>
        </div>
        <p className="text-sm text-white/70">
          {pointsToTarget <= 0 ? (
            <span className="text-success">🎉 You've reached the target!</span>
          ) : (
            <>You need <span className="font-bold text-accent">+{pointsToTarget} more</span> for typical invitations</>
          )}
        </p>
      </motion.div>

      {/* Points Breakdown List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {Object.entries(breakdown).map(([key, value], index) => {
            const Icon = CATEGORY_ICONS[key] || HelpCircle;
            const isActive = value.points > 0;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg transition-all",
                  isActive 
                    ? "bg-white/10 border border-accent/40" 
                    : "bg-white/5 border border-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    isActive ? "gradient-gold" : "bg-white/10 border border-white/20"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive ? "text-navy" : "text-white/40"
                    )} />
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    isActive ? "text-white" : "text-white/60"
                  )}>
                    {value.label}
                  </span>
                </div>
                <motion.span
                  key={`${key}-${value.points}`}
                  initial={{ scale: 1.2, color: "#C6A15B" }}
                  animate={{ scale: 1, color: isActive ? "#C6A15B" : "rgba(255,255,255,0.4)" }}
                  className={cn(
                    "text-sm font-bold tabular-nums px-2 py-0.5 rounded",
                    isActive ? "bg-accent/20" : ""
                  )}
                >
                  +{value.points}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Threshold Markers */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className={cn(
            "p-2 rounded-lg",
            totalPoints >= minThreshold ? "bg-white/10" : "bg-white/5"
          )}>
            <p className={cn(
              "text-lg font-bold",
              totalPoints >= minThreshold ? "text-white" : "text-white/40"
            )}>{minThreshold}</p>
            <p className="text-xs text-white/50">Minimum</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            totalPoints >= goodThreshold ? "bg-white/10" : "bg-white/5"
          )}>
            <p className={cn(
              "text-lg font-bold",
              totalPoints >= goodThreshold ? "text-white" : "text-white/40"
            )}>{goodThreshold}</p>
            <p className="text-xs text-white/50">Good</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            totalPoints >= premiumThreshold ? "bg-accent/20" : "bg-white/5"
          )}>
            <p className={cn(
              "text-lg font-bold",
              totalPoints >= premiumThreshold ? "text-accent" : "text-white/40"
            )}>{premiumThreshold}+</p>
            <p className="text-xs text-white/50">Excellent</p>
          </div>
        </div>
      </div>
    </div>
  );
}
