import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import PointsCalculator from "./pages/PointsCalculator";
import OccupationSearch from "./pages/OccupationSearch";
import Quote from "./pages/Quote";
import Auth from "./pages/Auth";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Consultation from "./pages/Consultation";
import PreScreen from "./pages/PreScreen";
import ConsultSchedule from "./pages/ConsultSchedule";
import ConsultBook from "./pages/ConsultBook";
import ConsultConfirmed from "./pages/ConsultConfirmed";
import PartnerAudit from "./pages/PartnerAudit";
import ParentAudit from "./pages/ParentAudit";
import { 
  StudentPathway, 
  SkilledPathway, 
  PartnerPathway, 
  OnshorePathway, 
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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/points-calculator" element={<PointsCalculator />} />
            <Route path="/occupation-search" element={<OccupationSearch />} />
            <Route path="/consultation" element={<Consultation />} />

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
            <Route path="/parent-audit" element={<ParentAudit />} />
            <Route path="/quote" element={<Quote />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsArticle />} />
            <Route path="/admin/*" element={<Admin />} />
            {/* Public Pathway Pages */}
            <Route path="/pathways/student" element={<StudentPathway />} />
            <Route path="/pathways/skilled" element={<SkilledPathway />} />
            <Route path="/pathways/partner" element={<PartnerPathway />} />
            <Route path="/pathways/onshore" element={<OnshorePathway />} />
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
