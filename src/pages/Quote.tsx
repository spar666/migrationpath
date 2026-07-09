import { useState, useEffect } from "react";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { VisaCard } from "@/components/quote/VisaCard";
import { QuoteSummary } from "@/components/quote/QuoteSummary";
import { ArrowLeft, FileText, Loader2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { pricingService, type ServicePackage, type PackageCategory } from "@/services/pricingService";
import { authService } from "@/services/authService";
import { getPendingQuotePackage, clearPendingQuotePackage } from "@/lib/pendingQuote";
import { toast } from "sonner";

const CONSULTATION_CREDIT = 150;

// Local type definitions
interface VisaOption {
  id: string;
  code: string;
  name: string;
  professionalFee: number;
  governmentFee: number;
  thirdPartyCosts: number;
}

const visaCategoryLabels: Record<PackageCategory, string> = {
  skilled: "Skilled Migration",
  family: "Family Sponsorship",
  student: "Student Visas",
  employer: "Employer Sponsored",
};

const visaCategoryIcons: Record<PackageCategory, string> = {
  skilled: "💼",
  family: "👨‍👩‍👧",
  student: "🎓",
  employer: "🏢",
};

function groupByCategory(packages: ServicePackage[]): Record<string, ServicePackage[]> {
  const grouped: Record<string, ServicePackage[]> = {};
  for (const pkg of packages) {
    if (!grouped[pkg.category]) grouped[pkg.category] = [];
    grouped[pkg.category].push(pkg);
  }
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => a.display_order - b.display_order);
  }
  return grouped;
}

function toVisaOption(pkg: ServicePackage): VisaOption {
  return {
    id: pkg.id,
    code: pkg.visa_subclass,
    name: pkg.package_name,
    professionalFee: Number(pkg.professional_fees),
    governmentFee: Number(pkg.government_charges),
    thirdPartyCosts: Number(pkg.estimated_extras),
  };
}

export default function Quote() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isResumingQuote, setIsResumingQuote] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPackages = async () => {
      try {
        const data = await pricingService.getPackages();
        if (isMounted) {
          setPackages(data.filter((p) => p.is_active));
        }
      } catch (err) {
        console.error("Failed to fetch pricing packages:", err);
        if (isMounted) {
          setError("We couldn't load pricing right now. Please try again shortly.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPackages();
    return () => {
      isMounted = false;
    };
  }, []);

  // Resume an in-progress quote after the visitor picked a package while
  // signed out, was sent to /auth to sign in, and has now landed back here.
  // See StartApplicationFlow.tsx for where this is set. Uses localStorage
  // (via pendingQuote.ts) rather than sessionStorage so it survives the
  // visitor closing the tab in between.
  useEffect(() => {
    const pendingPackageId = getPendingQuotePackage();
    if (!pendingPackageId || !authService.isAuthenticated()) return;

    setIsResumingQuote(true);
    clearPendingQuotePackage();

    pricingService
      .createQuote(pendingPackageId)
      .then(() => {
        toast.success("Welcome back! Your quote has been saved.");
        navigate("/dashboard");
      })
      .catch((err) => {
        console.error("Failed to resume quote after login:", err);
        toast.error("We couldn't automatically save your quote — please select your visa type again below.");
        setSelectedPackageId(pendingPackageId);
      })
      .finally(() => setIsResumingQuote(false));
  }, [navigate]);

  const groupedPackages = groupByCategory(packages);
  const selectedPackage = selectedPackageId
    ? packages.find((p) => p.id === selectedPackageId)
    : null;
  const selectedVisa = selectedPackage ? toVisaOption(selectedPackage) : null;

  return (
    <div className="min-h-screen flex flex-col bg-cloud">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-14 lg:py-18 border-b border-border bg-card">
          <div className="container max-w-6xl">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-glacier-dark hover:text-navy mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-lg gradient-navy flex items-center justify-center shrink-0 shadow-navy-glow">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-luxury text-glacier-dark mb-2">
                  Pricing & Packages
                </p>
                <h1 className="text-3xl lg:text-4xl font-bold text-navy mb-3 tracking-tight">
                  Get Your Visa Quote
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  Transparent pricing with no hidden fees. Select your visa type below to see a
                  complete cost breakdown and flexible payment options.
                </p>
              </div>
            </div>
          </div>
        </section>

        {isResumingQuote && (
          <div className="bg-gold/10 border-b border-gold/20 py-3">
            <div className="container max-w-6xl flex items-center gap-2 text-sm font-medium text-gold-dark">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving the quote you started earlier...
            </div>
          </div>
        )}

        {/* Main Content */}
        <section className="py-14 lg:py-18">
          <div className="container max-w-6xl">
            <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">
              {/* Visa Selection - Left Column */}
              <div className="lg:col-span-3 space-y-10">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-3" />
                    <p className="text-sm">Loading pricing...</p>
                  </div>
                )}

                {!loading && error && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-destructive/20 bg-destructive/5 py-16 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mb-3" />
                    <p className="text-destructive font-medium mb-4">{error}</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                )}

                {!loading && !error && Object.keys(groupedPackages).length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy/10 py-16 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground mb-2">No pricing packages available yet.</p>
                    <p className="text-sm text-muted-foreground/70 mb-4">
                      In the meantime, book a free consultation and we'll put together a custom quote for you.
                    </p>
                    <Button asChild>
                      <Link to="/consultation">Book a Free Consultation</Link>
                    </Button>
                  </div>
                )}

                {!loading && !error &&
                  (Object.keys(groupedPackages) as PackageCategory[]).map((category) => (
                    <div key={category} className="space-y-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{visaCategoryIcons[category] || "📋"}</span>
                        <h2 className="text-xl font-bold text-navy">
                          {visaCategoryLabels[category] || category}
                        </h2>
                      </div>

                      <div className="space-y-4">
                        {groupedPackages[category].map((pkg, index) => (
                          <VisaCard
                            key={pkg.id}
                            code={pkg.visa_subclass}
                            name={pkg.package_name}
                            description={pkg.inclusions?.slice(0, 3).join(" • ") || ""}
                            professionalFee={Number(pkg.professional_fees)}
                            governmentFee={Number(pkg.government_charges)}
                            isSelected={selectedPackageId === pkg.id}
                            onSelect={() => setSelectedPackageId(pkg.id)}
                            popular={index === 0}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                {/* Consultation Credit Banner */}
                {!loading && !error && (
                  <div className="p-6 rounded-lg border border-gold/30 bg-gold/5 shadow-glass">
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center shrink-0">
                        <span className="text-xl">🎁</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-navy mb-2 text-lg">
                          $150 Consultation Credit
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Book an initial strategy consultation for $150. If you proceed with our services,
                          this amount is <span className="font-bold text-gold-dark">fully credited</span> towards
                          your professional fee.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quote Summary - Right Column (Sticky) */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-24">
                  <QuoteSummary
                    selectedVisa={selectedVisa}
                    consultationCredit={CONSULTATION_CREDIT}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
