import React from "react";
import { KeyRound, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SecuritySection() {
  return (
    <Card className="bg-card border border-border shadow-corporate">
      <CardContent className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border/60">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">
            Security & Authentication
          </h3>
        </div>

        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-secondary/50 border border-border/60">
          <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground">
              Account Password
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your password and authentication tokens are managed securely through tero gpu de malai IAM. Password reset requests can be initiated from the login screen.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
