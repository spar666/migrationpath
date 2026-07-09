import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { setSuppressAuthRedirect } from "@/lib/apiClient";
import { authService } from "@/services/authService";
import { PRPointsGauge } from "@/components/dashboard/PRPointsGauge";
import { userProgressService } from "@/services/userProgressService";
import type { UserProgress, ProgressStep } from "@/types";
import { MigrationProgressBar } from "@/components/dashboard/MigrationProgressBar";
import { PathwaySwitcher } from "@/components/dashboard/PathwaySwitcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, ShieldCheck, Bookmark, X, AlertTriangle, ChevronRight, ArrowUpRight } from "lucide-react";

type PersonaType = "skilled" | "onshore-skilled" | "student" | "partner" | "employer";

interface Profile {
  id: string;
  full_name: string | null;
  persona_type: string | null;
  points_score: number | null;
  is_admin: boolean | null;
  anzsco_code: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [allProgressRecords, setAllProgressRecords] = useState<UserProgress[]>([]);

  const stepOrder: ProgressStep[] = ['search', 'view_details', 'points_calculator', 'visa_recommendation', 'completed'];
  const computedCurrentStep = userProgress
    ? Math.max(1, stepOrder.indexOf(userProgress.current_step) + 1)
    : 1;

  const urlPersona = searchParams.get("pathway") as PersonaType | null;
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>("student");

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      try {
        setSuppressAuthRedirect(true);
        setIsLoading(true);
        if (!authService.isAuthenticated()) {
          navigate("/auth?intent=login");
          return;
        }

        const user = await authService.me();
        if (user) {
          setProfile({
            id: user.id,
            full_name: user.fullName || (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : null),
            persona_type: user.personaType || "student",
            points_score: (user as any).pointsScore || (user as any).points_score || 75,
            is_admin: user.isAdmin || false,
            anzsco_code: (user as any).anzscoCode || (user as any).anzsco_code || null,
          });
        } else {
          setProfileError("Could not load user profile.");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfileError("An error occurred while loading your profile.");
      } finally {
        setSuppressAuthRedirect(false);
        setIsLoading(false);
      }
    };

    const fetchProgress = async () => {
      try {
        const records = await userProgressService.getMyProgress();
        if (records && records.length > 0) {
          setUserProgress(records[0]);
          setAllProgressRecords(records);
        } else {
          setAllProgressRecords([]);
        }
      } catch (error) {
        console.error("Error fetching user progress:", error);
        setAllProgressRecords([]);
      }
    };

