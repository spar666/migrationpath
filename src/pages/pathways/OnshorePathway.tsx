import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Calculator,
  FileText,
  Target,
  TrendingUp
} from "lucide-react";
import { QuickAuditModal } from "@/components/onshore";

const pathwaySteps = [
  {
    step: 1,
    title: "Skills Assessment",
    description: "Validate your qualifications with the relevant Australian assessing authority.",
    duration: "2-4 months",
  },
  {
    step: 2,
    title: "Build Experience",
    description: "Accumulate Australian work experience to maximize your points score.",
    duration: "1-3 years",
  },
  {
    step: 3,
    title: "186 ENS / 190 / 189",
    description: "Apply for permanent residency through employer sponsorship or independent pathways.",
    duration: "6-12 months",
  },
  {
    step: 4,
    title: "Visa Grant",
    description: "Receive your permanent residency and settle in Australia long-term.",
    duration: "3-6 months",
  },
];

const keyBenefits = [
  "Already in Australia with work rights",
  "Australian experience earns bonus points",
  "Access to employer-sponsored PR pathways",
  "State nomination opportunities (190)",
  "Faster processing for onshore applicants",
];

export default function OnshorePathway() {
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleAuditComplete = (data: { visa: string; occupation: string; experience: string }) => {
    sessionStorage.setItem("onshoreAuditData", JSON.stringify({ ...data, timestamp: Date.now() }));
    navigate("/dashboard?pathway=onshore-skilled");
  };

  return (
    <div className="min-h-screen flex flex-col bg-cloud pb-20 md:pb-0">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative gradient-navy text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-navy-dark" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
          
          <div className="container relative px-4 md:px-6 py-16 md:py-24">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-navy" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-luxury text-accent">
                  Onshore Professional Pathway
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Already in Australia?<br />
                <span className="text-accent">Maximize Your PR Chances</span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
                On a 482, 485, or SID visa? You're in a prime position. Build Australian experience, 
                boost your points, and transition to permanent residency.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="btn-gold h-12 px-8 text-base"
                  onClick={() => setAuditModalOpen(true)}
                >
                  Quick Strategy Audit
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Link to="/points-calculator">
                  <Button variant="outline" className="h-12 px-8 border-white/30 text-white bg-white/5 hover:bg-white/10">
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Your Points
                  </Button>
              </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Estimated Points Card */}
        <section className="container px-4 md:px-6 -mt-8 relative z-10">
          <Card className="border-accent/30 shadow-lg max-w-4xl mx-auto">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl gradient-gold flex items-center justify-center">
                    <Target className="w-7 h-7 text-navy" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Onshore Advantage Points</p>
                    <p className="text-3xl font-bold text-foreground">+5 to +15 <span className="text-lg font-normal text-muted-foreground">bonus points</span></p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">From Australian work experience</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pathway Overview */}
        <section className="container px-4 md:px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-luxury text-glacier-dark mb-3">
              Pathway Overview
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              From Temporary to Permanent
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The onshore pathway can be completed in 2-4 years, depending on your current visa and experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {pathwaySteps.map((step, index) => (
              <Card key={step.step} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full gradient-navy flex items-center justify-center text-white text-sm font-bold">
                      {step.step}
                    </div>
                    {index < pathwaySteps.length - 1 && (
                      <div className="hidden lg:block absolute top-12 -right-3 w-6 h-0.5 bg-border z-10" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-glacier-dark">
                    <Clock className="w-3.5 h-3.5" />
                    {step.duration}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits & CTA */}
        <section className="bg-muted/50 border-y border-border">
          <div className="container px-4 md:px-6 py-16 md:py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <p className="text-xs font-semibold uppercase tracking-luxury text-glacier-dark mb-3">
                  Why Choose This Path
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Key Benefits for Onshore Professionals
                </h2>
                
                <ul className="space-y-4">
                  {keyBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Card className="gradient-navy text-white p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Ready to Maximize?</p>
                    <p className="font-semibold">Create Your Free Account</p>
                  </div>
                </div>
                
                <p className="text-white/80 mb-6">
                  Track your experience milestones, monitor state invitations for your occupation, and optimize your PR strategy.
                </p>
                
                <Link to="/auth?intent=signup&persona=onshore-skilled">
                  <Button className="btn-gold w-full h-12 text-base">
                    Secure Your Pathway & Open Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                
                <p className="text-xs text-white/50 mt-4 text-center">
                  Free forever. No credit card required.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Quick Audit Modal */}
      <QuickAuditModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        onComplete={handleAuditComplete}
      />
    </div>
  );
}
