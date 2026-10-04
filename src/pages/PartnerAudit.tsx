import { ApplicantAudit } from '@/components/partner/eligibility/ApplicantAudit';
import { Header } from '@/components/common/navbar/Header';
import { Footer } from '@/components/common/footer/Footer';

export default function PartnerAudit() {
  return (
    <div className="min-h-screen flex flex-col bg-cloud">
      <Header />
      <main className="flex-1">
        <ApplicantAudit />
      </main>
      <Footer />
    </div>
  );
}
