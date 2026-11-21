import type { ReactNode } from "react";
import { cn } from "cn";
import { TodayBadge } from "@/components/ui/today-badge";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  date = true,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  date?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.4px] text-[#52796a] uppercase dark:text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-sans text-[26px] leading-[36.4px] font-semibold tracking-[-0.7px] text-[#203b33] dark:text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {date || actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:mt-[19px]">
          {date ? <TodayBadge className="hidden sm:inline-flex" /> : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}
