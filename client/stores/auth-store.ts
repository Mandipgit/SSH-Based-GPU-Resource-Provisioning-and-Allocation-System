import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  role: "renter" | "host" | "both" | "admin";
  name: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  updateUser: (updatedFields: Partial<User>) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: false,
      setAuth: (user, accessToken, refreshToken) =>
        set((state) => ({
          user,
          token: accessToken,
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
          isAuthenticated: true,
          isInitialized: true,
        })),
      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          token: accessToken,
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
          isAuthenticated: true,
          isInitialized: true,
        })),
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),
      logout: () =>
        set({
          user: null,
          token: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isInitialized: true,
        }),
      checkAuth: async () => {
        const state = get();
        const activeToken = state.accessToken || state.token;
        if (!activeToken) {
          set({ isAuthenticated: false, user: null, isInitialized: true });
          return false;
        }

        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://gpu-rental-backend.onrender.com/api";
          const res = await fetch(`${baseUrl}/auth/me/`, {
            headers: {
              Authorization: `Bearer ${activeToken}`,
              "Content-Type": "application/json",
            },
          });

          if (res.ok) {
            const json = await res.json();
            const d = json.data || json;
            const firstName = d.first_name || "";
            const lastName = d.last_name || "";
            const name = d.name || `${firstName} ${lastName}`.trim() || "Renter";
            set({
              user: {
                id: String(d.id || state.user?.id || ""),
                email: d.email || state.user?.email || "",
                name,
                firstName,
                lastName,
                role: (d.role === "host" ? "host" : "renter") as User["role"],
              },
              isAuthenticated: true,
              isInitialized: true,
            });
            return true;
          }

          if (res.status === 401) {
            get().logout();
            set({ isInitialized: true });
            return false;
          }

          set({ isInitialized: true });
          return state.isAuthenticated;
        } catch {
          set({ isInitialized: true });
          return state.isAuthenticated;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