    checkAuthAndFetchProfile();
    fetchProgress();
  }, [navigate, urlPersona]);

  useEffect(() => {
    if (urlPersona && ["student", "skilled", "onshore-skilled", "partner", "employer"].includes(urlPersona)) {
      setSelectedPersona(urlPersona);
    }
  }, [urlPersona]);

  const handlePersonaChange = (newPersona: PersonaType) => {
    setSelectedPersona(newPersona);
    if (profile) {
      setProfile({ ...profile, persona_type: newPersona });
    }
  };

  const userPoints = userProgress?.calculated_points ?? profile?.points_score ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-cloud">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading your strategy...</p>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-cloud">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full shadow-soft-lg border-border/60">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-6 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground mb-6">{profileError || "We couldn't load your profile."}</p>
              <Button onClick={() => window.location.reload()} className="w-full">Retry</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cloud pb-20 md:pb-0">
      <Header />

      <main className="flex-1">
        {/* Hero Header */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-navy/5 to-transparent">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(198,161,91,0.06)_0%,transparent_60%)]" />
          <div className="container relative px-4 md:px-6 py-8 md:py-12">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent/70">Strategy Center</p>
                <h1 className="text-3xl md:text-4xl font-bold text-navy tracking-tight">
                  {profile.full_name ? (
                    <>Welcome back, <span className="text-accent">{profile.full_name.split(" ")[0]}</span></>
                  ) : "Your Migration Strategy"}
                </h1>
              </div>
              <PathwaySwitcher currentPersona={selectedPersona} userId={profile.id} onPersonaChange={handlePersonaChange} />
            </div>

            <div className="mt-6 bg-white/70 backdrop-blur-sm rounded-xl p-5 border border-border/50 shadow-soft-sm">
              <MigrationProgressBar persona={selectedPersona} currentStep={computedCurrentStep} />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container px-4 md:px-6 py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8 lg:space-y-10">
              {/* Saved Pathways */}
              {allProgressRecords.length > 0 ? (
                <Card className="overflow-hidden border-border/60 shadow-soft-md">
                  <CardHeader className="border-b border-border/40 bg-gradient-to-r from-muted/40 to-transparent">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center shadow-soft-xs">
                        <Bookmark className="w-4 h-4 text-navy" />
                      </div>
                      <span>Saved Pathways</span>
                      <Badge variant="secondary" className="ml-1 text-xs font-medium">{allProgressRecords.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border/30 p-0">
                    {allProgressRecords.map((record) => (
                      <div
                        key={record.id}
                        className="group flex items-center justify-between px-6 py-4 cursor-pointer transition-all duration-200 hover:bg-accent/[0.03] hover:pl-7"
                        onClick={() => navigate("/consultation")}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                              {record.title || "Untitled Pathway"}
                            </p>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/0 -ml-1 group-hover:text-muted-foreground/40 group-hover:ml-0 transition-all" />
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground/70">
                              Step: {record.current_step?.replace(/_/g, ' ') || 'draft'}
                            </span>
                            {record.calculated_points != null && (
                              <span className="text-xs font-semibold text-glacier-dark bg-glacier/10 px-2 py-0.5 rounded-full">{record.calculated_points} pts</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          {record.anzsco_code && (
                            <Badge variant="outline" className="text-xs font-muted border-border/50 text-muted-foreground/70">{record.anzsco_code}</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground/40 hover:text-destructive h-8 w-8 p-0 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await userProgressService.deleteProgress(record.id);
                                setAllProgressRecords((prev) => prev.filter((r) => r.id !== record.id));
                                if (userProgress?.id === record.id) setUserProgress(null);
                              } catch (e) {
                                console.error("Delete failed:", e);
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden border-border/60 shadow-soft-md">
                  <CardContent className="py-14 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 mx-auto mb-5 flex items-center justify-center">
                      <Bookmark className="w-6 h-6 text-accent/60" />
                    </div>
                    <p className="text-base font-semibold text-foreground mb-1">No saved pathways yet</p>
                    <p className="text-sm text-muted-foreground/70 max-w-xs mx-auto">
                      Save a course from the search results and it will appear here for quick access.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-6 gap-2 border-accent/30 text-accent hover:bg-accent/5 hover:text-accent"
                      onClick={() => navigate("/occupation-search")}
                    >
                      Browse courses <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* PR Points */}
              {selectedPersona !== "partner" && selectedPersona !== "employer" && (
                <Card className="overflow-hidden border-border/60 shadow-soft-md">
                  <CardHeader className="border-b border-border/40 bg-gradient-to-r from-muted/40 to-transparent">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center shadow-soft-xs">
                        <Target className="w-4 h-4 text-navy" />
                      </div>
                      <span>PR Points</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <PRPointsGauge currentPoints={userPoints} maxPoints={100} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="sticky top-24 space-y-6">
                <Card className="overflow-hidden border-border/60 shadow-soft-md">
                  <div className="h-1.5 bg-gradient-to-r from-accent/40 via-accent/20 to-transparent" />
                  <CardContent className="pt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 mb-5">Quick Stats</p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-border/20">
                        <span className="text-sm text-muted-foreground">Points Score</span>
                        <span className="text-lg font-bold text-navy tabular-nums">{userPoints}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/20">
                        <span className="text-sm text-muted-foreground">Pathway</span>
                        <Badge variant="secondary" className="text-xs font-medium capitalize">{selectedPersona.replace("-", " ")}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/20">
                        <span className="text-sm text-muted-foreground">Saved Items</span>
                        <span className="text-sm font-semibold text-foreground">{allProgressRecords.length}</span>
                      </div>
                      {profile.anzsco_code && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground">ANZSCO</span>
                          <Badge variant="outline" className="text-xs font-mono">{profile.anzsco_code}</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* MARA Badge */}
        <div className="container px-4 md:px-6 pb-10">
          <div className="group flex items-center justify-center gap-4 py-5 px-6 rounded-xl bg-gradient-to-r from-navy/[0.02] via-accent/[0.02] to-navy/[0.02] border border-border/50 hover:border-accent/20 transition-colors">
            <div className="w-10 h-10 rounded-full gradient-navy flex items-center justify-center shadow-soft-xs">
              <ShieldCheck className="w-5 h-5 text-accent" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-sm font-semibold text-foreground">Verified by MARA</p>
              <p className="text-xs text-muted-foreground/70">All migration advice provided by registered agents under the Office of the OMARA</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
