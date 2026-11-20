import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] border border-transparent bg-clip-padding text-[13px] leading-[18px] font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#31594d] dark:hover:bg-primary/90",
        outline:
          "border-[#c4cec5] bg-card text-[#203b33] hover:bg-[#f5f7f5] dark:border-input dark:bg-transparent dark:hover:bg-muted",
        secondary:
          "bg-[#eaf2ec] text-[#203b33] hover:bg-[#dceadf] dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/80",
        ghost:
          "text-[#31594d] hover:bg-[#eff6f2] dark:text-accent-foreground dark:hover:bg-accent",
        destructive:
          "bg-[#9b3f3f] text-white hover:bg-[#873333] focus-visible:ring-destructive/20 dark:bg-destructive dark:text-destructive-foreground",
        link: "text-[#31594d] underline-offset-4 hover:underline dark:text-primary",
      },
      size: {
        default: "h-[43px] rounded-[9px] px-5 py-2.5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 rounded-[6px] px-2 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[8px] px-3.5 text-[12px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[50px] gap-2 rounded-[10px] px-6 text-[13px]",
        icon: "size-11",
        "icon-xs": "size-7 rounded-[6px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-[8px] [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
