import { Search, CreditCard, Terminal, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

export function HowItWorks() {
  const steps = [
    {
      id: "01",
      title: "Find your GPU",
      description: "Browse available GPUs and filter based on model, VRAM capacity, hourly rate, and compute location.",
      icon: <Search className="w-5 h-5 text-primary" />
    },
    {
      id: "02",
      title: "Rent on Demand",
      description: "Select an available GPU and initialize your on-demand rental session with zero setup fee.",
      icon: <CreditCard className="w-5 h-5 text-primary" />
    },
    {
      id: "03",
      title: "Connect via SSH",
      description: "Once the host provisions the Docker container, obtain secure SSH credentials instantly.",
      icon: <Terminal className="w-5 h-5 text-primary" />
    },
    {
      id: "04",
      title: "Run Workloads",
      description: "Train PyTorch models, run LLM inference, or test CUDA kernels with dedicated hardware passthrough.",
      icon: <Zap className="w-5 h-5 text-primary" />
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-background border-b border-border/60">
      <div className="container mx-auto px-6 lg:px-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Seamless Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            How Labhya Compute Works
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Get from zero to running AI workloads in minutes through automated container provisioning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <Card
              key={step.id}
              className="p-6 rounded-2xl border border-border bg-card shadow-corporate transition-all duration-200 hover:-translate-y-1 hover:shadow-corporate-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 bg-gradient-to-br from-indigo-500/15 to-violet-500/15 rounded-xl text-primary border border-primary/20">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-extrabold text-muted-foreground/30 font-mono">
                    {step.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
