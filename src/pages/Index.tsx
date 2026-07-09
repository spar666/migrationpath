import { useState } from "react";
import { Header } from "@/components/common/navbar/Header";
import { Footer } from "@/components/common/footer/Footer";
import { MobileBottomNav } from "@/components/common/navbar/MobileBottomNav";
import { HeroSection } from "@/components/home/HeroSection";
import { InvitationFeed } from "@/components/home/InvitationFeed";
import { PathwayCards } from "@/components/home/PathwayCards";
import { SuccessStories } from "@/components/home/SuccessStories";
import { FinalCTA } from "@/components/home/FinalCTA";
import { MobileSearchOverlay } from "@/components/search/MobileSearchOverlay";

const Index = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1">
        <HeroSection onSearchFocus={() => setIsSearchOpen(true)} />
        <InvitationFeed />
        <PathwayCards />
        <SuccessStories />
        <FinalCTA />
      </main>
      <Footer />
      <MobileBottomNav />

      <MobileSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={(query) => console.log("Search:", query)}
      />
    </div>
  );
};

export default Index;
