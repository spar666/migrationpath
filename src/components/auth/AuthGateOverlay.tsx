import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Map,
  TrendingUp,
  Star,
  Users
} from "lucide-react";

interface AuthGateOverlayProps {
  persona?: string;
}

const previewFeatures = [
  { icon: Map, label: "Interactive Roadmap" },
  { icon: TrendingUp, label: "Points Optimizer" },
];

export function AuthGateOverlay({ persona }: AuthGateOverlayProps) {
  const signupUrl = persona 
    ? `/auth?intent=signup&persona=${persona}` 
    : "/auth?intent=signup";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Blurred Dashboard Background Preview */}
      <div className="absolute inset-0 bg-background">
        {/* Simulated Dashboard Structure - Blurred */}
        <div className="absolute inset-0 opacity-40 blur-sm">
          {/* Header Bar */}
          <div className="h-16 w-full gradient-navy" />
          
          {/* Dashboard Grid */}
          <div className="p-6 grid grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="col-span-2 space-y-4">
              {/* Points Gauge Placeholder */}
              <div className="h-48 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-border/30 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-8 border-accent/20 flex items-center justify-center">
                  <span className="text-3xl font-bold text-muted-foreground/50">85</span>
                </div>
              </div>
              
              {/* Timeline Placeholder */}
              <div className="h-24 rounded-xl bg-muted/30 border border-border/30" />
              
              {/* Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 rounded-xl bg-muted/30 border border-border/30" />
                <div className="h-32 rounded-xl bg-muted/30 border border-border/30" />
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-4">
              <div className="h-40 rounded-xl bg-muted/30 border border-border/30" />
              <div className="h-32 rounded-xl bg-muted/30 border border-border/30" />
              <div className="h-48 rounded-xl bg-muted/30 border border-border/30" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/90 to-primary/95 backdrop-blur-md" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
      
      {/* Main Content */}
      <div className="relative max-w-lg mx-4 w-full">
        {/* Glow Effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 rounded-3xl blur-2xl opacity-50" />
        
        <Card className="relative border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Top Decorative Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-accent via-accent/80 to-accent" />
          
          <CardContent className="p-8 md:p-10">
            {/* Premium Lock Icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl gradient-gold opacity-30 blur-xl animate-pulse" />
              <div className="relative w-full h-full rounded-2xl gradient-gold flex items-center justify-center shadow-lg shadow-accent/30">
                <Lock className="w-9 h-9 text-navy" />
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-lg border-2 border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-navy" />
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
                Unlock Your Dashboard
              </h2>
              <p className="text-white/70 leading-relaxed">
                Create a free account to access your personalized Migration Strategy Center.
              </p>
            </div>

            {/* Premium Features Preview */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {previewFeatures.map((feature) => (
                <div 
                  key={feature.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-xs text-white/70 text-center leading-tight">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col gap-3">
              <Link to={signupUrl}>
                <Button className="btn-gold w-full h-12 text-base font-semibold shadow-lg shadow-accent/20">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              
              <Link to="/auth?intent=login">
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
                >
                  Sign In
                </Button>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-glacier to-primary border-2 border-white/20 flex items-center justify-center text-xs font-bold text-white"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-accent fill-accent" />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-white/50">
                <Users className="w-3.5 h-3.5" />
                <span>Join 10,000+ migrants using our 2026 strategy tools</span>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40">
              <ShieldCheck className="w-4 h-4" />
              <span>Free forever. No credit card required.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
