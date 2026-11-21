import * as React from "react";
import { cn } from "cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[120px] w-full rounded-[9px] border border-[#aab7af] bg-card px-3.5 py-3 text-sm text-[#203b33] transition-colors outline-none placeholder:text-[#68746d] focus-visible:border-[#203b33] focus-visible:ring-2 focus-visible:ring-[#203b33]/10 disabled:cursor-not-allowed disabled:border-[#e1e7e1] disabled:bg-[#f5f7f5] disabled:text-[#929b96] aria-invalid:border-[#c74747] aria-invalid:ring-2 aria-invalid:ring-[#c74747]/10 dark:border-input dark:bg-card dark:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
