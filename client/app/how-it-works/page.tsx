import { Navbar } from "@/components/landing/Navbar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrustSection } from "@/components/landing/TrustSection";
import { HostCTA } from "@/components/landing/HostCTA";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "How It Works - tero gpu de malai",
  description: "Learn how tero gpu de malai connects developers and researchers with high-performance on-demand GPU compute infrastructure.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#000000] text-white selection:bg-[#2B55E8]/30">
      <Navbar />
      <main className="flex-grow flex flex-col pt-20 md:pt-24">
        <HowItWorks />
        <TrustSection />
        <HostCTA />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
