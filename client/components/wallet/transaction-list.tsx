"use client";

import React, { useState } from "react";
import { History } from "lucide-react";
import { WalletTransaction } from "@/types/wallet";
import { TransactionRow } from "./transaction-row";
import { WalletEmptyState } from "./wallet-empty-state";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TransactionListProps {
  transactions: WalletTransaction[];
  currency?: string;
}

type FilterType = "all" | "deposit" | "rental";

export function TransactionList({ transactions, currency = "NPR" }: TransactionListProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "deposit") return t.transactionType === "deposit" || t.transactionType === "refund";
    if (filter === "rental") return t.transactionType === "rental";
    return true;
  });

  return (
    <Card variant="default">
      {/* Header & Filter Controls */}
      <Card.Header className="p-5 sm:p-6 flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 space-y-0">
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-primary" />
          <Card.Title className="text-xs font-bold uppercase tracking-wider">
            Transaction History
          </Card.Title>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-secondary/50 border border-border/60 rounded-xl self-start sm:self-auto">
          {(["all", "deposit", "rental"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={cn(
                "px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer capitalize",
                filter === type
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {type === "all" ? "All" : type === "deposit" ? "Deposits" : "Rentals"}
            </button>
          ))}
        </div>
      </Card.Header>

      {/* Transaction Items */}
      <Card.Content className="p-0">
        {filteredTransactions.length === 0 ? (
          <WalletEmptyState filter={filter} />
        ) : (
          <div className="divide-y divide-border/40">
            {filteredTransactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                currency={currency}
              />
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
