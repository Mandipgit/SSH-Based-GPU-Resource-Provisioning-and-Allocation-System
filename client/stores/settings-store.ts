import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AppTheme = "system" | "light" | "dark";
export type UIDensity = "compact" | "default" | "comfortable";

export interface NotificationPreferences {
  /** Notify when a rental session becomes active */
  rentalStarted: boolean;
  /** Notify when a rental session is stopped or expires */
  rentalStopped: boolean;
  /** Notify on wallet deposits */
  walletDeposit: boolean;
  /** Notify on wallet withdrawals / spend */
  walletSpend: boolean;
  /** Notify on security events (new sign-in, password change) */
  securityAlerts: boolean;
}

export interface ComputePreferences {
  /** Preferred SSH user to display in connection instructions */
  defaultSshUser: string;
  /** Whether to auto-copy SSH commands to clipboard when a session becomes active */
  autoCopySsh: boolean;
  /** Whether to show a confirmation dialog before terminating a session */
  confirmBeforeStop: boolean;
}

export interface SettingsState {
  // ── Appearance ──────────────────────────────────────────────────────────
  theme: AppTheme;
  density: UIDensity;
  reducedMotion: boolean;

  // ── Notifications ───────────────────────────────────────────────────────
  notifications: NotificationPreferences;

  // ── Compute ─────────────────────────────────────────────────────────────
  compute: ComputePreferences;

  // ── Actions ─────────────────────────────────────────────────────────────
  setTheme: (theme: AppTheme) => void;
  setDensity: (density: UIDensity) => void;
  setReducedMotion: (value: boolean) => void;
  setNotification: (
    key: keyof NotificationPreferences,
    value: boolean
  ) => void;
  setComputePreference: <K extends keyof ComputePreferences>(
    key: K,
    value: ComputePreferences[K]
  ) => void;
  resetAppearance: () => void;
  resetNotifications: () => void;
  resetCompute: () => void;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const defaultNotifications: NotificationPreferences = {
  rentalStarted: true,
  rentalStopped: true,
  walletDeposit: true,
  walletSpend: false,
  securityAlerts: true,
};

const defaultCompute: ComputePreferences = {
  defaultSshUser: "root",
  autoCopySsh: false,
  confirmBeforeStop: true,
};

// ─── Store ──────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      density: "default",
      reducedMotion: false,

      notifications: defaultNotifications,
      compute: defaultCompute,

      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      setReducedMotion: (value) => set({ reducedMotion: value }),

      setNotification: (key, value) =>
        set((state) => ({
          notifications: { ...state.notifications, [key]: value },
        })),

      setComputePreference: (key, value) =>
        set((state) => ({
          compute: { ...state.compute, [key]: value },
        })),

      resetAppearance: () =>
        set({ theme: "system", density: "default", reducedMotion: false }),

      resetNotifications: () => set({ notifications: defaultNotifications }),

      resetCompute: () => set({ compute: defaultCompute }),
    }),
    {
      name: "labhya-settings",
    }
  )
);
