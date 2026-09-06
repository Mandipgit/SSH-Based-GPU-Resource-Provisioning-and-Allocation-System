import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { MarketplaceGPU, normalizeGpus, normalizeGpu } from "@/types/gpu";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://gpu-rental-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState();
    const token = state.accessToken || state.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with automatic token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login/") ||
      originalRequest.url?.includes("/auth/refresh/") ||
      originalRequest.url?.includes("/auth/register/");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh/`,
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAccessToken =
          refreshResponse.data?.data?.access_token ||
          refreshResponse.data?.access_token;

        if (!newAccessToken) {
          throw new Error("No access token returned from refresh endpoint");
        }

        useAuthStore.getState().setTokens(newAccessToken, refreshToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        toast.error("Session expired. Please log in again.");
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// --- API Methods ---
export { getWalletBalance, depositFunds, getWalletTransactions } from "./wallet";
export { getSessions, stopSession, getSessionById, createSession, getSessionStatus } from "./sessions";
export type { SessionStatusData } from "./sessions";

export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  role: "renter" | "host" | "both" | "admin";
  password: string;
  password2: string;
}

export interface RegisterResponse {
  status: string;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      full_name?: string;
      role: string;
      is_active: boolean;
      is_email_verified: boolean;
      wallet_balance: number;
      is_host: boolean;
      is_renter: boolean;
      created_at: string;
    };
  };
}

/**
 * Register a new user account with the Django REST Framework backend.
 * POST /api/auth/register/
 */
export const registerUser = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>("/auth/register/", payload);
  return response.data;
};

/**
 * Log out authenticated user by revoking the refresh token on the backend
 * and clearing local client authentication state.
 */
export const logoutUser = async (): Promise<void> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (refreshToken) {
    try {
      await api.post("/auth/logout/", { refresh_token: refreshToken });
    } catch (err) {
      console.warn("Backend token revocation request failed:", err);
    }
  }
  useAuthStore.getState().logout();
};

/**
 * Normalizes backend and network errors into human-friendly messages.
 */
export const getErrorMessage = (
  error: unknown,
  fallback = "Unable to connect to the compute service. Please try again in a moment."
): string => {
  if (!error) return fallback;
  const axiosErr = error as AxiosError<{
    message?: string;
    detail?: string;
    error?: string;
    non_field_errors?: string[];
  }>;
  if (axiosErr.response?.data) {
    const d = axiosErr.response.data;
    if (typeof d.message === "string") return d.message;
    if (typeof d.detail === "string") return d.detail;
    if (typeof d.error === "string") return d.error;
    if (Array.isArray(d.non_field_errors) && d.non_field_errors[0]) return d.non_field_errors[0];
  }
  if (!axiosErr.response && axiosErr.message) {
    return "Unable to connect to the compute service. Please try again in a moment.";
  }
  return fallback;
};

export interface GPUQueryParams {
  search?: string;
  min_vram?: number | null;
  max_vram?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  location?: string;
  available_only?: boolean;
  min_uptime?: number | null;
  sort_by?: string;
  sort_order?: string;
}

/**
 * Fetch marketplace GPUs from the public backend endpoint with optional filters.
 */
export const getGPUs = async (params?: GPUQueryParams): Promise<MarketplaceGPU[]> => {
  const cleanParams: Record<string, string | number | boolean> = {};

  if (params) {
    if (params.search?.trim()) cleanParams.search = params.search.trim();
    if (typeof params.min_vram === "number" && !isNaN(params.min_vram)) cleanParams.min_vram = params.min_vram;
    if (typeof params.max_vram === "number" && !isNaN(params.max_vram)) cleanParams.max_vram = params.max_vram;
    if (typeof params.min_price === "number" && !isNaN(params.min_price)) cleanParams.min_price = params.min_price;
    if (typeof params.max_price === "number" && !isNaN(params.max_price)) cleanParams.max_price = params.max_price;
    if (params.location?.trim()) cleanParams.location = params.location.trim();
    if (params.available_only !== undefined) cleanParams.available_only = params.available_only;
    if (typeof params.min_uptime === "number" && !isNaN(params.min_uptime)) cleanParams.min_uptime = params.min_uptime;
    if (params.sort_by) cleanParams.sort_by = params.sort_by;
    if (params.sort_order) cleanParams.sort_order = params.sort_order;
  }

  const response = await api.get("/gpus/", { params: cleanParams });
  const data = Array.isArray(response.data)
    ? response.data
    : response.data?.results || response.data?.data || [];
  return normalizeGpus(data);
};

/**
 * Fetch available GPUs directly from backend.
 */
export const getAvailableGpus = async (): Promise<MarketplaceGPU[]> => {
  try {
    const response = await api.get("/gpus/available/");
    const data = Array.isArray(response.data)
      ? response.data
      : response.data?.results || response.data?.data || [];
    return normalizeGpus(data);
  } catch {
    return getGPUs({ available_only: true });
  }
};

/**
 * Fetch a single GPU by ID from the backend endpoint.
 */
export const getGpuById = async (id: string | number): Promise<MarketplaceGPU | null> => {
  const response = await api.get(`/gpus/${id}/`);
  return normalizeGpu(response.data);
};

/**
 * Fetch role-aware or renter dashboard data from the backend.
 */
export const getRenterDashboardData = async () => {
  const response = await api.get("/dashboard/renter/");
  return response.data;
};
