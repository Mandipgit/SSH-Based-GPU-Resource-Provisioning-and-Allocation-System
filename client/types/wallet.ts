export type TransactionType = "deposit" | "rental" | "refund" | "withdrawal" | string;
export type TransactionStatus = "completed" | "pending" | "failed" | string;

export interface Wallet {
  id?: string;
  userId?: string;
  balance: number;
  availableBalance?: number;
  holdAmount?: number;
  currency: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface WalletTransaction {
  id: string;
  walletId?: string;
  transactionType: TransactionType;
  amount: number;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
}

export interface DepositRequest {
  amount: number;
}

export interface DepositResponse {
  success?: boolean;
  balance?: number;
  currency?: string;
  wallet?: Wallet;
  transaction?: WalletTransaction;
  message?: string;
}

/**
 * Normalizes backend response into canonical Wallet structure.
 */
export function normalizeWallet(raw: Record<string, unknown> | null | undefined): Wallet {
  if (!raw || typeof raw !== "object") {
    return {
      balance: 0,
      availableBalance: 0,
      holdAmount: 0,
      currency: "NPR",
    };
  }

  // Handle nested wallet object if returned like { data: { ... } } or { wallet: ... }
  const data = (raw.data || raw.wallet || raw) as Record<string, unknown>;

  const rawBalance = data.balance ?? raw.balance ?? 0;
  const rawAvailable = data.available_balance ?? raw.available_balance ?? rawBalance;
  const rawHold = data.hold_amount ?? raw.hold_amount ?? 0;
  const rawCurrency = (data.currency || raw.currency || "NPR") as string;
  const rawId = (data.id ?? data.wallet_id ?? raw.id) as string | undefined;
  const rawUserId = (data.user_id ?? data.userId ?? raw.user_id ?? raw.user) as string | undefined;
  const rawUpdatedAt = (data.updated_at ?? data.updatedAt ?? raw.updated_at) as string | undefined;
  const rawCreatedAt = (data.created_at ?? data.createdAt ?? raw.created_at) as string | undefined;

  return {
    id: rawId ? String(rawId) : undefined,
    userId: rawUserId ? String(rawUserId) : undefined,
    balance: Number(rawBalance) || 0,
    availableBalance: Number(rawAvailable) || 0,
    holdAmount: Number(rawHold) || 0,
    currency: String(rawCurrency).toUpperCase(),
    updatedAt: rawUpdatedAt ? String(rawUpdatedAt) : undefined,
    createdAt: rawCreatedAt ? String(rawCreatedAt) : undefined,
  };
}

/**
 * Normalizes transaction item.
 */
export function normalizeTransaction(raw: Record<string, unknown> | null | undefined): WalletTransaction {
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      transactionType: "deposit",
      amount: 0,
      status: "completed",
      createdAt: new Date().toISOString(),
    };
  }

  const rawId = String(raw.id ?? raw.transaction_id ?? "");
  const rawWalletId = raw.wallet_id || raw.walletId ? String(raw.wallet_id ?? raw.walletId) : undefined;
  
  let rawType = String(raw.transaction_type ?? raw.transactionType ?? raw.type ?? "deposit").toLowerCase();
  if (rawType.includes("deposit")) rawType = "deposit";
  else if (rawType.includes("rent") || rawType.includes("session")) rawType = "rental";
  else if (rawType.includes("refund")) rawType = "refund";

  let rawStatus = String(raw.status || "completed").toLowerCase();
  if (rawStatus === "success" || rawStatus === "settled") rawStatus = "completed";

  const rawAmount = Number(raw.amount ?? 0);
  const rawDescription = (raw.description || raw.desc || (rawType === "deposit" ? "Wallet Deposit" : "GPU Rental")) as string;
  const rawCreatedAt = String(raw.created_at ?? raw.createdAt ?? new Date().toISOString());

  return {
    id: rawId,
    walletId: rawWalletId,
    transactionType: rawType,
    amount: Math.abs(rawAmount),
    status: rawStatus,
    description: rawDescription,
    createdAt: rawCreatedAt,
  };
}

export function normalizeTransactions(rawList: unknown): WalletTransaction[] {
  if (rawList && typeof rawList === "object" && "results" in rawList && Array.isArray((rawList as { results: unknown[] }).results)) {
    return (rawList as { results: unknown[] }).results.map((item) => normalizeTransaction(item as Record<string, unknown>));
  }
  if (rawList && typeof rawList === "object" && "data" in rawList && Array.isArray((rawList as { data: unknown[] }).data)) {
    return (rawList as { data: unknown[] }).data.map((item) => normalizeTransaction(item as Record<string, unknown>));
  }
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item) => normalizeTransaction(item as Record<string, unknown>));
}
