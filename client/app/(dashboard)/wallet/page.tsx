"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Wallet, WalletTransaction } from "@/types/wallet";
import { getWalletBalance, getWalletTransactions } from "@/services/wallet";
import { WalletBalanceCard } from "@/components/wallet/wallet-balance-card";
import { DepositDialog } from "@/components/wallet/deposit-dialog";
import { TransactionList } from "@/components/wallet/transaction-list";
import { WalletSkeleton } from "@/components/wallet/wallet-skeleton";
import { Button } from "@/components/ui/button";

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState<boolean>(false);

  const fetchWalletData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [walletData, txData] = await Promise.all([
        getWalletBalance(),
        getWalletTransactions(),
      ]);
      setWallet(walletData);
      setTransactions(txData);
    } catch (err: unknown) {
      console.error("Failed to load wallet data:", err);
      setError("We couldn't retrieve your wallet information. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getWalletBalance(),
      getWalletTransactions(),
    ])
      .then(([walletData, txData]) => {
        if (isMounted) {
          setWallet(walletData);
          setTransactions(txData);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          console.error("Failed to load wallet data:", err);
          setError("We couldn't retrieve your wallet information. Please try again.");
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDepositSuccess = (updatedWallet: Wallet) => {
    setWallet(updatedWallet);
    // Refetch transactions to include the newly created deposit entry
    fetchWalletData(true);
  };

  if (isLoading) {
    return <WalletSkeleton />;
  }

  if (error || !wallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-card rounded-2xl border border-border/80 max-w-md mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            Unable to load wallet
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error || "We couldn't retrieve your wallet information. Please try again."}
          </p>
        </div>
        <Button
          onClick={() => fetchWalletData()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2 cursor-pointer mt-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto w-full">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Wallet
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your compute balance and transaction history.
          </p>
        </div>
      </div>

      {/* 2. Main Balance Card */}
      <section aria-labelledby="wallet-balance-heading">
        <h2 id="wallet-balance-heading" className="sr-only">
          Available Compute Balance
        </h2>
        <WalletBalanceCard
          wallet={wallet}
          onAddFunds={() => setIsDepositDialogOpen(true)}
          onRefresh={() => fetchWalletData(true)}
          isRefreshing={isRefreshing}
        />
      </section>

      {/* 3. Transaction History Section */}
      <section aria-labelledby="wallet-transactions-heading">
        <h2 id="wallet-transactions-heading" className="sr-only">
          Transaction History
        </h2>
        <TransactionList
          transactions={transactions}
          currency={wallet.currency || "NPR"}
        />
      </section>

      {/* 4. Add Funds Modal Dialog */}
      <DepositDialog
        isOpen={isDepositDialogOpen}
        onClose={() => setIsDepositDialogOpen(false)}
        currency={wallet.currency || "NPR"}
        onDepositSuccess={handleDepositSuccess}
      />
    </div>
  );
}
