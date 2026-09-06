import { api } from "./api";
import {
  Wallet,
  WalletTransaction,
  normalizeWallet,
  normalizeTransactions,
  normalizeTransaction,
} from "@/types/wallet";

/**
 * Fetch authenticated renter's wallet balance from GET /wallets/balance/.
 */
export const getWalletBalance = async (): Promise<Wallet> => {
  const response = await api.get("/wallets/balance/");
  const data = response.data?.data ?? response.data;
  return normalizeWallet(data);
};

/**
 * Deposit funds into the renter wallet via POST /wallets/deposit/.
 */
export const depositFunds = async (
  amount: number
): Promise<{ success: boolean; wallet: Wallet; transaction?: WalletTransaction; message?: string }> => {
  const response = await api.post("/wallets/deposit/", { amount });
  const data = response.data;

  // If backend returned updated wallet / balance directly
  let updatedWallet: Wallet;
  if (data?.data?.new_balance !== undefined || data?.wallet || data?.balance !== undefined) {
    const walletData = data.wallet || (data.data?.new_balance !== undefined ? { balance: data.data.new_balance } : data);
    updatedWallet = normalizeWallet(walletData);
  } else {
    // Re-fetch authoritative balance
    updatedWallet = await getWalletBalance();
  }

  const rawTx = data?.data?.transaction || data?.transaction;
  const transaction = rawTx ? normalizeTransaction(rawTx) : undefined;

  return {
    success: true,
    wallet: updatedWallet,
    transaction,
    message: data?.message || "Funds deposited successfully.",
  };
};

/**
 * Fetch wallet transaction history from GET /wallets/transactions/.
 */
export const getWalletTransactions = async (): Promise<WalletTransaction[]> => {
  const response = await api.get("/wallets/transactions/");
  const list = response.data?.results ?? response.data?.data ?? response.data;
  return normalizeTransactions(list);
};

