"use client";

import React, { useState } from "react";
import { Shield, LogOut, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/services/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─── Danger Confirm Dialog ────────────────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = "danger",
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "primary";
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <Card variant="default" className="shadow-2xl w-full max-w-sm p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="tertiary" size="sm" onPress={onCancel}>
            Cancel
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onPress={onConfirm}
            className="font-semibold"
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SecuritySettings() {
  const router = useRouter();

  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [showLogoutAllConfirm, setShowLogoutAllConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    toast.success("You have been signed out.");
    router.replace("/login");
  };

  const handleLogoutAll = async () => {
    setShowLogoutAllConfirm(false);
    setLogoutAllLoading(true);
    await logoutUser();
    setLogoutAllLoading(false);
    toast.success("All sessions terminated. Please sign in again.");
    router.replace("/login");
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    toast.error(
      "Account deletion is not yet available. Please contact support@labhya.com."
    );
  };

  return (
    <>
      <Card variant="default">
        {/* Section Header */}
        <Card.Header className="p-6 sm:p-8 pb-4 flex-row items-center gap-2.5 border-b border-border/60 space-y-0">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <Card.Title className="text-base font-bold">Security</Card.Title>
            <Card.Description className="text-xs mt-0.5">
              Manage your session access and account security.
            </Card.Description>
          </div>
        </Card.Header>

        <Card.Content className="p-6 sm:p-8 space-y-6">
          {/* Password */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Authentication
            </p>
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 sm:p-5 space-y-1">
              <p className="text-sm font-bold text-foreground">Account Password</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Passwords and authentication tokens are managed securely through tero
                gpu de malai IAM. To reset your password, sign out and use the{" "}
                <span className="font-semibold text-primary">Forgot Password</span> link on
                the login screen.
              </p>
            </div>
          </div>

          {/* Session Management */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Session Management
            </p>
            <div className="rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/50">
              {/* Sign out */}
              <div className="flex items-center justify-between gap-4 p-4 bg-secondary/30">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">Sign Out</p>
                  <p className="text-xs text-muted-foreground">
                    Sign out of your current browser session.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={handleLogout}
                  className="gap-2 shrink-0 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </Button>
              </div>

              {/* Sign out everywhere */}
              <div className="flex items-center justify-between gap-4 p-4 bg-secondary/30">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-foreground">
                    Sign Out Everywhere
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Terminate all active sessions across all devices.
                  </p>
                </div>
                <Button
                  variant="danger-soft"
                  size="sm"
                  onPress={() => setShowLogoutAllConfirm(true)}
                  isPending={logoutAllLoading}
                  className="gap-2 shrink-0 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{logoutAllLoading ? "Signing out..." : "Sign Out All"}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
              Danger Zone
            </p>
            <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-destructive">Delete Account</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Permanently delete your tero gpu de malai account and all associated data.
                  This action is irreversible.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onPress={() => setShowDeleteConfirm(true)}
                className="shrink-0 font-semibold"
              >
                Delete
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Confirm: Sign out all */}
      <ConfirmDialog
        open={showLogoutAllConfirm}
        title="Sign Out Everywhere?"
        description="This will terminate all active sessions on every device. You will need to sign in again."
        confirmLabel="Sign Out All"
        onConfirm={handleLogoutAll}
        onCancel={() => setShowLogoutAllConfirm(false)}
      />

      {/* Confirm: Delete account */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Account?"
        description="This action is permanent and cannot be undone. All your sessions, wallet balance, and account data will be permanently removed."
        confirmLabel="Delete Account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
