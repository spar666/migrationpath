import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, BadgeCheck, CreditCard, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CostBreakdown } from "./CostBreakdown";
import { PaymentMilestones } from "./PaymentMilestones";
import { StartApplicationFlow } from "./StartApplicationFlow";

interface VisaOption {
  id: string;
  code: string;
  name: string;
  professionalFee: number;
  governmentFee: number;
  thirdPartyCosts: number;
}

interface QuoteSummaryProps {
  selectedVisa: VisaOption | null;
  consultationCredit: number;
}

const paymentMilestones = [
  {
    name: "Initial Deposit",
    percentage: 50,
    description: "Secure your case manager and begin document preparation",
  },
  {
    name: "Lodgment Payment",
    percentage: 50,
    description: "Final payment due upon visa application lodgment",
  },
];

export function QuoteSummary({ selectedVisa, consultationCredit }: QuoteSummaryProps) {
  const navigate = useNavigate();
  const [isFlowOpen, setIsFlowOpen] = useState(false);

  if (!selectedVisa) {
    return (
      <div className="p-8 rounded-xl border border-border bg-card shadow-card">
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-5">
            <CreditCard className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Select a Visa Subclass
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Choose your visa type to see a detailed cost breakdown and payment options.
          </p>
        </div>
      </div>
    );
  }

  const totalBeforeCredit =
    selectedVisa.professionalFee +
    selectedVisa.governmentFee +
    selectedVisa.thirdPartyCosts;
  const total = totalBeforeCredit - consultationCredit;

  return (
    <div className="space-y-6">
      {/* Selected Visa Header */}
      <div className="p-5 rounded-xl bg-secondary border border-border shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary text-primary-foreground">
            Subclass {selectedVisa.code}
          </span>
        </div>
        <h3 className="font-semibold text-foreground text-lg">{selectedVisa.name}</h3>
      </div>

      {/* Cost Breakdown */}
      <div className="p-6 md:p-8 rounded-xl border border-border bg-card shadow-card">
        <CostBreakdown
          professionalFee={selectedVisa.professionalFee}
          governmentFee={selectedVisa.governmentFee}
          thirdPartyCosts={selectedVisa.thirdPartyCosts}
          consultationCredit={consultationCredit}
        />
      </div>

      {/* Payment Milestones */}
      <div className="p-6 md:p-8 rounded-xl border border-border bg-card shadow-card">
        <PaymentMilestones
          totalAmount={total}
          milestones={paymentMilestones}
          currentMilestone={0}
        />
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        <Button
          variant="accent"
          size="lg"
          className="w-full"
          onClick={() => setIsFlowOpen(true)}
        >
          <FileEdit className="w-4 h-4 mr-2" />
          Start Application
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => navigate("/consultation")}
        >
          Book Free Consultation First
        </Button>
      </div>

      <StartApplicationFlow
        open={isFlowOpen}
        onOpenChange={setIsFlowOpen}
        visa={selectedVisa}
        total={total}
      />

      {/* Trust Indicators */}
      <div className="pt-5 border-t border-border space-y-3">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary border border-border">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <BadgeCheck className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">MARA Registered</p>
            <p className="text-xs text-muted-foreground">Agent #XXXXXXX</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary border border-border">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Secure Payments</p>
            <p className="text-xs text-muted-foreground">256-bit SSL encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
}
