import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bookmark, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { userProgressService } from "@/services/userProgressService";

interface CourseData {
  courseName: string;
  university: string;
  anzscoCode: string;
  occupation: string;
  duration?: string;
  qualification: string;
  isRegional?: boolean;
}

interface SaveProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseData | null;
}

export function SaveProgressModal({
  isOpen,
  onClose,
  course,
}: SaveProgressModalProps) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};

    if (!isLogin) {
      if (!name.trim()) {
        newErrors.name = "Name is required";
      } else if (name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        await authService.login({ email, password });
      } else {
        const nameParts = name.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        await authService.register({
          email,
          password,
          firstName,
          lastName,
          personaType: "student",
        });
      }

      // Save course to the user's progress via backend API
      if (course) {
        try {
          await userProgressService.createProgress({
            title: `${course.occupation} — ${course.courseName}`,
            current_step: 'view_details',
            anzsco_code: course.anzscoCode,
            data: {
              courseName: course.courseName,
              university: course.university,
              duration: course.duration,
              qualification: course.qualification,
              isRegional: course.isRegional,
              occupation: course.occupation,
            },
          });
        } catch (err) {
          console.error("Failed to save course after auth:", err);
        }
      }

      setIsLoading(false);
      onClose();

      // Teleport to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setIsLoading(false);
      setErrors({ form: err?.message || "Authentication failed. Please try again." });
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-navy/70 backdrop-blur-sm"
          />

          {/* Centering wrapper — flex keeps modal perfectly centered */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md pointer-events-auto"
            >
              <div className="rounded-2xl bg-card shadow-2xl border border-border overflow-hidden">
                {/* Header */}
                <div className="relative gradient-navy p-6 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute right-4 top-4 text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/20 mb-4">
                    <Bookmark className="w-7 h-7 text-accent" />
                  </div>

                  <h2 className="text-xl font-bold text-white">
                    {isLogin ? "Welcome Back" : "Save Your Progress"}
                  </h2>
                  <p className="text-sm text-white/70 mt-2">
                    {isLogin ? "Log in to view your saved migration pathways" : "Create your free account to track your migration journey"}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {errors.form && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
                      <p className="text-sm text-red-600 font-medium">{errors.form}</p>
                    </div>
                  )}

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="save-name" className="text-foreground">
                        Full Name
                      </Label>
                      <Input
                        id="save-name"
                        type="text"
                        placeholder="John Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive">{errors.name}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="save-email" className="text-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="save-email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="save-password" className="text-foreground">
                      Password
                    </Label>
                    <Input
                      id="save-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={errors.password ? "border-destructive" : ""}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 gradient-gold text-navy font-semibold hover:shadow-gold-glow transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isLogin ? "Logging in..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        {isLogin ? "Login to Dashboard" : "Continue to Dashboard"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground mt-4">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setErrors({});
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      {isLogin ? "Sign up" : "Log in"}
                    </button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground mt-2">
                    By continuing, you agree to our{" "}
                    <a href="#" className="text-primary hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
