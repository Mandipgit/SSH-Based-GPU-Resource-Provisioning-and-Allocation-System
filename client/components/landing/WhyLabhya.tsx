import { Banknote, Clock, Box, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

export function WhyLabhya() {
  const features = [
    {
      title: "Cost-Effective Compute",
      description: "Access high-end consumer and data-center GPUs without heavy capital expenditure. Pay strictly for elapsed compute time.",
      icon: <Banknote className="w-5 h-5 text-primary" />
    },
    {
      title: "On-Demand GPU Access",
      description: "Rent compute when you need it instead of maintaining idle local clusters or expensive long-term cloud commitments.",
      icon: <Clock className="w-5 h-5 text-primary" />
    },
    {
      title: "Isolated Container Runtimes",
      description: "Every workload runs inside an isolated Docker/Ubuntu container with zero host file-system cross-contamination.",
      icon: <Box className="w-5 h-5 text-primary" />
    },
    {
      title: "Secure SSH Access",
      description: "Direct reverse SSH gateway connects you safely to your provisioned compute container with per-session credentials.",
      icon: <Lock className="w-5 h-5 text-primary" />
    }
  ];

  return (
    <section className="py-24 bg-secondary/30 border-b border-border/60">
      <div className="container mx-auto px-6 lg:px-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Why Labhya Compute
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Engineered for Modern AI Engineering
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Enterprise-grade container isolation and direct GPU passthrough at peer-to-peer market pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              className="flex items-start gap-5 p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-corporate transition-all duration-200 hover:-translate-y-1 hover:shadow-corporate-hover"
            >
              <div className="p-3.5 bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary border border-primary/20 rounded-2xl shrink-0">
                {feature.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
