"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Check, ArrowRight, ArrowLeft, Cpu, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";

import { registerUser, RegisterPayload } from "@/services/api";

export default function RegisterPage() {
  const router = useRouter();

  // Step State (1-5, where 5 is success)
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  // Error State for fields
  const [errors, setErrors] = useState<Record<string, string>>({});
  // General server/submission error
  const [serverError, setServerError] = useState("");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Focus management
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (serverError) {
      setServerError("");
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, termsAccepted: checked }));
    if (errors.termsAccepted) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.termsAccepted;
        return next;
      });
    }
    if (serverError) {
      setServerError("");
    }
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (currentStep === 1) {
      const fName = formData.firstName.trim();
      const lName = formData.lastName.trim();

      if (!fName) {
        newErrors.firstName = "First name is required";
        isValid = false;
      } else if (fName.length < 2) {
        newErrors.firstName = "First name must be at least 2 characters";
        isValid = false;
      } else if (fName.length > 100) {
        newErrors.firstName = "First name must be 100 characters or fewer";
        isValid = false;
      }

      if (!lName) {
        newErrors.lastName = "Last name is required";
        isValid = false;
      } else if (lName.length < 2) {
        newErrors.lastName = "Last name must be at least 2 characters";
        isValid = false;
      } else if (lName.length > 100) {
        newErrors.lastName = "Last name must be 100 characters or fewer";
        isValid = false;
      }

      if (isValid) {
        setFormData((prev) => ({ ...prev, firstName: fName, lastName: lName }));
      }
    } else if (currentStep === 2) {
      const email = formData.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        newErrors.email = "Email is required";
        isValid = false;
      } else if (!emailRegex.test(email)) {
        newErrors.email = "Please enter a valid email address";
        isValid = false;
      } else if (email.length > 255) {
        newErrors.email = "Email must be 255 characters or fewer";
        isValid = false;
      }

      if (isValid) {
        setFormData((prev) => ({ ...prev, email: email.toLowerCase() }));
      }
    } else if (currentStep === 3) {
      if (!formData.password) {
        newErrors.password = "Password is required";
        isValid = false;
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
        isValid = false;
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
    } else if (currentStep === 4) {
      if (!formData.termsAccepted) {
        newErrors.termsAccepted = "You must accept the Terms of Service to continue";
        isValid = false;
      }
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
    setServerError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent, isFinalStep = false) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isFinalStep) {
        handleSubmit();
      } else {
        handleNext();
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    // Validate that earlier required fields are present
    const fName = formData.firstName.trim();
    const lName = formData.lastName.trim();
    if (!fName || !lName) {
      setStep(1);
      validateStep(1);
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail) {
      setStep(2);
      validateStep(2);
      return;
    }

    if (!formData.password) {
      setStep(3);
      validateStep(3);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStep(3);
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
      toast.error("Passwords do not match. Please verify your password.");
      return;
    }

    setIsLoading(true);
    setServerError("");

    try {
      const payload: RegisterPayload = {
        email: cleanEmail,
        first_name: fName,
        last_name: lName,
        role: "renter",
        password: formData.password,
        password2: formData.confirmPassword,
      };

      const res = await registerUser(payload);

      if (res.status === "success" || res.data?.user) {
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
        setErrors({});
        setServerError("");
        setStep(5);
        toast.success(res.message || "Account created successfully! Please log in.");
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<Record<string, unknown>>;
      const data = axiosErr.response?.data;
      const fieldErrors: Record<string, string> = {};
      let primaryMessage = "";

      if (data && typeof data === "object") {
        if (data.email) {
          const msg = Array.isArray(data.email) ? data.email.join(" ") : String(data.email);
          fieldErrors.email = msg;
          if (!primaryMessage) primaryMessage = msg;
        }
        if (data.password) {
          const msg = Array.isArray(data.password) ? data.password.join(" ") : String(data.password);
          fieldErrors.password = msg;
          if (!primaryMessage) primaryMessage = msg;
        }
        if (data.password2) {
          const msg = Array.isArray(data.password2) ? data.password2.join(" ") : String(data.password2);
          fieldErrors.confirmPassword = msg;
          if (!primaryMessage) primaryMessage = msg;
        }
        if (data.first_name) {
          const msg = Array.isArray(data.first_name) ? data.first_name.join(" ") : String(data.first_name);
          fieldErrors.firstName = msg;
          if (!primaryMessage) primaryMessage = msg;
        }
        if (data.last_name) {
          const msg = Array.isArray(data.last_name) ? data.last_name.join(" ") : String(data.last_name);
          fieldErrors.lastName = msg;
          if (!primaryMessage) primaryMessage = msg;
        }
        if (data.role) {
          const msg = Array.isArray(data.role) ? data.role.join(" ") : String(data.role);
          if (!primaryMessage) primaryMessage = msg;
        }
        if (data.non_field_errors) {
          const msg = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(" ") : String(data.non_field_errors);
          if (!primaryMessage) primaryMessage = msg;
        }
        if (typeof data.detail === "string" && !primaryMessage) {
          primaryMessage = data.detail;
        }
        if (typeof data.message === "string" && !primaryMessage) {
          primaryMessage = data.message;
        }
      }

      if (!axiosErr.response) {
        primaryMessage = "Unable to connect to the compute service. Please check your network and try again.";
      } else if (!primaryMessage) {
        if (axiosErr.response.status >= 500) {
          primaryMessage = "Server error while creating your account. Please try again in a moment.";
        } else {
          primaryMessage = "Registration failed. Please check the provided details and try again.";
        }
      }

      setErrors(fieldErrors);
      setServerError(primaryMessage);
      toast.error(primaryMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const steps = [
    { num: 1, label: "About You" },
    { num: 2, label: "Email" },
    { num: 3, label: "Password" },
    { num: 4, label: "Review" },
  ];

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
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sign up for tero gpu de malai
          </p>
        </div>

        {/* Progress Step Dots */}
        {step < 5 && (
          <div className="flex items-center justify-between relative px-1 py-1">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[2px] bg-border -z-10" />

            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs",
                    step === s.num
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-105"
                      : step > s.num
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground border border-border"
                  )}
                >
                  {step > s.num ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1.5 font-semibold",
                    step >= s.num ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* HeroUI-Inspired Multi-Step Form */}
        <div className="flex w-full flex-col gap-4">
          {/* Step 1: Name */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  ref={firstInputRef}
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <span className="text-xs font-medium text-destructive mt-0.5 animate-in fade-in duration-150">
                    {errors.firstName}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <span className="text-xs font-medium text-destructive mt-0.5 animate-in fade-in duration-150">
                    {errors.lastName}
                  </span>
                )}
              </div>

              <Button
                variant="primary"
                size="md"
                fullWidth
                onPress={handleNext}
                className="h-11 rounded-xl font-semibold shadow-sm mt-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Email */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  ref={firstInputRef}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <span className="text-xs font-medium text-destructive mt-0.5 animate-in fade-in duration-150">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="tertiary"
                  size="md"
                  isIconOnly
                  onPress={handleBack}
                  aria-label="Previous step"
                  className="h-11 px-4 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onPress={handleNext}
                  className="flex-1 h-11 rounded-xl font-semibold shadow-sm"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    ref={firstInputRef}
                    aria-invalid={!!errors.password}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  Must be at least 8 characters with 1 uppercase and 1 number
                </p>
                {errors.password && (
                  <span className="text-xs font-medium text-destructive mt-0.5 animate-in fade-in duration-150">
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <span className="text-xs font-medium text-destructive mt-0.5 animate-in fade-in duration-150">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="tertiary"
                  size="md"
                  isIconOnly
                  onPress={handleBack}
                  aria-label="Previous step"
                  className="h-11 px-4 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onPress={handleNext}
                  className="flex-1 h-11 rounded-xl font-semibold shadow-sm"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Terms */}
          {step === 4 && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              {serverError && (
                <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold leading-snug">{serverError}</p>
                    {errors.email && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-xs text-primary underline font-medium hover:opacity-80 cursor-pointer"
                        >
                          Edit email address
                        </button>
                        <span className="text-muted-foreground">•</span>
                        <Link
                          href={`/login?email=${encodeURIComponent(formData.email)}`}
                          className="text-xs text-primary underline font-medium hover:opacity-80"
                        >
                          Log in instead
                        </Link>
                      </div>
                    )}
                    {errors.password && (
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="text-xs text-primary underline font-medium hover:opacity-80 cursor-pointer pt-0.5 block"
                      >
                        Change password
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-secondary/40 p-4 rounded-xl space-y-2.5 border border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Name
                    </div>
                    <div className="font-bold text-sm text-foreground">
                      {formData.firstName} {formData.lastName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
                <div className="h-px bg-border/40" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Email
                    </div>
                    <div className="font-bold text-sm text-foreground font-mono">
                      {formData.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2.5 pt-1">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={handleCheckboxChange}
                  className="mt-0.5"
                />
                <div className="space-y-1 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-xs font-normal cursor-pointer leading-relaxed text-muted-foreground"
                  >
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary hover:underline font-semibold">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline font-semibold">
                      Privacy Policy
                    </Link>
                  </Label>
                  {errors.termsAccepted && (
                    <p className="text-xs text-destructive font-semibold mt-1">
                      {errors.termsAccepted}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="tertiary"
                  size="md"
                  isIconOnly
                  onPress={handleBack}
                  isDisabled={isLoading}
                  aria-label="Previous step"
                  className="h-11 px-4 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  isPending={isLoading}
                  isDisabled={isLoading}
                  onPress={handleSubmit}
                  className="flex-1 h-11 rounded-xl font-semibold shadow-sm"
                >
                  <span>{isLoading ? "Creating account..." : "Create Account"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="flex flex-col items-center text-center gap-4 py-4 animate-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center shadow-xs">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                  Account Created
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  Welcome to tero gpu de malai, {formData.firstName}. Your account has been registered successfully. Please proceed to login with your credentials.
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                fullWidth
                onPress={() => router.push(formData.email ? `/login?email=${encodeURIComponent(formData.email)}` : "/login")}
                className="h-11 rounded-xl font-semibold shadow-sm mt-2"
              >
                Proceed to Log In
              </Button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step < 5 && (
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Already have an account?</p>
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline block"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
