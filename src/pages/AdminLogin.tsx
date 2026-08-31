import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { setSuppressAuthRedirect } from "@/lib/apiClient";

/**
 * The only sign-in surface left in the app.
 *
 * Public visitors no longer have accounts — the site is lead-gen, and every
 * user-facing journey ends at the consultation funnel rather than a login.
 * Staff still need a way in, so this page exists solely to get an admin as far
 * as /admin. It deliberately offers no registration and no password reset: an
 * admin account is provisioned on the backend, not self-served here.
 *
 * A successful sign-in that is *not* an admin is treated as a failure and the
 * token is dropped. Leaving it in place would give a non-admin a session that
 * nothing in the app can use, and the next 401 would bounce them back here
 * with no explanation.
 */
export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // The global 401 interceptor would redirect us mid-sign-in. We report the
    // failure ourselves instead, and always hand control back in `finally`.
    setSuppressAuthRedirect(true);
    try {
      const data = await authService.login({ email, password });

      const userData = (data?.user ?? data) as Record<string, unknown> | undefined;
      let isAdmin = isAdminClaim(userData);

      if (!isAdmin) {
        const profile = await authService.me();
        isAdmin = !!profile?.isAdmin;
      }

      if (!isAdmin) {
        authService.logout();
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "This account does not have admin access.",
        });
        return;
      }

      toast({ title: "Signed in", description: "Opening the admin suite..." });
      navigate("/admin", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: message,
      });
    } finally {
      setSuppressAuthRedirect(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-navy flex flex-col">
      <header className="p-6">
        <Link to="/" className="flex items-center gap-3 group w-fit">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 transition-all group-hover:bg-white/15">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Migration<span className="text-accent">Path</span>
          </span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 rounded-2xl blur-xl opacity-50" />

            <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-xl gradient-gold mx-auto mb-4 flex items-center justify-center shadow-lg shadow-accent/30">
                  <Shield className="w-7 h-7 text-navy" />
                </div>
                <h1 className="text-2xl font-bold text-white">Admin Sign In</h1>
                <p className="text-white/60 mt-2">
                  Staff access to the MigrationPath admin suite.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80 text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="username"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80 text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="btn-gold w-full h-12 text-base shadow-lg shadow-accent/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/40">
            Admin accounts are provisioned by the MigrationPath team.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * The backend has spelled the admin claim four different ways across its
 * history and still does not agree with itself between the sign-in response
 * and /auth/me, so every shape is checked. Mirrored in `useAdminAuth`.
 */
function isAdminClaim(user: Record<string, unknown> | undefined): boolean {
  if (!user) return false;
  const roles = user.roles;
  return !!(
    user.isAdmin ||
    user.is_admin ||
    user.role === "admin" ||
    (Array.isArray(roles) && roles.includes("admin"))
  );
}
