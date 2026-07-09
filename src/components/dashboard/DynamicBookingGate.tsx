import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  Phone, 
  Target, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useOccupationThreshold } from "@/hooks/useOccupationThreshold";
import { PreSessionQuestionnaire, BookingConfirmation } from "@/components/consultation";

interface DynamicBookingGateProps {
  pointsScore: number | null;
  anzscoCode: string | null;
  occupationTitle?: string | null;
  onBookConsultation?: () => void;
}

type BookingState = "high_probability" | "standard" | "under_threshold";

export function DynamicBookingGate({
  pointsScore,
  anzscoCode,
  occupationTitle,
  onBookConsultation,
}: DynamicBookingGateProps) {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const { data: threshold, isLoading } = useOccupationThreshold(anzscoCode);

  const score = pointsScore ?? 0;
  const highProbabilityPoints = threshold?.high_probability_points ?? 85;
  const minLegalPoints = threshold?.min_legal_points ?? 65;

  // Determine booking state
  const getBookingState = (): BookingState => {
    if (score >= highProbabilityPoints) return "high_probability";
    if (score >= minLegalPoints) return "standard";
    return "under_threshold";
  };

  const bookingState = getBookingState();
  const pointsToHighProbability = Math.max(0, highProbabilityPoints - score);
  const progressToThreshold = Math.min(100, (score / highProbabilityPoints) * 100);

  const handleBookClick = () => {
    setShowQuestionnaire(true);
  };

  const handleQuestionnaireComplete = () => {
    setShowQuestionnaire(false);
    setShowBookingConfirmation(true);
    onBookConsultation?.();
  };

  const getSessionType = (): "priority" | "pathway" | "optimizer" => {
    if (bookingState === "high_probability") return "priority";
    if (bookingState === "standard") return "pathway";
    return "optimizer";
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-8">
          <div className="h-24 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // High Probability State - Priority Strategy Session
  if (bookingState === "high_probability") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden border-accent/30 bg-gradient-to-br from-accent/5 via-card to-card shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-accent/20 text-accent border-accent/30 gap-1">
                <Sparkles className="h-3 w-3" />
                High Probability
              </Badge>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground mt-2">
              Priority Strategy Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your profile exceeds the high-probability threshold. Fast-track your application with expert guidance on lodgement timing and documentation.
            </p>

            {/* Market Insight */}
            {threshold && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium text-emerald-600">Market Insight:</span>{" "}
                    <span className="text-foreground">
                      For {occupationTitle || `ANZSCO ${anzscoCode}`}, invitations were last issued at{" "}
                      <strong>{highProbabilityPoints} points</strong>. You are{" "}
                      <strong className="text-emerald-600">{score - highProbabilityPoints} points above</strong> the high-probability threshold.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleBookClick}
              className="w-full gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              size="lg"
            >
              <Calendar className="h-4 w-4" />
              Book Priority Session
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <PreSessionQuestionnaire
          open={showQuestionnaire}
          onOpenChange={setShowQuestionnaire}
          onComplete={handleQuestionnaireComplete}
        />
        <BookingConfirmation
          open={showBookingConfirmation}
          onOpenChange={setShowBookingConfirmation}
          sessionType={getSessionType()}
        />
      </motion.div>
    );
  }

  // Standard State - Pathway Consultation
  if (bookingState === "standard") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="relative overflow-hidden border-primary/20 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="gap-1">
                <Target className="h-3 w-3" />
                Competitive Range
              </Badge>
              <span className="text-sm font-medium text-muted-foreground">
                {score} / {highProbabilityPoints} pts
              </span>
            </div>
            <CardTitle className="text-lg font-bold text-foreground mt-2">
              Pathway Consultation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You meet the minimum threshold but could strengthen your profile. Our specialists can identify quick wins for state nomination or regional pathways.
            </p>

            {/* Progress to High Probability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to High Probability</span>
                <span className="font-medium text-foreground">{Math.round(progressToThreshold)}%</span>
              </div>
              <Progress value={progressToThreshold} className="h-2" />
            </div>

            {/* Market Insight */}
            {threshold && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium text-amber-600">Market Insight:</span>{" "}
                    <span className="text-foreground">
                      For {occupationTitle || `ANZSCO ${anzscoCode}`}, invitations were last issued at{" "}
                      <strong>{highProbabilityPoints} points</strong>. You are{" "}
                      <strong className="text-amber-600">{pointsToHighProbability} points away</strong> from a high-probability profile.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleBookClick}
              variant="outline"
              className="w-full gap-2"
              size="lg"
            >
              <Phone className="h-4 w-4" />
              Book Pathway Consultation
            </Button>
          </CardContent>
        </Card>

        <PreSessionQuestionnaire
          open={showQuestionnaire}
          onOpenChange={setShowQuestionnaire}
          onComplete={handleQuestionnaireComplete}
        />
        <BookingConfirmation
          open={showBookingConfirmation}
          onOpenChange={setShowBookingConfirmation}
          sessionType={getSessionType()}
        />
      </motion.div>
    );
  }

  // Under Threshold State - Points Optimizer
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Below Threshold
            </Badge>
            <span className="text-sm font-medium text-destructive">
              {score} / {minLegalPoints} pts
            </span>
          </div>
          <CardTitle className="text-lg font-bold text-foreground mt-2">
            Points Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You need at least {minLegalPoints} points to be eligible for an EOI. Let's identify the fastest ways to boost your score.
          </p>

          {/* Points Needed */}
          <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Points Needed</span>
              <span className="text-lg font-bold text-destructive">
                +{minLegalPoints - score}
              </span>
            </div>
            <Progress value={(score / minLegalPoints) * 100} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-amber-500" />
              Quick wins: English proficiency, NAATI, PY program
            </div>
          </div>

          {/* Market Insight */}
          {threshold && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-blue-600">Market Insight:</span>{" "}
                  <span className="text-foreground">
                    For {occupationTitle || `ANZSCO ${anzscoCode}`}, invitations were last issued at{" "}
                    <strong>{highProbabilityPoints} points</strong>. You are{" "}
                    <strong className="text-blue-600">{pointsToHighProbability} points away</strong> from a high-probability profile.
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => window.location.href = "/points-calculator"}
            >
              <Target className="h-4 w-4" />
              Recalculate
            </Button>
            <Button 
              onClick={handleBookClick}
              className="gap-2"
            >
              <Phone className="h-4 w-4" />
              Get Help
            </Button>
          </div>
        </CardContent>
      </Card>

      <PreSessionQuestionnaire
        open={showQuestionnaire}
        onOpenChange={setShowQuestionnaire}
        onComplete={handleQuestionnaireComplete}
      />
      <BookingConfirmation
        open={showBookingConfirmation}
        onOpenChange={setShowBookingConfirmation}
        sessionType={getSessionType()}
      />
    </motion.div>
  );
}
