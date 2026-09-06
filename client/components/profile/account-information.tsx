import React from "react";
import { UserProfile } from "@/types/user";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Shield } from "lucide-react";

interface AccountInformationProps {
  profile: UserProfile;
}

function formatMemberSince(dateStr?: string): string {
  if (!dateStr) return "Active Member";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Active Member";
  }
}

export function AccountInformation({ profile }: AccountInformationProps) {
  const memberSince = formatMemberSince(profile.createdAt);

  return (
    <Card className="bg-card border border-border shadow-corporate">
      <CardContent className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">
            Account Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-secondary/50 border border-border/60 space-y-1">
            <span className="text-muted-foreground uppercase text-[10px] font-semibold tracking-wider block">
              Account Type
            </span>
            <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
              <span className="capitalize">{profile.role || "Renter"}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/50 border border-border/60 space-y-1">
            <span className="text-muted-foreground uppercase text-[10px] font-semibold tracking-wider block">
              Member Since
            </span>
            <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{memberSince}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
