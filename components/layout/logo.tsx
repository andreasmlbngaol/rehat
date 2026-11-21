import Link from "next/link";
import { cn } from "cn";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="REHAT - Beranda"
      className={cn(
        "inline-flex items-center gap-2.5 font-sans leading-none font-bold tracking-[-0.6px] text-[#203b33] transition-opacity hover:opacity-80 dark:text-foreground",
        compact ? "text-[21px] leading-[21px]" : "text-[27px] leading-[27px]",
        className,
      )}
    >
      <svg
        viewBox="0 0 35 35"
        aria-hidden
        className={cn("shrink-0", compact ? "size-7" : "size-[35px]")}
      >
        <rect width="35" height="35" rx="9.1146" fill="#203b33" />
        <path
          d="M 10.6718 14.9479 C 2.651 13.125 -0.6303 7.6563 0.0989 0 C 6.6614 0.3646 10.3072 4.7396 10.6718 10.9375 C 11.7656 5.1042 15.4114 1.4583 21.2447 0 C 21.9739 8.3854 18.3281 13.8542 10.6718 14.9479 Z"
          fill="#bbd7cb"
          transform="translate(6.8282 10.5729)"
        />
        <line
          x1="17.5"
          y1="22.2396"
          x2="17.5"
          y2="27.3438"
          stroke="#bbd7cb"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <circle cx="17.5" cy="8.3854" r="1.8229" fill="#c7a77a" />
      </svg>
      <span className={compact ? "w-[89px]" : "w-[111px]"}>
        REHAT<span className="text-[#c7a77a]">.</span>
      </span>
    </Link>
  );
}
