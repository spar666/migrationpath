import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { OccupationSearchTool } from "@/components/search/OccupationSearchTool";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { usePlatformStats } from "@/hooks/usePlatformStats";

export default function OccupationSearch() {
  const [searchParams] = useSearchParams();
  // Same hook as the home page, so the two cannot disagree — they used to,
  // each with its own hardcoded fallback.
  const stats = usePlatformStats();

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

            {/* Quick Stats — the real count, or nothing at all. */}
            {stats && (
              <div className="mt-12 flex flex-wrap items-center justify-center gap-10 text-sm text-muted-foreground">
                <div className="text-center">
                  <span className="block text-3xl font-bold text-foreground">
                    {stats.occupations.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
                    Occupations assessed
                  </span>
                </div>
              </div>
            )}
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
