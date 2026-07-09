import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { ParentAuditWizard } from "@/components/parent/ParentAuditWizard";

export default function ParentAudit() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <ParentAuditWizard />
      </main>
      <Footer />
    </div>
  );
}
