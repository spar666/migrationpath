import { Link } from "react-router-dom";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Heart, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  FileText,
  Users,
  Home,
  Wallet,
  Calendar
} from "lucide-react";

const pathwaySteps = [
  {
    step: 1,
    title: "Relationship Evidence",
    description: "Gather comprehensive evidence across financial, household, social, and commitment pillars.",
    duration: "Ongoing",
  },
  {
    step: 2,
    title: "Application Lodged",
    description: "Submit your partner visa application with all supporting documents.",
    duration: "1-2 months",
  },
  {
    step: 3,
    title: "Stage 1 Grant (Temp)",
    description: "Receive your temporary partner visa (820/309) allowing you to live and work in Australia.",
    duration: "12-24 months",
  },
  {
    step: 4,
    title: "Stage 2 Grant (PR)",
    description: "After 2 years, receive permanent residency (801/100).",
    duration: "2 years after Stage 1",
  },
];

const evidencePillars = [
  { icon: Wallet, label: "Financial", description: "Joint accounts, shared expenses, combined assets" },
  { icon: Home, label: "Household", description: "Shared living arrangements, joint lease, utilities" },
  { icon: Users, label: "Social", description: "Recognition by family, friends, community" },
  { icon: Calendar, label: "Commitment", description: "Future plans, long-term goals, duration of relationship" },
];

const keyBenefits = [
  "Live and work in Australia with your partner",
  "No points test required",
  "Access to Medicare from Stage 1",
  "Clear pathway to permanent residency",
  "Include dependent children in your application",
];

export default function PartnerPathway() {
  return (
    <div className="min-h-screen flex flex-col bg-cloud pb-20 md:pb-0">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative gradient-navy text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-navy-dark" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-destructive/10 via-transparent to-transparent" />
          
          <div className="container relative px-4 md:px-6 py-16 md:py-24">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-luxury text-white/70">
                  Partner & Family Pathway
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Join Your Partner<br />
                <span className="text-accent">in Australia</span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
                The partner visa pathway allows you to live, work, and build a life with your Australian 
                citizen or permanent resident partner. No points test required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth?intent=signup&persona=partner">
                  <Button className="btn-gold h-auto min-h-12 whitespace-normal px-6 sm:px-8 text-base">
                    Secure Your Pathway & Open Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/quote">
                  <Button variant="outline" className="h-12 px-8 border-white/30 text-white bg-white/5 hover:bg-white/10">
                    <FileText className="w-4 h-4 mr-2" />
                    Get Fee Estimate
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Evidence Pillars Card */}
        <section className="container px-4 md:px-6 -mt-8 relative z-10">
          <Card className="border-destructive/20 shadow-lg max-w-4xl mx-auto">
            <CardContent className="p-6 md:p-8">
              <p className="text-sm font-semibold text-muted-foreground mb-4">
                Four Pillars of Relationship Evidence
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {evidencePillars.map((pillar) => (
                  <div key={pillar.label} className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-2 flex items-center justify-center">
                      <pillar.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-sm">{pillar.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{pillar.description}</p>
                  </div>
                ))}
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
              From Application to PR
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The partner visa pathway typically takes 2-4 years from lodgement to permanent residency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {pathwaySteps.map((step, index) => (
              <Card key={step.step} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center text-destructive text-sm font-bold">
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
                  Key Benefits of Partner Visas
                </h2>
                
                <ul className="space-y-4">
                  {keyBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
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
                  Track your evidence collection, monitor visa processing times, and receive updates on your application status.
                </p>
                
                <Link to="/auth?intent=signup&persona=partner">
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
