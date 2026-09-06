"use client";

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap outline-none select-none transition-all duration-200 ease-out active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[#006FEE] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:scale-100 cursor-pointer aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "border border-transparent bg-[#006FEE] hover:bg-[#005bc4] text-white shadow-md shadow-[#006FEE]/25 font-semibold",
        solid:
          "border border-transparent bg-[#006FEE] hover:bg-[#005bc4] text-white shadow-md shadow-[#006FEE]/25 font-semibold",
        default:
          "border border-transparent bg-[#006FEE] hover:bg-[#005bc4] text-white shadow-md shadow-[#006FEE]/25 font-semibold",
        secondary:
          "border border-border/60 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        tertiary:
          "border border-transparent bg-secondary/40 text-foreground hover:bg-secondary/80 font-medium",
        outline:
          "border border-border bg-card hover:bg-secondary text-foreground hover:text-foreground shadow-xs",
        bordered:
          "border border-border bg-card hover:bg-secondary text-foreground hover:text-foreground shadow-xs",
        ghost:
          "border border-transparent hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-medium",
        light:
          "border border-transparent hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-medium",
        flat:
          "border border-transparent bg-[#006FEE]/15 text-[#006FEE] hover:bg-[#006FEE]/25 font-medium",
        danger:
          "border border-transparent bg-[#F31260] hover:bg-[#E00E55] text-white shadow-sm shadow-[#F31260]/25 font-semibold",
        destructive:
          "border border-transparent bg-[#F31260] hover:bg-[#E00E55] text-white shadow-sm shadow-[#F31260]/25 font-semibold",
        "danger-soft":
          "border border-[#F31260]/20 bg-[#F31260]/10 text-[#F31260] hover:bg-[#F31260]/20",
        "destructive-soft":
          "border border-[#F31260]/20 bg-[#F31260]/10 text-[#F31260] hover:bg-[#F31260]/20",
        link: "border-transparent text-[#006FEE] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-5 py-2 text-sm",
        md: "h-10 gap-2 px-5 py-2 text-sm",
        sm: "h-8 gap-1.5 px-3.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2.5 px-7 text-base font-semibold",
        xs: "h-7 gap-1 px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12 p-0 [&_svg:not([class*='size-'])]:size-5",
        "icon-xs": "size-7 p-0 [&_svg:not([class*='size-'])]:size-3",
      },
      radius: {
        full: "rounded-full",
        lg: "rounded-2xl",
        md: "rounded-xl",
        sm: "rounded-lg",
        none: "rounded-none",
      },
      color: {
        default: "",
        primary: "border-transparent bg-[#006FEE] hover:bg-[#005bc4] text-white shadow-md shadow-[#006FEE]/25",
        secondary: "border-border/60 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success: "border-transparent bg-[#17C964] hover:bg-[#13A352] text-white",
        warning: "border-transparent bg-[#F5A524] hover:bg-[#D48B1B] text-white",
        danger: "border-transparent bg-[#F31260] hover:bg-[#E00E55] text-white shadow-sm shadow-[#F31260]/25",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      radius: "full",
    },
  }
);

export interface ButtonProps
  extends Omit<ButtonPrimitive.Props, "size" | "color">,
    VariantProps<typeof buttonVariants> {
  isIconOnly?: boolean;
  isPending?: boolean;
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  onPress?: React.MouseEventHandler<HTMLButtonElement>;
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  radius?: "full" | "lg" | "md" | "sm" | "none";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      color,
      radius = "full",
      size = "md",
      isIconOnly = false,
      isPending = false,
      isLoading = false,
      isDisabled = false,
      fullWidth = false,
      onPress,
      onClick,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const pending = isPending || isLoading;
    const effectiveDisabled = isDisabled || disabled || pending;

    // Map size if icon only
    let effectiveSize = size;
    if (isIconOnly) {
      if (size === "sm" || size === "xs") effectiveSize = "icon-sm";
      else if (size === "lg") effectiveSize = "icon-lg";
      else effectiveSize = "icon";
    }

    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        data-pending={pending ? "true" : undefined}
        disabled={effectiveDisabled}
        onClick={onPress || onClick}
        className={cn(
          buttonVariants({
            variant: variant as VariantProps<typeof buttonVariants>["variant"],
            size: effectiveSize as VariantProps<typeof buttonVariants>["size"],
            radius,
            color: color as VariantProps<typeof buttonVariants>["color"],
          }),
          fullWidth && "w-full",
          pending && "pointer-events-none opacity-80",
          className
        )}
        {...props}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin shrink-0" />
            {children}
          </>
        ) : (
          children
        )}
      </ButtonPrimitive>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };

