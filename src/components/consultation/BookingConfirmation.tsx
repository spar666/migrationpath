import { motion } from "framer-motion";
import {
  useBookConsultation,
  hasBookableProspect,
} from "@/hooks/useBookConsultation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Clock,
  Video,
  Phone,
} from "lucide-react";

interface BookingConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionType: "priority" | "pathway" | "optimizer";
}

const SESSION_INFO = {
  priority: {
    title: "Priority Strategy Session",
    duration: "45 minutes",
    description: "Fast-track consultation for high-probability candidates",
    badge: "High Probability",
    badgeClass: "bg-accent/20 text-accent border-accent/30",
  },
  pathway: {
    title: "Pathway Consultation",
    duration: "30 minutes",
    description: "Strategic planning for competitive-range candidates",
    badge: "Competitive Range",
    badgeClass: "bg-primary/20 text-primary border-primary/30",
  },
  optimizer: {
    title: "Points Optimizer Call",
    duration: "30 minutes",
    description: "Identify quick wins to boost your points score",
    badge: "Building Profile",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
};

export function BookingConfirmation({
  open,
  onOpenChange,
  sessionType,
}: BookingConfirmationProps) {
  const session = SESSION_INFO[sessionType];
  const bookConsultation = useBookConsultation();
  const prospect = hasBookableProspect();

  /**
   * Into the funnel, not out of the site.
   *
   * This used to `window.open` a hardcoded calendly.com link left behind by a
   * "replace with actual Calendly link" placeholder. Three things were wrong
   * with it: the URL was not the live one, it carried no prospect id so any
   * resulting booking arrived unlinked and unpayable, and it landed on
   * Calendly's own confirmation screen — a dead end with no route to the
   * consultation fee. That is the screen people were getting stuck on.
   */
  const handleBook = () => {
    onOpenChange(false);
    bookConsultation();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center"
            >
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </motion.div>
          </div>
          <DialogTitle className="text-center">Assessment Complete!</DialogTitle>
          <DialogDescription className="text-center">
            You&apos;re ready to book your consultation
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 py-4"
        >
          {/* Session Card */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Badge className={session.badgeClass}>{session.badge}</Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {session.duration}
              </div>
            </div>
            <h4 className="font-semibold text-lg">{session.title}</h4>
            <p className="text-sm text-muted-foreground">{session.description}</p>
          </div>

          {/* What to Expect */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">What to expect:</h5>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                <span>1-on-1 video consultation with a MARA agent</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span>Personalized pathway recommendation</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>Follow-up support via email</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <Button
            onClick={handleBook}
            className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            size="lg"
          >
            <Calendar className="h-4 w-4" />
            {prospect ? "Choose a Time" : "Check your eligibility first"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {prospect
              ? "Pick a time, then confirm it with the consultation fee."
              : "We need a completed assessment before we can book you in."}
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
