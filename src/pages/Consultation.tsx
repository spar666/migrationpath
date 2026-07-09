import { useState, useEffect } from "react";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { PreSessionQuestionnaire, BookingConfirmation } from "@/components/consultation";
import { Button } from "@/components/ui/button";
import { Phone, Calendar, ArrowRight } from "lucide-react";

export default function Consultation() {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [sessionType, setSessionType] = useState<"priority" | "pathway" | "optimizer">("pathway");
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    setShowQuestionnaire(true);
  }, []);

  const handleComplete = () => {
    setShowQuestionnaire(false);
    setShowConfirmation(true);
  };

  const isComplete = !showQuestionnaire && !showConfirmation;

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        <section className="relative bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary mb-6">
              <Calendar className="h-4 w-4" />
              Book a Consultation
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Speak with a Migration Expert
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get personalised advice on your visa pathway, points profile, and documentation from a MARA-registered agent.
            </p>
          </div>
        </section>

        <section className="py-12 -mt-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
            <div className="rounded-lg border border-border bg-card p-8 shadow-sm text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Phone className="h-7 w-7 text-primary" />
                </div>
              </div>
              {isComplete ? (
                <>
                  <h2 className="text-xl font-semibold text-foreground mb-2">You're All Set!</h2>
                  <p className="text-muted-foreground mb-6">
                    Your consultation has been booked. We'll be in touch shortly to confirm your session.
                  </p>
                  <Button onClick={() => setShowQuestionnaire(true)} variant="outline">
                    Book Another Consultation
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Ready to Get Started?</h2>
                  <p className="text-muted-foreground mb-6">
                    Complete a quick pre-session questionnaire so we can tailor your consultation.
                  </p>
                  <Button onClick={() => setShowQuestionnaire(true)} size="lg" className="gap-2">
                    Start Questionnaire
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <PreSessionQuestionnaire
        open={showQuestionnaire}
        onOpenChange={setShowQuestionnaire}
        onComplete={handleComplete}
      />
      <BookingConfirmation
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        sessionType={sessionType}
      />

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
