import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--forest)] text-[var(--primary-foreground)]",
        secondary:
          "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
        outline: "border-[var(--border)] text-[var(--muted-foreground)] bg-transparent",
        gold: "border-[#B8864B]/30 bg-[#B8864B]/10 text-[#8B6028] dark:text-[#E2B980]",
        forest: "border-[#244B38]/20 bg-[#244B38]/10 text-[#244B38] dark:text-[#82A27A]",
        leaf: "border-[#72916A]/25 bg-[#72916A]/10 text-[#244B38] dark:text-[#9EC495]",
        danger: "border-red-600/20 bg-red-600/10 text-red-700 dark:text-red-300",
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
