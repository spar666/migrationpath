import { motion } from "framer-motion";
import { TrendingUp, Clock, Zap, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

export function MigrationOutlookBanner() {
  const { config: siteConfig } = useSiteConfig();
  const homeConfig = siteConfig?.home;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mx-auto max-w-3xl mt-10"
    >
      {/* 2026 Migration Outlook */}
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-5 shadow-soft-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg gradient-navy flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-navy text-sm">{homeConfig?.outlookTitle || "2026 Migration Outlook"}</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">
                      Based on DHA announcements and current policy direction. Subject to change.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {homeConfig?.outlookDescription || (
                <>
                  Australia is shifting toward a <span className="font-semibold text-foreground">skills-first model</span>.
                  The new <span className="text-accent font-semibold">Skills in Demand (SID) visa</span> offers a
                  2-year pathway to PR for eligible professionals in priority occupations.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Live Stats Bar */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-success">
                <Zap className="w-4 h-4" />
                <span className="font-semibold">Live Processing</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-glacier-dark" />
                <span className="text-muted-foreground">Healthcare:</span>
                <span className="font-bold text-navy">{homeConfig?.processingTimeHealthcare || "7 Days"}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-glacier-dark" />
                <span className="text-muted-foreground">Tech:</span>
                <span className="font-bold text-navy">{homeConfig?.processingTimeTech || "14 Days"}</span>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2">
                <Clock className="w-4 h-4 text-glacier-dark" />
                <span className="text-muted-foreground">Engineering:</span>
                <span className="font-bold text-navy">21 Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
