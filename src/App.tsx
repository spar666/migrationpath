import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VisaDetails from "@/pages/VisaDetails";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { SiteSeo } from "@/components/seo/SiteSeo";
import Index from "./pages/Index";
import PointsCalculator from "./pages/PointsCalculator";
import OccupationSearch from "./pages/OccupationSearch";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import Consultation from "./pages/Consultation";
import GetStarted from "./pages/GetStarted";
import PreScreen from "./pages/PreScreen";
import ConsultSchedule from "./pages/ConsultSchedule";
import ConsultBook from "./pages/ConsultBook";
import ConsultConfirmed from "./pages/ConsultConfirmed";
import PartnerAudit from "./pages/PartnerAudit";
import StandardCapture from "./pages/StandardCapture";
import { 
  SkilledPathway, 
  PartnerPathway, 
  EmployerPathway 
} from "./pages/pathways";

// Configure React Query for production use
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SiteConfigProvider>
        <BrowserRouter>
          <SiteSeo />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/visas/:categorySlug" element={<VisaDetails />} />
            <Route path="/visas/:categorySlug/:subclass" element={<VisaDetails />} />
            <Route path="/points-calculator" element={<PointsCalculator />} />
            <Route path="/occupation-search" element={<OccupationSearch />} />
            <Route path="/consultation" element={<Consultation />} />

            {/* The single "get started" front door. Replaces /quote, which
                opened the relationship on price and ended at a dashboard that
                no longer exists. This routes to the questionnaire that matches
                the visitor's situation instead. */}
            <Route path="/get-started" element={<GetStarted />} />

            {/* Lead-gen funnel. /consult/book and /consult/confirmed are the
                Stripe cancel and success URLs — if these paths change, the
                backend's STRIPE_CANCEL_URL / STRIPE_SUCCESS_URL must change
                with them or paying visitors land on a 404. */}
            <Route path="/pre-screen" element={<PreScreen />} />
            {/* /consult/schedule hosts the calendar on our origin so the
                hand-off to payment is code rather than a Calendly dashboard
                setting. Sending people to calendly.com instead ends the journey
                with a held slot and no payment. */}
            <Route path="/consult/schedule" element={<ConsultSchedule />} />
            <Route path="/consult/book" element={<ConsultBook />} />
            <Route path="/consult/confirmed" element={<ConsultConfirmed />} />
            <Route path="/partner-audit" element={<PartnerAudit />} />
            <Route path="/pathways/485" element={<StandardCapture pathway="485" title="Temporary Graduate pathway enquiry" description="Tell us about your studies, current visa and plans. A registered migration agent will review which Temporary Graduate options may be relevant." />} />
            <Route path="/pathways/858" element={<StandardCapture pathway="858" title="National Innovation pathway enquiry" description="Tell us about your internationally recognised achievements and proposed contribution. A registered migration agent must assess this pathway." />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsArticle />} />
            {/* Sign-in is staff-only and lives inside the admin namespace.
                It must be matched before /admin/* so it is not wrapped in
                AdminGate — gating the login page behind the gate that
                redirects here is an infinite loop. */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<Admin />} />
            {/* Public Pathway Pages */}
            <Route path="/pathways/skilled" element={<SkilledPathway />} />
            <Route path="/pathways/partner" element={<PartnerPathway />} />
            <Route path="/pathways/employer" element={<EmployerPathway />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </SiteConfigProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
