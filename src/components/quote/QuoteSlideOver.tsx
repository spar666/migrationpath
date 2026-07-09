import { useState } from "react";
import { motion } from "framer-motion";
import { X, Calculator, FileText, Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { toast } from "sonner";

interface QuoteSlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  visaType: "",
  message: "",
};

export function QuoteSlideOver({ open, onOpenChange }: QuoteSlideOverProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiClient.post(API_ENDPOINTS.CREATE_LEAD, {
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        visa_type: formData.visaType || undefined,
        message: formData.message || undefined,
        source: "quote_slideover",
      });

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onOpenChange(false);
        setFormData(initialFormData);
      }, 2500);
    } catch (error) {
      console.error("Failed to submit quote request:", error);
      toast.error("Something went wrong submitting your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 border-l border-border overflow-y-auto">
        {/* Premium Header */}
        <div className="gradient-navy px-6 py-8 text-white">
          <SheetClose className="absolute right-4 top-4 rounded-lg p-2 text-white/70 transition-colors hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </SheetClose>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Calculator className="w-6 h-6 text-accent" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold text-white">Get Your Quote</SheetTitle>
              <SheetDescription className="text-white/70">
                Free, no-obligation assessment
              </SheetDescription>
            </div>
          </div>
          <p className="text-sm text-white/60">
            Our MARA-registered agents will review your case and provide a transparent cost breakdown within 24 hours.
          </p>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-navy" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Request Submitted!</h3>
              <p className="text-muted-foreground">
                Our team will be in touch within 24 hours with your personalized quote.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-navy">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12 border-border focus:border-accent focus:ring-accent/20"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-navy">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 border-border focus:border-accent focus:ring-accent/20"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-navy">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+61 400 000 000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-12 border-border focus:border-accent focus:ring-accent/20"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visaType" className="text-sm font-semibold text-navy">
                  Visa Type of Interest <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.visaType}
                  onValueChange={(value) => setFormData({ ...formData, visaType: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-12 border-border focus:border-accent focus:ring-accent/20">
                    <SelectValue placeholder="Select a visa pathway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skilled-189">Skilled Independent (189)</SelectItem>
                    <SelectItem value="skilled-190">State Nominated (190)</SelectItem>
                    <SelectItem value="skilled-491">Regional Skilled (491)</SelectItem>
                    <SelectItem value="employer-482">Employer Sponsored (482)</SelectItem>
                    <SelectItem value="employer-186">Employer Nominated (186)</SelectItem>
                    <SelectItem value="partner-820">Partner Visa (820/801)</SelectItem>
                    <SelectItem value="student-500">Student Visa (500)</SelectItem>
                    <SelectItem value="grad-485">Graduate Visa (485)</SelectItem>
                    <SelectItem value="other">Other / Not Sure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-semibold text-navy">
                  Tell us about your situation
                </Label>
                <Textarea
                  id="message"
                  placeholder="Any details that would help us understand your case..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="border-border focus:border-accent focus:ring-accent/20 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 btn-gold text-base font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Request My Free Quote
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By submitting, you agree to our privacy policy. We'll never share your details with third parties.
              </p>
            </form>
          )}
        </div>

        {/* Trust Badges */}
        <div className="border-t border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span>MARA Registered</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span>No Obligation</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
