import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { PartnerAuditWizard } from "@/components/partner/PartnerAuditWizard";

export default function PartnerAudit() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PartnerAuditWizard />
      </main>
      <Footer />
    </div>
  );
}
