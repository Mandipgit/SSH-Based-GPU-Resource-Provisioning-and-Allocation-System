import React from "react";
import { ServerOff, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MarketplaceEmptyProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function MarketplaceEmpty({
  hasActiveFilters,
  onClearFilters,
}: MarketplaceEmptyProps) {
  return (
    <Card className="flex flex-col items-center justify-center min-h-[360px] rounded-2xl border border-border bg-card p-8 text-center shadow-corporate">
      <CardContent className="flex flex-col items-center justify-center p-0">
        <div className="p-4 rounded-2xl bg-secondary/80 border border-border/80 text-muted-foreground mb-4">
          <ServerOff className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2">
          {hasActiveFilters ? "No GPUs found" : "No GPUs available"}
        </h3>

        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {hasActiveFilters
            ? "There are no GPUs matching your current search or filter criteria. Try broadening your parameters."
            : "There are currently no GPU compute instances registered on the network. Please check back later."}
        </p>

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="gap-2 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
