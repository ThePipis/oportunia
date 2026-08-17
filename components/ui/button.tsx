"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/50 focus-visible:ring-orange-400",
        secondary:
          "bg-sky-500/15 text-sky-300 border border-sky-400/30 hover:bg-sky-500 hover:text-slate-950 focus-visible:ring-sky-400",
        outline:
          "border border-white/20 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white focus-visible:ring-sky-400",
        ghost:
          "text-slate-300 hover:bg-white/5 hover:text-white focus-visible:ring-sky-400",
        destructive:
          "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white focus-visible:ring-red-400",
        link: "text-sky-400 underline-offset-4 hover:underline focus-visible:ring-sky-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
