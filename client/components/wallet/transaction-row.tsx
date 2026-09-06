import React from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { WalletTransaction } from "@/types/wallet";
import { cn } from "@/lib/utils";

interface TransactionRowProps {
  transaction: WalletTransaction;
  currency?: string;
}

export function TransactionRow({ transaction, currency = "NPR" }: TransactionRowProps) {
  const isDeposit = transaction.transactionType === "deposit" || transaction.transactionType === "refund";
  const formattedDate = new Date(transaction.createdAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedAmount = transaction.amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const getStatusBadge = () => {
    switch (transaction.status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-muted-foreground border border-border">
            {transaction.status}
          </span>
        );
    }
  };

  return (
    <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-secondary/40 transition-colors border-b border-border/40 last:border-b-0 gap-3">
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={cn(
            "p-2.5 rounded-xl shrink-0 flex items-center justify-center shadow-xs",
            isDeposit
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-secondary text-muted-foreground border border-border/60"
          )}
        >
          {isDeposit ? (
            <ArrowDownLeft className="w-4 h-4" />
          ) : (
            <ArrowUpRight className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {transaction.description || (isDeposit ? "Wallet Deposit" : "GPU Rental")}
          </p>
          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
            {formattedDate} &middot; ID: {transaction.id.substring(0, 10)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 shrink-0 text-right">
        <div>
          <p
            className={cn(
              "font-mono text-sm sm:text-base font-extrabold",
              isDeposit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
            )}
          >
            {isDeposit ? "+" : "-"}
            {currency} {formattedAmount}
          </p>
        </div>
        <div className="hidden sm:block">
          {getStatusBadge()}
        </div>
      </div>
    </div>
  );
}
