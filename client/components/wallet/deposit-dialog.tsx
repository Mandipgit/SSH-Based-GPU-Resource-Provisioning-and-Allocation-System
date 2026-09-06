"use client";

import React, { useState } from "react";
import { Coins, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { depositFunds } from "@/services/wallet";
import { toast } from "sonner";
import { Wallet } from "@/types/wallet";
import { cn } from "@/lib/utils";

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
  onDepositSuccess: (updatedWallet: Wallet) => void;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

export function DepositDialog({
  isOpen,
  onClose,
  currency = "NPR",
  onDepositSuccess,
}: DepositDialogProps) {
  const [amount, setAmount] = useState<string>("1000");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    if (error) setError(null);
  };

  const handlePresetClick = (presetVal: number) => {
    setAmount(presetVal.toString());
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid deposit amount greater than zero.");
      return;
    }

    if (numAmount < 10) {
      setError(`Minimum deposit amount is ${currency} 10.`);
      return;
    }

    if (numAmount > 100000) {
      setError(`Maximum single deposit amount is ${currency} 100,000.`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const res = await depositFunds(numAmount);
      
      if (res.success) {
        toast.success(`Successfully added ${currency} ${numAmount.toLocaleString()} to your wallet.`);
        onDepositSuccess(res.wallet);
        onClose();
      } else {
        setError(res.message || "Failed to complete deposit. Please try again.");
      }
    } catch (err: unknown) {
      console.error("Deposit submission error:", err);
      setError("Deposit failed. We couldn't add funds to your wallet. Please try again.");
      toast.error("Deposit failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deposit-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <Card className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 relative">
        {/* Close Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          isIconOnly
          isDisabled={isLoading}
          onPress={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-border/60">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary border border-primary/20 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h3 id="deposit-dialog-title" className="font-bold text-lg text-foreground">
              Add Funds
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Deposit compute credits to your tero gpu de malai wallet.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="deposit-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount ({currency})
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground select-none font-semibold">
                {currency}
              </span>
              <Input
                id="deposit-amount"
                type="number"
                step="any"
                min="1"
                placeholder="1000"
                value={amount}
                onChange={handleAmountChange}
                disabled={isLoading}
                className="pl-14 h-11 text-base font-mono font-bold"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-destructive font-semibold mt-1">
                {error}
              </p>
            )}
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Quick Select
            </span>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handlePresetClick(val)}
                  className={cn(
                    "py-2 px-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer",
                    amount === val.toString()
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-secondary/40 text-foreground border-border/60 hover:bg-secondary hover:border-border"
                  )}
                >
                  {val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Informational note */}
          <div className="rounded-xl bg-secondary/40 border border-border/50 p-3.5 text-xs text-muted-foreground leading-relaxed">
            Deposited funds are immediately credited to your balance and will be deducted automatically as your active GPU sessions accrue compute time.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="tertiary"
              size="md"
              isDisabled={isLoading}
              onPress={onClose}
              className="flex-1 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isPending={isLoading}
              className="flex-1 font-semibold gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Funds</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
