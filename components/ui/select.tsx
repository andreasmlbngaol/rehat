import * as React from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { cn } from "cn";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-11 w-full appearance-none rounded-[9px] border border-[#aab7af] bg-card px-3.5 pr-9 text-sm text-[#203b33] transition-colors outline-none focus-visible:border-[#203b33] focus-visible:ring-2 focus-visible:ring-[#203b33]/10 disabled:cursor-not-allowed disabled:border-[#e1e7e1] disabled:bg-[#f5f7f5] disabled:text-[#929b96] dark:border-input dark:bg-card dark:text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <CaretDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#68746d]" />
    </div>
  );
}

export { Select };
