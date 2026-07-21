import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { PartnerEligibilityForm } from "@/components/partner/eligibility/PartnerEligibilityForm";

export default function PartnerAudit() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PartnerEligibilityForm />
      </main>
      <Footer />
    </div>
  );
}
