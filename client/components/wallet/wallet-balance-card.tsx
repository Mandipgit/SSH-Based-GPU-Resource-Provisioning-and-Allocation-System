"use client";

import React from "react";
import { Plus, Wallet as WalletIcon, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react";
import { Wallet } from "@/types/wallet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WalletBalanceCardProps {
  wallet: Wallet;
  onAddFunds: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function WalletBalanceCard({
  wallet,
  onAddFunds,
  onRefresh,
  isRefreshing = false,
}: WalletBalanceCardProps) {
  const currency = wallet.currency || "NPR";
  const formattedBalance = Number(wallet.balance || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isLowBalance = wallet.balance < 200;

  return (
    <Card variant="default" className="relative overflow-hidden">
      {/* Top accent glow line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600" />

      <Card.Content className="p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-primary/20 text-primary shrink-0 shadow-xs">
              <WalletIcon className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Available Balance
                </span>
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    isDisabled={isRefreshing}
                    onPress={onRefresh}
                    aria-label="Refresh balance"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                )}
              </div>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
                  {currency} {formattedBalance}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Available for compute rentals &middot; Deducted hourly based on active duration</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:self-center shrink-0">
            <Button
              variant="primary"
              size="md"
              onPress={onAddFunds}
              className="font-semibold px-5 gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Funds</span>
            </Button>
          </div>
        </div>

        {/* Low balance contextual prompt */}
        {isLowBalance && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Your balance is low ({currency} {formattedBalance}). You may need additional funds before starting your next GPU rental.</span>
            </div>
            <Button
              variant="link"
              size="xs"
              onPress={onAddFunds}
              className="text-xs font-semibold p-0 text-amber-900 dark:text-amber-200"
            >
              Deposit now
            </Button>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
