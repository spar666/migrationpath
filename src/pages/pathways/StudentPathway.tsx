import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GraduationCap,
  TrendingUp,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Calculator,
  FileText,
  Target
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { POINTS_THRESHOLDS } from "@/constants/config";

const pathwaySteps = [
  {
    step: 1,
    title: "Complete Your Studies",
    description: "Graduate from a CRICOS-registered course that meets the PR pathway requirements.",
    duration: "2-4 years",
  },
  {
    step: 2,
    title: "Graduate Visa (485)",
    description: "Obtain post-study work rights to gain Australian experience.",
    duration: "2-4 years",
  },
  {
    step: 3,
    title: "Skills Assessment",
    description: "Get your qualifications assessed by the relevant assessing authority.",
    duration: "2-4 months",
  },
  {
    step: 4,
    title: "PR Invitation",
    description: "Apply for permanent residency through 189, 190, or 491 visa pathways.",
    duration: "6-18 months",
  },
];

const keyBenefits = [
  "Study in a world-class education system",
  "Gain valuable Australian work experience",
  "Access to post-study work rights (485 visa)",
  "Pathway to permanent residency",
  "High-quality lifestyle and opportunities",
];

export default function StudentPathway() {
  const [invitationRange, setInvitationRange] = useState({ min: 65, max: 85 });

  useEffect(() => {
    const fetchRange = async () => {
      try {
        const data = await apiClient.get<any[]>('/points/eligibility-ranges');
        if (data && data.length > 0) {
          // Students usually target 190 or 491
          const studentVisa = data.find(v => v.visaType === '190' || v.visa_type === '190') || data[0];
          const min = studentVisa.minimumPoints || studentVisa.minimum_points || 65;
          const avg = studentVisa.averagePoints || studentVisa.average_points || 85;
          setInvitationRange({ min, max: Math.max(min + 15, avg) });
        }
      } catch (err) {
        // Fallback
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
                  <GraduationCap className="w-6 h-6 text-navy" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-luxury text-accent">
                  Study & PR Pathway
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Your Journey from<br />
                <span className="text-accent">Student to PR</span>
              </h1>

              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
                Australia's study pathway offers one of the most transparent routes to permanent residency.
                Start with quality education and transition to a life in Australia.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth?intent=signup&persona=student">
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
                    <p className="text-sm text-muted-foreground">Typical Student Points Range</p>
                    <p className="text-3xl font-bold text-foreground">{invitationRange.min} – {invitationRange.max} <span className="text-lg font-normal text-muted-foreground">points</span></p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/points-calculator">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Calculator className="w-4 h-4 mr-2" />
                      Get Your Exact Score
                    </Button>
                  </Link>
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
              From Enrollment to PR
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The student pathway to Australian PR typically takes 4-8 years, depending on your course and circumstances.
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
                  Key Benefits of the Student Pathway
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
                  Track your PR progress, get personalized recommendations, and receive alerts on critical deadlines.
                </p>

                <Link to="/auth?intent=signup&persona=student">
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
