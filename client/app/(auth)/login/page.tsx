"use client";

import React, { Suspense, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cpu } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";

function LoginForm() {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailTrimmed) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(emailTrimmed)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await api.post("/auth/login/", {
        email: email.trim().toLowerCase(),
        password,
      });

      const resData = response.data?.data ?? response.data;
      const accessToken = resData.access_token ?? resData.token;
      const refreshToken = resData.refresh_token;
      const userRaw = resData.user ?? resData;

      const user = {
        id: String(userRaw.id || ""),
        email: String(userRaw.email || email.trim()),
        name: userRaw.name || `${userRaw.first_name || ""} ${userRaw.last_name || ""}`.trim() || "Renter",
        firstName: userRaw.first_name,
        lastName: userRaw.last_name,
        role: (userRaw.role === "host" ? "host" : "renter") as "renter" | "host",
      };

      setAuth(user, accessToken, refreshToken);

      toast.success("Signed in successfully.");
      router.push(redirectUrl);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          data?: Record<string, string | string[]>;
        };
      };
      const data = axiosErr.response?.data;
      let errorMsg = "Failed to sign in. Please check your credentials.";
      if (data) {
        if (typeof data.message === "string") {
          errorMsg = data.message;
        } else if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (data.non_field_errors) {
          errorMsg = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : String(data.non_field_errors);
        } else if (data.email) {
          errorMsg = Array.isArray(data.email) ? data.email[0] : String(data.email);
        } else if (data.password) {
          errorMsg = Array.isArray(data.password) ? data.password[0] : String(data.password);
        }
      }
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-background">
      <div className="w-full max-w-sm sm:w-96 flex flex-col gap-6">
        {/* Brand & Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-extrabold text-xl text-foreground tracking-tight mb-2"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Cpu className="h-5 w-5" />
            </div>
            <span>tero gpu de malai</span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sign in to tero gpu de malai
          </p>
        </div>

        {/* HeroUI-Inspired Form */}
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              disabled={isLoading}
              aria-invalid={!!errors.email}
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <span className="text-xs font-medium text-destructive mt-0.5 animate-in fade-in duration-150">
                {errors.email}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              disabled={isLoading}
              aria-invalid={!!errors.password}
              autoComplete="current-password"
            />
            {errors.password && (
              <span className="text-xs font-medium text-destructive mt-0.5 animate-in fade-in duration-150">
                {errors.password}
              </span>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              isPending={isLoading}
              className="h-11 rounded-xl text-sm font-semibold shadow-sm"
            >
              <span>{isLoading ? "Signing in..." : "Login"}</span>
            </Button>
          </div>
        </form>

        {/* Footer Navigation */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Don&apos;t have an account?</p>
          <Link
            href="/register"
            className="text-primary font-semibold hover:underline block"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-medium">Loading login...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
