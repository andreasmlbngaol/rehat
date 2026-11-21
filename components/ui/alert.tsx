import * as React from "react";
import { cn } from "cn";
import { WarningCircle, CheckCircle, Info } from "@phosphor-icons/react/dist/ssr";

const styles = {
  info: "border-[#c9d5e8] bg-[#edf1f8] text-[#496386] dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
  success:
    "border-[#c7e3cf] bg-[#eaf4ec] text-[#306242] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  warning:
    "border-[#ead9a8] bg-[#f8f0dc] text-[#86651f] dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  destructive:
    "border-[#ebc3c3] bg-[#faeded] text-[#9b3f3f] dark:border-destructive/30 dark:bg-destructive/10 dark:text-red-300",
};

const icons = {
  info: Info,
  success: CheckCircle,
  warning: WarningCircle,
  destructive: WarningCircle,
};

function Alert({
  className,
  variant = "info",
  children,
  ...props
}: React.ComponentProps<"div"> & { variant?: keyof typeof styles }) {
  const Icon = icons[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-[10px] border p-4 text-[12px] leading-[19px]",
        styles[variant],
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export { Alert };
