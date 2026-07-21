import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Calculator,
  FileText,
  Target,
  Award
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { POINTS_THRESHOLDS } from "@/constants/config";

const pathwaySteps = [
  {
    step: 1,
    title: "Skills Assessment",
    description: "Get your qualifications verified by the relevant Australian assessing authority.",
    duration: "2-4 months",
  },
  {
    step: 2,
    title: "EOI Submission",
    description: "Submit an Expression of Interest with your points score via SkillSelect.",
    duration: "1-2 weeks",
  },
  {
    step: 3,
    title: "Invitation",
    description: "Receive an invitation to apply based on your points and occupation demand.",
    duration: "1-12 months",
  },
  {
    step: 4,
    title: "Visa Grant",
    description: "Complete your application and receive permanent residency.",
    duration: "6-12 months",
  },
];

const keyBenefits = [
  "Direct pathway to permanent residency",
  "No employer sponsorship required (189)",
  "State nomination options (190, 491)",
  "Bring your family to Australia",
  "Work and live anywhere in Australia",
];

export default function SkilledPathway() {
  const [invitationRange, setInvitationRange] = useState({ min: 85, max: 95 });

  useEffect(() => {
    const fetchRange = async () => {
      try {
        const data = await apiClient.get<any[]>('/points/eligibility-ranges');
        if (data && data.length > 0) {
          // Find 189 or 190
          const primaryVisa = data.find(v => v.visaType === '189' || v.visa_type === '189') || data[0];
          const min = primaryVisa.minimumPoints || primaryVisa.minimum_points || 85;
          const avg = primaryVisa.averagePoints || primaryVisa.average_points || 95;
          setInvitationRange({ min, max: Math.max(min + 10, avg) });
        }
      } catch (err) {
        // Fallback to defaults
      }
    };
    fetchRange();
  }, []);

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
                  <Briefcase className="w-6 h-6 text-navy" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-luxury text-accent">
                  Skilled Migration Pathway
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Skilled Professional<br />
                <span className="text-accent">Direct PR Route</span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
                Already qualified in a skilled occupation? The 189/190/491 pathways offer direct routes 
                to Australian permanent residency based on your skills and experience.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth?intent=signup&persona=skilled">
                  <Button className="btn-gold h-auto min-h-12 whitespace-normal px-6 sm:px-8 text-base">
                    Secure Your Pathway & Open Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
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
                    <p className="text-sm text-muted-foreground">Typical Invitation Range (Real-time)</p>
                    <p className="text-3xl font-bold text-foreground">{invitationRange.min} – {invitationRange.max} <span className="text-lg font-normal text-muted-foreground">points</span></p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Higher points = faster invitation</span>
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
              From Assessment to PR
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The skilled migration pathway can take 12-24 months depending on your occupation and points score.
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
                  Key Benefits of Skilled Migration
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
                    <p className="text-sm text-white/70">Ready to Start?</p>
                    <p className="font-semibold">Create Your Free Account</p>
                  </div>
                </div>
                
                <p className="text-white/80 mb-6">
                  Track your EOI status, monitor state nominations, and receive alerts when invitations are issued.
                </p>
                
                <Link to="/auth?intent=signup&persona=skilled">
                  <Button className="btn-gold w-full h-auto min-h-12 whitespace-normal text-base">
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
    </div>
  );
}
