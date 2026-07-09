import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  GraduationCap,
  Briefcase,
  Heart,
  Building2,
  UserCheck,
  User,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Map,
  TrendingUp,
  CheckCircle2,
  Users,
  Star,
  Shield,
  MailCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { authService } from '@/services/authService';
import { setSuppressAuthRedirect } from '@/lib/apiClient';

// Decode JWT payload safely (browser). Returns parsed payload or null.
function decodeJwtPayload(token?: string | null): any | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Convert from base64url to base64
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(b64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// Local type definition for PersonaType
type PersonaType = "skilled" | "onshore-skilled" | "student" | "partner" | "employer";

const personaOptions = [
  { id: "student", label: "Student", description: "Study & transition to PR", icon: GraduationCap },
  { id: "skilled", label: "Skilled Professional", description: "Direct skilled migration", icon: Briefcase },
  { id: "onshore-skilled", label: "Onshore Professional", description: "Already in Australia", icon: UserCheck },
  { id: "partner", label: "Partner & Family", description: "Join your loved ones", icon: Heart },
  { id: "employer", label: "Employer Sponsored", description: "Sponsored by employer", icon: Building2 },
];

const premiumFeatures = [
  {
    icon: Map,
    title: "Interactive Roadmap",
    description: "Visualize your exact 2026 path from current visa to PR.",
  },
  {
    icon: TrendingUp,
    title: "Points Optimizer",
    description: "Get real-time alerts when your PR points increase with new experience.",
  },
];

const personaValueProps: Record<string, string> = {
  "student": "Stop guessing. See which courses lead to the highest invite rates.",
  "skilled": "Track your points score and monitor state priority lists in real-time.",
  "onshore-skilled": "Track your 186-PR countdown and monitor state priority lists.",
  "partner": "Organize evidence pillars and track your relationship timeline.",
  "employer": "Monitor your sponsor's approval status and mobility windows.",
  "default": "Get personalized insights tailored to your migration pathway.",
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const intent = searchParams.get("intent") || "login";
  const preselectedPersona = searchParams.get("persona") as PersonaType | null;
  const returnTo = searchParams.get("returnTo");

  const [isLogin, setIsLogin] = useState(intent === "login");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | "">(
    preselectedPersona || ""
  );
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const redirectAfterAuth = (isAdmin: boolean) => {
      if (returnTo) {
        navigate(returnTo);
        return;
      }
      navigate(isAdmin ? '/admin' : '/dashboard');
    };

    if (!isLogin && !selectedPersona) {
      toast({
        title: "Please select your migration goal",
        description: "This helps us personalize your dashboard experience.",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Use centralized auth service which consumes the API
        const data = await authService.login({ email: formData.email, password: formData.password });

        toast({
          title: "Login successful!",
          description: "Redirecting to your dashboard...",
        });

        // Check admin status from login response first
        const userData = data?.user || (data as any);
        let isAdmin = !!(
          userData?.isAdmin ||
          userData?.is_admin ||
          userData?.role === 'admin' ||
          (Array.isArray(userData?.roles) && userData?.roles.includes('admin'))
        );

        // If not determined from login response, fetch profile from API
        if (!isAdmin) {
          const profile = await authService.me();
          if (profile) {
            isAdmin = !!profile.isAdmin;
          }
        }

        // Last-resort fallback: decode JWT to look for admin claim
        if (!isAdmin) {
          try {
            const token = localStorage.getItem('auth_token');
            const payload = decodeJwtPayload(token);
            if (payload) {
              isAdmin = !!(
                payload.isAdmin || payload.is_admin || payload.role === 'admin' ||
                (Array.isArray(payload.roles) && payload.roles.includes('admin'))
              );
            }
          } catch {
            // ignore JWT decode errors
          }
        }

        console.debug('[Auth] Login redirect — raw data:', data);
        console.debug('[Auth] Login redirect — isAdmin:', isAdmin);

        // Re-enable global 401 interceptor before navigating
        setSuppressAuthRedirect(false);

        redirectAfterAuth(isAdmin);
      } else {
        // Signup
        const nameParts = formData.fullName.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        const data = await authService.register({
          email: formData.email,
          password: formData.password,
          firstName,
          lastName,
          personaType: selectedPersona,
        });

        toast({
          title: "Account created!",
          description: "Redirecting to your dashboard...",
        });

        const userData = data?.user || (data as any);
        let isAdmin = !!(
          userData?.isAdmin ||
          userData?.is_admin ||
          userData?.role === 'admin' ||
          (Array.isArray(userData?.roles) && userData?.roles.includes('admin'))
        );

        if (!isAdmin) {
          const profile = await authService.me();
          if (profile) {
            isAdmin = !!profile.isAdmin;
          }
        }

        if (!isAdmin) {
          try {
            const token = localStorage.getItem('auth_token');
            const payload = decodeJwtPayload(token);
            if (payload) {
              isAdmin = !!(
                payload.isAdmin || payload.is_admin || payload.role === 'admin' ||
                (Array.isArray(payload.roles) && payload.roles.includes('admin'))
              );
            }
          } catch {
            // ignore
          }
        }

        setSuppressAuthRedirect(false);

        redirectAfterAuth(isAdmin);
      }
    } catch (err: any) {
      // Re-enable global 401 interceptor on error too
      setSuppressAuthRedirect(false);
      const errorMessage = err instanceof Error ? err.message : (err?.message || 'An unexpected error occurred');
      console.error("Auth error:", err);
      toast({
        title: "Authentication failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Safety net: always ensure the suppression is cleared
      setSuppressAuthRedirect(false);
    }
  };

  const currentValueProp = personaValueProps[selectedPersona] || personaValueProps.default;

  // Verification Success Modal
  if (showVerificationModal) {
    return (
      <div className="min-h-screen gradient-navy flex items-center justify-center p-6">
        <div className="relative w-full max-w-md">
          {/* Glow Effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-accent/30 via-accent/20 to-accent/30 rounded-3xl blur-2xl opacity-60" />

          <div className="relative rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-10 shadow-2xl text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full gradient-gold mx-auto mb-6 flex items-center justify-center shadow-xl shadow-accent/40">
              <MailCheck className="w-10 h-10 text-navy" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-3">
              Verification Email Sent!
            </h1>

            <p className="text-white/70 mb-6 leading-relaxed">
              We've sent a confirmation link to{" "}
              <span className="font-semibold text-accent">{verificationEmail}</span>
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8">
              <p className="text-white/80 text-sm leading-relaxed">
                Please check your inbox and click the verification link to activate your account before logging in.
              </p>
            </div>

            <Button
              onClick={() => {
                setShowVerificationModal(false);
                setIsLogin(true);
                setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
              }}
              className="btn-gold w-full h-12 text-base shadow-lg shadow-accent/20"
            >
              Return to Login
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-white/40 text-xs mt-6">
              Didn't receive the email? Check your spam folder or try signing up again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Navy Login Form */}
      <div className="w-full lg:w-1/2 gradient-navy flex flex-col min-h-screen lg:min-h-0">
        {/* Header */}
        <header className="p-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 transition-all group-hover:bg-white/15">
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              MigrationPath
            </span>
          </Link>
        </header>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 lg:py-12">
          <div className="w-full max-w-md">
            {/* Glassmorphism Card */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 rounded-2xl blur-xl opacity-50" />

              <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-xl gradient-gold mx-auto mb-4 flex items-center justify-center shadow-lg shadow-accent/30">
                    <Shield className="w-7 h-7 text-navy" />
                  </div>
                  <h1 className="text-2xl font-bold text-white">
                    {isLogin ? "Welcome Back" : "Create Your Account"}
                  </h1>
                  <p className="text-white/60 mt-2">
                    {isLogin
                      ? "Sign in to access your Migration Strategy Dashboard"
                      : "Start tracking your PR journey today"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Persona Selector - Only for Signup */}
                  {!isLogin && (
                    <div className="space-y-3">
                      <Label className="text-white/80 text-sm font-medium">
                        Choose Your Migration Goal
                      </Label>
                      <RadioGroup
                        value={selectedPersona}
                        onValueChange={(value) => setSelectedPersona(value as PersonaType)}
                        className="grid grid-cols-1 gap-2"
                      >
                        {personaOptions.map((option) => (
                          <Label
                            key={option.id}
                            htmlFor={option.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                              selectedPersona === option.id
                                ? "border-accent bg-accent/10 text-white shadow-lg shadow-accent/10"
                                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                            )}
                          >
                            <RadioGroupItem
                              value={option.id}
                              id={option.id}
                              className="border-white/30 text-accent"
                            />
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              selectedPersona === option.id ? "gradient-gold" : "bg-white/10"
                            )}>
                              <option.icon className={cn(
                                "w-4 h-4",
                                selectedPersona === option.id ? "text-navy" : "text-white/60"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{option.label}</p>
                            </div>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {/* Full Name - Only for Signup */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white/80 text-sm font-medium">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Smith"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/20"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/20"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password - Only for Signup */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white/80 text-sm font-medium">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/20"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="btn-gold w-full h-12 text-base shadow-lg shadow-accent/20"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                        {isLogin ? "Signing in..." : "Creating account..."}
                      </span>
                    ) : (
                      <>
                        {isLogin ? "Sign In" : "Create Account"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Toggle Login/Signup */}
                  <div className="text-center pt-2">
                    <p className="text-white/50 text-sm">
                      {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-accent font-medium hover:underline"
                      >
                        {isLogin ? "Sign up" : "Sign in"}
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Security Badge */}
            <div className="mt-6 text-center">
              <p className="text-xs text-white/40">
                Protected by enterprise-grade security. Your data is encrypted and never shared.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Premium Features Showcase */}
      <div className="hidden lg:flex w-1/2 bg-[#F8FAFC] flex-col">
        {/* Decorative Background */}
        <div className="absolute right-0 top-0 w-1/2 h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-40 w-64 h-64 bg-glacier/20 rounded-full blur-3xl" />
        </div>

        <div className="flex-1 flex flex-col justify-center px-12 xl:px-20 py-12 relative z-10">
          {/* Header */}
          <div className="mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent mb-3 block">
              What's Inside
            </span>
            <h2 className="text-3xl xl:text-4xl font-bold text-foreground leading-tight">
              Your Premium Migration Dashboard
            </h2>
            <p className="text-muted-foreground mt-3 text-lg leading-relaxed">
              Everything you need to navigate Australia's 2026 migration system with confidence.
            </p>
          </div>

          {/* Premium Features */}
          <div className="space-y-6">
            {premiumFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-5 rounded-xl bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Persona-Specific Value Prop */}
          <div className="mt-8 p-5 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed font-medium">
                {currentValueProp}
              </p>
            </div>
          </div>

          {/* Trust Bar / Social Proof */}
          <div className="mt-auto pt-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-glacier to-primary border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Users className="w-4 h-4 text-accent" />
              <p className="text-sm">
                Join <span className="font-semibold text-foreground">10,000+</span> migrants using our automated 2026 strategy tools.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Features Preview - Only shown on mobile */}
      <div className="lg:hidden bg-[#F8FAFC] py-10 px-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent mb-3 block">
          What's Inside
        </span>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Your Premium Dashboard
        </h2>

        <div className="space-y-4">
          {premiumFeatures.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 p-4 rounded-xl bg-white border border-border/50"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Trust Bar */}
        <div className="mt-8 pt-6 border-t border-border/50 flex items-center gap-3 text-muted-foreground">
          <Users className="w-4 h-4 text-accent" />
          <p className="text-sm">
            Join <span className="font-semibold text-foreground">10,000+</span> migrants using our tools.
          </p>
        </div>
      </div>
    </div>
  );
}
