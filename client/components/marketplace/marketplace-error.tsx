import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MarketplaceErrorProps {
  message?: string;
  onRetry: () => void;
}

export function MarketplaceError({
  message = "Something went wrong while loading the marketplace.",
  onRetry,
}: MarketplaceErrorProps) {
  return (
    <Card className="flex flex-col items-center justify-center min-h-[360px] rounded-2xl border border-destructive/20 bg-card p-8 text-center shadow-corporate">
      <CardContent className="flex flex-col items-center justify-center p-0">
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2">
          Unable to load GPUs
        </h3>

        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          {message}
        </p>

        <Button
          onClick={onRetry}
          className="gap-2 font-semibold shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}
