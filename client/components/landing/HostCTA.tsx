import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HostCTA() {
  return (
    <section className="py-24 bg-secondary/30 border-b border-border/60 relative overflow-hidden">
      <div className="container relative mx-auto px-6 lg:px-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="text-xs font-bold uppercase tracking-wider text-primary">
            Host Compute Nodes
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Have a GPU sitting idle?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Turn unused GPU capacity into recurring revenue by becoming a Labhya Compute host with our lightweight Windows Desktop Agent.
          </p>
          <div className="pt-2">
            <Link href="/register/host">
              <Button size="lg" className="font-semibold shadow-sm px-8">
                Become a Host
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
