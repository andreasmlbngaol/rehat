import type { ReactNode } from "react";
import { cn } from "cn";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-[#e1e7e1] bg-card px-6 py-10 text-center dark:border-border",
        className,
      )}
    >
      {icon ? (
        <div className="mb-1 flex size-14 items-center justify-center rounded-full bg-[#eff6f2] text-[#31594d] dark:bg-accent dark:text-accent-foreground">
          {icon}
        </div>
      ) : null}
      <p className="text-[16px] leading-[26px] font-semibold text-[#203b33] dark:text-foreground">
        {title}
      </p>
      {description ? (
        <p className="max-w-md text-[12px] leading-[19px] text-[#59645f] dark:text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
