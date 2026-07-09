import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StickyAuditCTAProps {
  userPoints: number;
  className?: string;
}

export function StickyAuditCTA({ userPoints, className }: StickyAuditCTAProps) {
  const handleClick = () => {
    // Navigate to checkout/consultation booking
    console.log("Navigate to agent audit booking");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(
        "sticky top-4 z-10",
        className
      )}
    >
      <div className="rounded-2xl gradient-navy p-6 shadow-navy-glow overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-glacier/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          {/* Icon & Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-navy" />
            </div>
            <div>
              <p className="font-semibold text-white">MARA Registered Agent</p>
              <p className="text-sm text-white/70">Professional Points Audit</p>
            </div>
          </div>

          {/* Points Context */}
          <div className="mb-4 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-white/70">Your Current Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-accent">{userPoints}</span>
                <span className="text-sm text-white/50">pts</span>
              </div>
            </div>
            {userPoints < 90 && (
              <p className="text-xs text-white/60 mt-1">
                Our agents typically find +10-15 unclaimed points
              </p>
            )}
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleClick}
            className="w-full h-14 bg-white text-navy hover:bg-white/90 font-semibold text-base shadow-lg"
          >
            <ShieldCheck className="w-5 h-5 mr-2" />
            Get a Registered Agent to Audit My Points
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {/* Trust text */}
          <p className="text-center text-xs text-white/50 mt-3">
            $99 one-time • 48hr turnaround • 100% refund if no points found
          </p>
        </div>
      </div>
    </motion.div>
  );
}
