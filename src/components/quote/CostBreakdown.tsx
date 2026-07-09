import { Info, Gift, Shield } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CostBreakdownProps {
  professionalFee: number;
  governmentFee: number;
  thirdPartyCosts: number;
  consultationCredit: number;
}

export function CostBreakdown({
  professionalFee,
  governmentFee,
  thirdPartyCosts,
  consultationCredit,
}: CostBreakdownProps) {
  const subtotal = professionalFee + governmentFee + thirdPartyCosts;
  const total = subtotal - consultationCredit;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Cost Breakdown</h3>
      
      <div className="space-y-3">
        {/* Professional Fee */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">Professional Fee</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Our agency fee for complete visa application management, including document review, 
                  form preparation, and lodgment support.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="font-medium text-foreground">
            ${professionalFee.toLocaleString()}
          </span>
        </div>

        {/* Government Charges */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">Government Charges</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Official Department of Home Affairs visa application charge. 
                  This is paid directly to the government.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="font-medium text-foreground">
            ${governmentFee.toLocaleString()}
          </span>
        </div>

        {/* Third-Party Costs */}
        {thirdPartyCosts > 0 && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">Third-Party Costs</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    Includes skills assessment fees, NAATI certification, or other 
                    third-party service charges as required.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="font-medium text-foreground">
              ${thirdPartyCosts.toLocaleString()}
            </span>
          </div>
        )}

        {/* Consultation Credit */}
        <div className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">
              Initial Strategy Consultation
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">
              CREDITED
            </span>
          </div>
          <span className="font-medium text-accent">
            -${consultationCredit.toLocaleString()}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-4" />

        {/* Total */}
        <div className="flex items-center justify-between py-2">
          <span className="text-base font-semibold text-foreground">Estimated Total</span>
          <span className="text-2xl font-bold text-foreground">
            ${total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Trust Indicator */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span>All fees are transparent with no hidden charges</span>
        </div>
      </div>
    </div>
  );
}
