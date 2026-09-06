"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { UserProfile } from "@/types/user";
import { getProfile } from "@/services/profile";
import { ProfileOverview } from "@/components/profile/profile-overview";
import { PersonalInformation } from "@/components/profile/personal-information";
import { AccountInformation } from "@/components/profile/account-information";
import { SecuritySection } from "@/components/profile/security-section";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err: unknown) {
      console.error("Failed to load profile:", err);
      setError("We couldn't retrieve your account details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getProfile()
      .then((data) => {
        if (isMounted) {
          setProfile(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          console.error("Failed to load profile:", err);
          setError("We couldn't retrieve your account details. Please try again.");
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleProfileUpdated = (updated: UserProfile) => {
    setProfile(updated);
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-card rounded-2xl border border-border/80 max-w-md mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            Unable to load profile
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error || "We couldn't retrieve your account details. Please try again."}
          </p>
        </div>
        <Button
          onClick={() => fetchProfileData()}
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
            Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal account information.
          </p>
        </div>
      </div>

      {/* 2. Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Profile Overview */}
        <div className="md:col-span-1">
          <ProfileOverview profile={profile} />
        </div>

        {/* Right Column: Personal Information, Account Info, Security */}
        <div className="md:col-span-2 space-y-6">
          <PersonalInformation
            profile={profile}
            onProfileUpdated={handleProfileUpdated}
          />
          <AccountInformation profile={profile} />
          <SecuritySection />
        </div>
      </div>
    </div>
  );
}
