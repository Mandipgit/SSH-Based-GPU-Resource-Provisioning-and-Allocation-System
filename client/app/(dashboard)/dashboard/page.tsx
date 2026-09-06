"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActiveSessionSection } from "@/components/dashboard/active-session-section";
import { RecentSessions } from "@/components/dashboard/recent-sessions";
import { AvailableGpus } from "@/components/dashboard/available-gpus";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { getWalletBalance, getSessions, getAvailableGpus } from "@/services/api";
import { Session, GPU, Wallet } from "@/types";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [availableGpus, setAvailableGpus] = useState<GPU[]>([]);
  const [gpusDict, setGpusDict] = useState<Record<string, GPU>>({});

  const fetchData = () => {
    setIsLoading(true);
    setError(null);
    
    Promise.all([
      getWalletBalance(),
      getSessions(),
      getAvailableGpus()
    ])
      .then(([walletData, sessionsData, gpusData]) => {
        setWallet(walletData);
        setSessions(sessionsData);
        setAvailableGpus(gpusData.slice(0, 3));

        const dict: Record<string, GPU> = {};
        gpusData.forEach(g => dict[g.id] = g);
        
        setGpusDict(dict);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setError("Something went wrong while retrieving your compute information.");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getWalletBalance(),
      getSessions(),
      getAvailableGpus()
    ])
      .then(([walletData, sessionsData, gpusData]) => {
        if (isMounted) {
          setWallet(walletData);
          setSessions(sessionsData);
          setAvailableGpus(gpusData.slice(0, 3));

          const dict: Record<string, GPU> = {};
          gpusData.forEach(g => dict[g.id] = g);
          
          setGpusDict(dict);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Dashboard fetch error:", err);
          setError("Something went wrong while retrieving your compute information.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-card rounded-xl border border-border">
        <h2 className="text-xl font-bold text-foreground mb-2">Unable to load your dashboard.</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button onClick={fetchData} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Try Again
        </Button>
      </div>
    );
  }

  const activeSession = sessions.find(s => s.status === "active" || s.status === "pending") || null;
  const recentSessions = sessions.filter(s => s.status === "completed" || s.status === "failed").slice(0, 5);
  const activeGpu = activeSession ? (gpusDict[activeSession.gpuId] || null) : null;

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-6xl mx-auto w-full">
      <DashboardHeader />
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          label="Wallet Balance" 
          value={wallet ? `${wallet.currency} ${wallet.balance.toLocaleString()}` : "—"} 
          sub="Click to add funds" 
          warn={wallet ? wallet.balance < 500 : false}
        />
        <StatCard 
          label="Active Session" 
          value={activeSession ? "1" : "0"} 
          sub={activeSession ? `${activeGpu?.model || 'Compute Instance'} · Running` : "No running instance"} 
          accent={!!activeSession}
        />
        <StatCard 
          label="Total Sessions" 
          value={sessions.length.toString()} 
          sub="All time" 
        />
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <ActiveSessionSection session={activeSession} gpu={activeGpu} />
        </div>
        <div className="lg:col-span-2">
          <AvailableGpus gpus={availableGpus} />
        </div>
      </div>

      {/* Bottom Content Row */}
      <div className="grid grid-cols-1 gap-4">
        <div className="w-full">
          <RecentSessions 
            sessions={recentSessions} 
            getGpuModel={(id) => gpusDict[id]?.model || "Unknown GPU"} 
          />
        </div>
      </div>
    </div>
  );
}

