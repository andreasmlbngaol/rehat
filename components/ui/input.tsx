import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-[9px] border border-[#aab7af] bg-card px-3.5 py-3 text-sm text-[#203b33] transition-colors outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#68746d] focus-visible:border-[#203b33] focus-visible:ring-2 focus-visible:ring-[#203b33]/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[#e1e7e1] disabled:bg-[#f5f7f5] disabled:text-[#929b96] disabled:opacity-100 aria-invalid:border-[#c74747] aria-invalid:ring-2 aria-invalid:ring-[#c74747]/10 dark:border-input dark:bg-card dark:text-foreground dark:disabled:bg-muted",
        className
      )}
      {...props}
    />
  )
}

export { Input }
