import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { MarketplacePreview } from "@/components/landing/MarketplacePreview";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhyLabhya } from "@/components/landing/WhyLabhya";
import { TechnicalSecurity } from "@/components/landing/TechnicalSecurity";
import { HostCTA } from "@/components/landing/HostCTA";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#000000] text-white selection:bg-[#2B55E8]/30">
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Hero />
        <MarketplacePreview />
        <HowItWorks />
        <WhyLabhya />
        <TechnicalSecurity />
        <HostCTA />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
