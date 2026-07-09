import { Link } from "react-router-dom";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  FileText,
  Target,
  Shield,
  Calendar
} from "lucide-react";

const pathwaySteps = [
  {
    step: 1,
    title: "Employer Nomination",
    description: "Your employer submits a nomination for your position with the Department.",
    duration: "2-4 months",
  },
  {
    step: 2,
    title: "482 / SID Visa",
    description: "Receive your temporary skilled visa to work for your sponsoring employer.",
    duration: "3-6 months",
  },
  {
    step: 3,
    title: "Work Period",
    description: "Complete the required period of employment (typically 2-3 years).",
    duration: "2-3 years",
  },
  {
    step: 4,
    title: "186 ENS Grant",
    description: "Transition to permanent residency through the Employer Nomination Scheme.",
    duration: "6-12 months",
  },
];

const keyBenefits = [
  "Employer sponsors your visa costs",
  "Guaranteed employment in Australia",
  "Clear 2-3 year path to PR",
  "No points test required",
  "180-day mobility window (2026 SID rules)",
];

export default function EmployerPathway() {
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
                  <Building2 className="w-6 h-6 text-navy" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-luxury text-accent">
                  Employer Sponsored Pathway
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Sponsored by an<br />
                <span className="text-accent">Australian Employer</span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
                The employer-sponsored pathway (482/SID to 186) offers a structured route to PR 
                with guaranteed employment and no points test requirement.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth?intent=signup&persona=employer">
                  <Button className="btn-gold h-12 px-8 text-base">
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

        {/* Key Metrics Card */}
        <section className="container px-4 md:px-6 -mt-8 relative z-10">
          <Card className="border-accent/30 shadow-lg max-w-4xl mx-auto">
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-2 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">2 Years</p>
                  <p className="text-xs text-muted-foreground">To 186 PR Eligibility</p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-2 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">180 Days</p>
                  <p className="text-xs text-muted-foreground">Mobility Window (2026)</p>
                </div>
                <div>
                  <div className="w-12 h-12 rounded-xl bg-muted mx-auto mb-2 flex items-center justify-center">
                    <Target className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">No Points</p>
                  <p className="text-xs text-muted-foreground">Test Required</p>
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
              From Nomination to PR
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The employer-sponsored pathway typically takes 3-4 years from nomination to permanent residency.
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
                  Key Benefits of Employer Sponsorship
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
                    <p className="text-sm text-white/70">Ready to Track?</p>
                    <p className="font-semibold">Create Your Free Account</p>
                  </div>
                </div>
                
                <p className="text-white/80 mb-6">
                  Monitor your nomination status, track your 186 eligibility countdown, and manage your mobility window.
                </p>
                
                <Link to="/auth?intent=signup&persona=employer">
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
    </div>
  );
}
