import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-background">
      <div className="container relative mx-auto px-6 lg:px-10 text-center z-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground leading-tight max-w-3xl mx-auto">
          Your next GPU cluster is a{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
            few clicks away.
          </span>
        </h2>
        
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Find the compute capacity you need and start training models immediately with transparent hourly billing.
        </p>
        
        <Link href="/marketplace">
          <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-corporate-hover gap-2">
            <span>Explore Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
