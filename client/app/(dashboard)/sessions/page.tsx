"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SessionDetail } from "@/types/session";
import { getSessions, stopSession } from "@/services/sessions";
import { ActiveSessionCard } from "@/components/sessions/active-session-card";
import { SessionHistoryTable } from "@/components/sessions/session-history-table";
import { StopSessionDialog } from "@/components/sessions/stop-session-dialog";
import { SessionsSkeleton } from "@/components/sessions/sessions-skeleton";
import { SessionsEmptyState } from "@/components/sessions/sessions-empty-state";
import { Button } from "@/components/ui/button";

export function SessionsPage() {
  const [sessions, setSessions] = useState<SessionDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Stop Session Dialog State
  const [stoppingSession, setStoppingSession] = useState<SessionDetail | null>(null);

  const fetchSessionData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err: unknown) {
      console.error("Failed to load sessions:", err);
      setError("Something went wrong while retrieving your rental sessions.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getSessions()
      .then((data) => {
        if (isMounted) {
          setSessions(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          console.error("Failed to load sessions:", err);
          setError("Something went wrong while retrieving your rental sessions.");
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStopClick = (session: SessionDetail) => {
    setStoppingSession(session);
  };

  const handleConfirmStop = async (sessionId: string) => {
    try {
      const res = await stopSession(sessionId);
      if (res.success) {
        toast.success("Session stopped successfully. Final billing has been settled.");
        // Refetch or update local state
        await fetchSessionData(true);
      }
    } catch (err: unknown) {
      console.error("Failed to stop session:", err);
      toast.error("Unable to stop session. Please try again or contact support.");
      throw err;
    }
  };

  if (isLoading) {
    return <SessionsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-card rounded-2xl border border-border/80 max-w-xl mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            Unable to load your sessions
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {error}
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          onPress={() => fetchSessionData()}
          className="gap-2 font-medium mt-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  // Active / Preparing / Pending session takes highest priority
  const activeSession =
    sessions.find(
      (s) =>
        s.status === "active" ||
        s.status === "pending" ||
        s.status === "preparing" ||
        s.status === "stopping"
    ) || null;

  // Past sessions (completed, stopped, cancelled, failed)
  const historySessions = sessions.filter(
    (s) => s.id !== activeSession?.id
  );

  const hasAnySessions = sessions.length > 0;

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-6xl mx-auto w-full">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your GPU rentals and view your session history.
          </p>
        </div>

        {hasAnySessions && (
          <Button
            variant="secondary"
            size="sm"
            onPress={() => fetchSessionData(true)}
            isPending={isRefreshing}
            className="self-start sm:self-auto gap-2 font-semibold"
            aria-label="Refresh sessions"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        )}
      </div>

      {!hasAnySessions ? (
        /* 4. Overall Empty State */
        <SessionsEmptyState />
      ) : (
        <>
          {/* 2. Active Session Section */}
          <section aria-labelledby="active-session-heading">
            <h2 id="active-session-heading" className="sr-only">
              Active GPU Session
            </h2>
            <ActiveSessionCard
              session={activeSession}
              onStopClick={handleStopClick}
            />
          </section>

          {/* 3. Session History Section */}
          {historySessions.length > 0 && (
            <section aria-labelledby="session-history-heading">
              <h2 id="session-history-heading" className="sr-only">
                Session History
              </h2>
              <SessionHistoryTable sessions={historySessions} />
            </section>
          )}
        </>
      )}

      {/* 5. Stop Session Confirmation Dialog */}
      <StopSessionDialog
        isOpen={!!stoppingSession}
        onClose={() => setStoppingSession(null)}
        session={stoppingSession}
        onConfirmStop={handleConfirmStop}
      />
    </div>
  );
}

export default SessionsPage;
