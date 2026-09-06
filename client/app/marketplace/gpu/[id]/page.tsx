"use client";

import React, { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { getGpuById } from "@/services/api";
import { createSession } from "@/services/sessions";
import { MarketplaceGPU } from "@/types/gpu";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Cpu,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function GpuDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { isAuthenticated } = useAuthStore();
  const isMounted = useIsMounted();

  const [gpu, setGpu] = useState<MarketplaceGPU | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRentModalOpen, setIsRentModalOpen] = useState<boolean>(false);
  const [durationHours, setDurationHours] = useState<number>(1);
  const [isRenting, setIsRenting] = useState<boolean>(false);
  const [rentalError, setRentalError] = useState<string | null>(null);

  const fetchDetails = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    getGpuById(id)
      .then((data) => {
        if (!data) {
          setError("GPU instance not found on the network.");
        } else {
          setGpu(data);
        }
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Unable to retrieve GPU details.";
        setError(msg);
        setIsLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let isMountedFlag = true;
    getGpuById(id)
      .then((data) => {
        if (isMountedFlag) {
          if (!data) {
            setError("GPU instance not found on the network.");
          } else {
            setGpu(data);
          }
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMountedFlag) {
          const msg =
            err instanceof Error ? err.message : "Unable to retrieve GPU details.";
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMountedFlag = false;
    };
  }, [id]);

  const handleRentClick = () => {
    if (!isAuthenticated) {
      // Redirect guest to login and remember intended destination
      router.push(`/login?redirect=${encodeURIComponent(`/marketplace/gpu/${id}`)}`);
      return;
    }

    // Authenticated user can proceed to rental confirmation
    setRentalError(null);
    setIsRentModalOpen(true);
  };

  const handleConfirmRental = async () => {
    if (!gpu) return;
    setIsRenting(true);
    setRentalError(null);

    try {
      const session = await createSession({
        gpu_id: String(gpu.id),
        duration_hours: durationHours,
        work_protection: false,
      });

      toast.success("GPU rental session created successfully!");
      setIsRentModalOpen(false);

      if (session?.id) {
        router.push(`/sessions/${session.id}`);
      } else {
        router.push("/sessions");
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { message?: string; detail?: string; error?: string };
        };
      };
      const resData = axiosErr.response?.data;
      const status = axiosErr.response?.status;
      let msg = "Failed to create rental session. Please try again.";

      if (resData) {
        if (typeof resData.message === "string") msg = resData.message;
        else if (typeof resData.detail === "string") msg = resData.detail;
        else if (typeof resData.error === "string") msg = resData.error;
      }

      setRentalError(msg);

      if (status === 400 && msg.toLowerCase().includes("balance")) {
        toast.error("Insufficient wallet balance for this rental.", {
          action: {
            label: "Go to Wallet",
            onClick: () => router.push("/wallet"),
          },
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setIsRenting(false);
    }
  };

  const isAvailable = gpu?.availability === "available";

  const detailsBody = (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 w-full pb-12">
      {/* Back to Marketplace */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      {/* Loading State */}
      {isLoading && (
        <Card variant="default" className="p-12 flex flex-col items-center justify-center min-h-[320px] gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading GPU instance details...</p>
        </Card>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <Card variant="default" className="border-destructive/20 p-8 flex flex-col items-center justify-center min-h-[320px] text-center">
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Instance Unavailable</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">{error}</p>
          <Button
            variant="secondary"
            onPress={fetchDetails}
            className="gap-2 font-semibold shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </Button>
        </Card>
      )}

      {/* Details Card */}
      {!isLoading && !error && gpu && (
        <div className="flex flex-col gap-6">
          {/* Header & Main Info Card */}
          <Card variant="default" className="p-6 sm:p-8">
            <Card.Header className="p-0 pb-6 flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 space-y-0">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-primary border border-primary/20 shrink-0 shadow-xs">
                  <Cpu className="w-7 h-7" />
                </div>
                <div>
                  <Card.Title className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {gpu.name}
                  </Card.Title>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {gpu.location}
                    </span>
                    <span>&bull;</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Provider Online</span>
                  </div>
                </div>
              </div>

              <span
                className={`inline-flex items-center self-start sm:self-center text-xs font-semibold px-3 py-1 rounded-full border ${
                  isAvailable
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${
                    isAvailable
                      ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                      : "bg-amber-500"
                  }`}
                />
                {isAvailable ? "Available for Rental" : gpu.availability}
              </span>
            </Card.Header>

            <Card.Content className="p-0">
              {/* Grid of Verified Properties */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/60">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-1">
                    VRAM Capacity
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {gpu.vram} GB
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50 border border-border/60">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-1">
                    Compute Location
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {gpu.location}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50 border border-border/60">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-1">
                    Hourly Rate
                  </span>
                  <span className="text-xl font-bold text-foreground font-mono">
                    NPR {gpu.pricePerHour.toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground ml-1">/ hr</span>
                  </span>
                </div>
              </div>

              {/* Security and Provisioning notes */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3 mb-6">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-foreground/80 leading-relaxed">
                  <strong className="text-foreground">Direct SSH Provisioning:</strong> Session credentials and relay-port routing are allocated automatically upon rental confirmation. Wallet balance is deducted hourly based on active duration.
                </div>
              </div>
            </Card.Content>

            {/* Action CTA Footer */}
            <Card.Footer className="p-0 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-mono">
                  NPR {gpu.pricePerHour.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground font-medium">/ hour</span>
              </div>

              <Button
                variant="primary"
                size="lg"
                isDisabled={!isAvailable}
                onPress={handleRentClick}
                className="w-full sm:w-auto px-8 gap-2 font-semibold shadow-sm"
              >
                <Zap className="w-4 h-4" />
                <span>{isAvailable ? "Rent GPU" : "Currently In Use"}</span>
              </Button>
            </Card.Footer>
          </Card>
        </div>
      )}

      {/* Rental Confirmation Modal for Authenticated Users */}
      {isRentModalOpen && gpu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card variant="default" className="w-full max-w-md p-6 shadow-2xl space-y-5">
            <Card.Header className="p-0 pb-3 flex-row items-center gap-3 border-b border-border space-y-0">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <Card.Title className="text-lg font-bold">Confirm Rental Session</Card.Title>
                <Card.Description className="text-xs">Initiate instance provisioning</Card.Description>
              </div>
            </Card.Header>

            <Card.Content className="p-0 space-y-3 my-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>GPU Model:</span>
                <span className="font-semibold text-foreground">{gpu.name}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>VRAM:</span>
                <span className="font-semibold text-foreground">{gpu.vram} GB</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Location:</span>
                <span className="font-semibold text-foreground">{gpu.location}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Duration:</span>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  disabled={isRenting}
                  className="bg-muted/50 border border-border rounded-lg px-2.5 py-1 text-sm font-semibold text-foreground cursor-pointer"
                >
                  {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => (
                    <option key={h} value={h}>
                      {h} {h === 1 ? "hour" : "hours"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between text-muted-foreground pt-2 border-t border-border/60">
                <span>Hourly Rate:</span>
                <span className="font-bold text-foreground font-mono">NPR {gpu.pricePerHour} / hr</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Estimated Cost:</span>
                <span className="font-bold text-primary font-mono text-base">
                  NPR {(gpu.pricePerHour * durationHours).toFixed(2)}
                </span>
              </div>

              {rentalError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
                  <p>{rentalError}</p>
                  {rentalError.toLowerCase().includes("balance") && (
                    <Link
                      href="/wallet"
                      className="inline-block text-xs font-semibold underline hover:text-destructive/80"
                    >
                      Deposit Funds in Wallet &rarr;
                    </Link>
                  )}
                </div>
              )}
            </Card.Content>

            <Card.Footer className="p-0 pt-2 flex gap-3">
              <Button
                variant="tertiary"
                onPress={() => {
                  setIsRentModalOpen(false);
                  setRentalError(null);
                }}
                isDisabled={isRenting}
                className="flex-1 font-semibold"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleConfirmRental}
                isPending={isRenting}
                isDisabled={isRenting}
                className="flex-1 font-semibold"
              >
                Confirm Rental
              </Button>
            </Card.Footer>
          </Card>
        </div>
      )}
    </div>
  );

  // Authenticated Mode: Render inside DashboardLayout with Sidebar & Header
  if (isMounted && isAuthenticated) {
    return <DashboardLayout>{detailsBody}</DashboardLayout>;
  }

  // Public / Guest Mode: Render with Website Navbar and Footer
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-10 py-10">
        {detailsBody}
      </main>
      <Footer />
    </div>
  );
}
