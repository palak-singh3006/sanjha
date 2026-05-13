import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]",
        secondary:
          "border-[var(--foreground)]/15 bg-[var(--foreground)]/8 text-[var(--foreground)]/90",
        outline: "border-[var(--foreground)]/20 text-[var(--foreground)]/85",
        gold: "border-transparent bg-[var(--gold)]/90 text-[var(--forest)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
