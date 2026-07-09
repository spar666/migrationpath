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
}: ConsultationCTAProps) {
  const navigate = useNavigate();
  return (
    <Button
      variant="elite"
      size={size}
      onClick={() => navigate(CONSULT_ROUTE)}
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
