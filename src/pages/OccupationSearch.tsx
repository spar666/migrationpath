import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { OccupationSearchTool } from "@/components/search/OccupationSearchTool";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { statsService } from "@/services/statsService";

export default function OccupationSearch() {
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState({
    courses: "500+",
    occupations: "200+",
    universities: "50+",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const data = await statsService.getStats();
        if (isMounted) {
          setStats({
            courses: `${data.courses}+`,
            occupations: `${data.occupations}+`,
            universities: `${data.universities}+`,
          });
        }
      } catch {
        // keep fallback
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-4 gap-1.5">
                <Search className="h-3 w-3" />
                ANZSCO Occupation Search
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Find Your Eligible Visa Pathways
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Search by occupation title or ANZSCO code to instantly see which skilled visas you qualify for
              </p>
            </div>

            {/* Search Tool */}
            <OccupationSearchTool initialQuery={searchParams.get("q") ?? ""} />

            {/* Quick Stats */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-10 text-sm text-muted-foreground">
              {[
                { value: stats.courses, label: "Courses" },
                { value: stats.occupations, label: "Occupations" },
                { value: stats.universities, label: "Universities" },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-3">
                  {i > 0 && <div className="hidden h-10 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent sm:block -ml-5 mr-5" />}
                  <div className="text-center">
                    <span className="block text-3xl font-bold text-foreground">{stat.value}</span>
                    <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                  <span className="text-emerald-600 font-bold">189</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Skilled Independent</h3>
                <p className="text-sm text-muted-foreground">
                  Requires MLTSSL listing. No nomination required. Points-tested pathway to permanent residency.
                </p>
              </div>
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <span className="text-blue-600 font-bold">190</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">State Nominated</h3>
                <p className="text-sm text-muted-foreground">
                  Requires MLTSSL or STSOL. State/territory nomination adds 5 points to your application.
                </p>
              </div>
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                  <span className="text-amber-600 font-bold">491</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Regional Skilled</h3>
                <p className="text-sm text-muted-foreground">
                  Provisional visa with any list eligibility. +15 points. Path to 191 permanent residency.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
