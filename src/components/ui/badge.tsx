import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--forest)] text-[var(--primary-foreground)]",
        secondary:
          "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
        outline: "border-[var(--border)] text-[var(--muted-foreground)]",
        gold: "border-[var(--gold)]/30 bg-[var(--gold)]/10 text-[var(--gold)] dark:text-[#D4A76A]",
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
