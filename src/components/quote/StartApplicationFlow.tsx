import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { pricingService } from "@/services/pricingService";
import { apiClient } from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { setPendingQuotePackage } from "@/lib/pendingQuote";
import { toast } from "sonner";

interface VisaOption {
  id: string;
  code: string;
  name: string;
  professionalFee: number;
  governmentFee: number;
  thirdPartyCosts: number;
}

interface StartApplicationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visa: VisaOption;
  total: number;
}

type Step = "details" | "payment";

export function StartApplicationFlow({
  open,
  onOpenChange,
  visa,
  total,
}: StartApplicationFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // Honeypot — real visitors never see or fill this field. Bots that fill
  // every input on a form will. See leads.controller.ts / CreateLeadDto on
  // the backend for how this is checked.
  const [website, setWebsite] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isReserving, setIsReserving] = useState(false);

  // Reset to a clean first step each time the dialog is reopened for a
  // (possibly different) visa, and prefill from the account if signed in.
  useEffect(() => {
    if (!open) return;
    setStep("details");
    setWebsite("");

    if (authService.isAuthenticated()) {
      authService
        .me()
        .then((profile) => {
          if (!profile) return;
          setFullName(profile.fullName || "");
          setEmail(profile.email || "");
        })
        .catch(() => {
          // Non-fatal — fields just stay editable/blank.
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visa.id]);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Please enter your name and email to continue.");
      return;
    }

    setIsSavingDetails(true);
    try {
      // Capture this as a lead the moment intent is expressed — this is
      // the safety net: even if the visitor never reaches or completes
      // payment, their details and package interest are already recorded.
      await apiClient.post(API_ENDPOINTS.CREATE_LEAD, {
        full_name: fullName,
        email,
        phone: phone || undefined,
        visa_type: visa.code,
        package_id: visa.id,
        source: "quote_page",
        website: website || undefined,
      });
    } catch (error) {
      // Non-blocking — a failed lead capture shouldn't stop someone from
      // continuing their application. Logged for visibility only.
      console.error("Failed to record application lead:", error);
    } finally {
      setIsSavingDetails(false);
    }

    setStep("payment");
  };

  const handleReserve = async () => {
    if (!authService.isAuthenticated()) {
      setPendingQuotePackage(visa.id);
      toast.info("Please sign in or create an account to reserve your application.");
      onOpenChange(false);
      navigate("/auth?returnTo=/quote");
      return;
    }

    setIsReserving(true);
    try {
      await pricingService.createQuote(
        visa.id,
        `Application started via /quote for ${fullName || "account holder"}.`,
      );
      toast.success("Your application has been reserved. Our team will follow up shortly.");
      onOpenChange(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to reserve application:", error);
      toast.error("Something went wrong reserving your application. Please try again.");
    } finally {
      setIsReserving(false);
    }
  };

  const handleBookConsultationInstead = () => {
    onOpenChange(false);
    navigate("/consultation");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "details" ? (
          <>
            <DialogHeader>
              <DialogTitle>Let's start your application</DialogTitle>
              <DialogDescription>
                Confirm your details so we can prepare your {visa.code} case file.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleDetailsSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="app-name">Full name</Label>
                <Input
                  id="app-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  disabled={isSavingDetails}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-email">Email address</Label>
                <Input
                  id="app-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isSavingDetails}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app-phone">Phone number</Label>
                <Input
                  id="app-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+61 400 000 000"
                  disabled={isSavingDetails}
                />
              </div>

              {/* Honeypot field — hidden from real visitors via CSS, left
                  in the tab order for screen readers but labeled so they
                  know to skip it. Bots filling every field will trip it. */}
              <div className="absolute -left-[9999px]" aria-hidden="false">
                <Label htmlFor="app-website">Leave this field blank</Label>
                <Input
                  id="app-website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSavingDetails}>
                {isSavingDetails ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Continue to payment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Reserve your application</DialogTitle>
              <DialogDescription>
                {visa.name} (Subclass {visa.code})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-lg bg-secondary border border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount due today</span>
                <span className="text-xl font-bold text-foreground">
                  ${Math.round(total * 0.5).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This reserves your case with a 50% initial deposit. A member of our team will
                contact you within 24 hours to complete payment and confirm your case manager.
              </p>

              <Button
                variant="accent"
                size="lg"
                className="w-full"
                onClick={handleReserve}
                disabled={isReserving}
              >
                {isReserving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                Reserve my application
              </Button>

              <div className="relative py-1 text-center">
                <span className="text-xs text-muted-foreground bg-background px-2 relative z-10">
                  or
                </span>
                <div className="absolute inset-x-0 top-1/2 h-px bg-border -translate-y-1/2" />
              </div>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleBookConsultationInstead}
              >
                Not ready to pay? Book a free consultation instead
              </Button>

              <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                No payment is taken in this step — you'll confirm payment with your case manager.
              </div>

              <button
                type="button"
                onClick={() => setStep("details")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to your details
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
