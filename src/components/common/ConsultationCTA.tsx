import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CONSULT_CTA_LABEL, CONSULT_ROUTE } from "@/constants/cta";

interface ConsultationCTAProps {
  /** Override the label only when there is a strong reason to; defaults keep the site consistent. */
  label?: string;
  className?: string;
  fullWidth?: boolean;
  size?: "default" | "lg";
  /**
   * Overrides the destination.
   *
   * Funnels that have already identified the prospect (the partner audit) pass
   * their own handler so the click opens the scheduler with that prospect's id
   * attached, rather than routing to /consultation and asking the same
   * questions a second time. Without an id the resulting Calendly booking
   * cannot be linked back to any record, so this is not a general-purpose
   * "link to Calendly" escape hatch — only pass it when you have a prospect.
   */
  onClick?: () => void;
}

/**
 * The site's single primary CTA. Use this anywhere the money action appears so
 * the label and destination stay identical everywhere.
 */
export function ConsultationCTA({
  label = CONSULT_CTA_LABEL,
  className,
  fullWidth = true,
  size = "lg",
  onClick,
}: ConsultationCTAProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="elite"
      size={size}
      onClick={onClick ?? (() => navigate(CONSULT_ROUTE))}
      className={cn(
        "gap-2 shadow-gold-glow",
        fullWidth && "w-full",
        size === "lg" && "h-14 text-base",
        className,
      )}
    >
      {label}
      <ArrowRight className="h-5 w-5" />
    </Button>
  );
}
