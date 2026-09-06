import React from "react";
import { History } from "lucide-react";

interface WalletEmptyStateProps {
  filter?: string;
}

export function WalletEmptyState({ filter }: WalletEmptyStateProps) {
  return (
    <div className="text-center py-10 px-6">
      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-secondary/80 border border-border/80 flex items-center justify-center text-muted-foreground">
          <History className="h-6 w-6 opacity-60" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            {filter && filter !== "all" ? `No ${filter} transactions` : "No transactions yet"}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your wallet activity will appear here after you add funds or rent a GPU.
          </p>
        </div>
      </div>
    </div>
  );
}
