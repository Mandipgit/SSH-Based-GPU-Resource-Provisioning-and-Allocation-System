import React from "react";
import Link from "next/link";
import { Cpu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SessionsEmptyState() {
  return (
    <Card className="bg-card border border-border shadow-corporate text-center py-12 px-6">
      <CardContent className="flex flex-col items-center justify-center max-w-md mx-auto space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
          <Cpu className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">
            No GPU sessions yet
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Rent a GPU from the marketplace to start computing. Your active instances and historical sessions will be managed here.
          </p>
        </div>

        <Link href="/marketplace" className="pt-2">
          <Button className="font-semibold px-6 h-10 gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Browse GPUs
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
