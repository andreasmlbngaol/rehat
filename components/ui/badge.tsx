import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const badgeVariants = cva(
  "inline-flex h-7 w-fit shrink-0 items-center justify-center gap-1.5 rounded-[5px] border border-transparent px-2 py-1 text-[12px] leading-[19px] font-medium whitespace-nowrap transition-colors [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-[#f1f4f1] text-[#59645f] dark:bg-muted dark:text-muted-foreground",
        destructive: "bg-[#faeded] text-[#9b3f3f] dark:bg-destructive/15 dark:text-destructive",
        outline: "border-[#dce2de] bg-transparent text-[#59645f] dark:border-border dark:text-foreground",
        success: "bg-[#eaf4ec] text-[#306242] dark:bg-emerald-500/15 dark:text-emerald-300",
        warning: "bg-[#f8f0dc] text-[#86651f] dark:bg-amber-500/15 dark:text-amber-300",
        info: "bg-[#edf1f8] text-[#496386] dark:bg-blue-500/15 dark:text-blue-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
