"use client";

import React, { useState } from "react";
import { Info, Save, User } from "lucide-react";
import { UserProfile } from "@/types/user";
import { updateProfile } from "@/services/profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PersonalInformationProps {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

export function PersonalInformation({
  profile,
  onProfileUpdated,
}: PersonalInformationProps) {
  const [firstName, setFirstName] = useState(profile.firstName || "");
  const [lastName, setLastName] = useState(profile.lastName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
  }

  const hasChanges =
    firstName.trim() !== (profile.firstName || "").trim() ||
    lastName.trim() !== (profile.lastName || "").trim();

  const validate = () => {
    const newErrors: { firstName?: string; lastName?: string } = {};
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (!trimmedFirst) {
      newErrors.firstName = "First name is required.";
    } else if (trimmedFirst.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters.";
    }

    if (!trimmedLast) {
      newErrors.lastName = "Last name is required.";
    } else if (trimmedLast.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!hasChanges) return;

    try {
      setIsSubmitting(true);
      const res = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (res.success) {
        toast.success("Profile information updated successfully.");
        onProfileUpdated(res.profile);
      }
    } catch (err: unknown) {
      console.error("Profile update error:", err);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card variant="default">
      <Card.Header className="p-6 sm:p-8 pb-4 flex-row items-center gap-2.5 border-b border-border/60 space-y-0">
        <User className="w-5 h-5 text-primary" />
        <div>
          <Card.Title className="text-base font-bold">
            Personal Information
          </Card.Title>
          <Card.Description className="text-xs mt-0.5">
            Update your account details and display name.
          </Card.Description>
        </div>
      </Card.Header>

      <Card.Content className="p-6 sm:p-8 pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                disabled={isSubmitting}
                className="h-10"
              />
              {errors.firstName && (
                <p className="text-xs text-destructive font-semibold">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                disabled={isSubmitting}
                className="h-10"
              />
              {errors.lastName && (
                <p className="text-xs text-destructive font-semibold">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              readOnly
              disabled
              className="h-10 bg-secondary/60 text-muted-foreground cursor-not-allowed border-dashed"
            />
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
              <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>Email is associated with your account identity and cannot be modified.</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isPending={isSubmitting}
              isDisabled={!hasChanges}
              className="font-semibold px-6 gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}
