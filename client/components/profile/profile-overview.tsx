"use client";

import React from "react";
import { UserProfile } from "@/types/user";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

interface ProfileOverviewProps {
  profile: UserProfile;
}

function getInitials(firstName: string, lastName: string, name?: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return "RC";
}

export function ProfileOverview({ profile }: ProfileOverviewProps) {
  const initials = getInitials(profile.firstName, profile.lastName, profile.name);
  const displayName = profile.name || `${profile.firstName} ${profile.lastName}`.trim() || "Renter";

  return (
    <Card className="bg-card border border-border shadow-corporate relative overflow-hidden">
      <CardContent className="p-6 flex flex-col items-center text-center">
        {/* Avatar with generated initials */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 border-2 border-white/20 flex items-center justify-center text-white font-extrabold text-2xl font-sans shadow-md">
            {initials}
          </div>
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center text-white shadow-xs" title="Account Active">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* User Identity Details */}
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          {displayName}
        </h2>
        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-full">
          {profile.email}
        </p>

        {/* Account Role Badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="capitalize">{profile.role || "Renter"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
