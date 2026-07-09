import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { StructuredPointsCalculator } from "@/components/wizard/StructuredPointsCalculator";

export default function PointsCalculator() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <StructuredPointsCalculator />
      </main>
      <Footer />
    </div>
  );
}
