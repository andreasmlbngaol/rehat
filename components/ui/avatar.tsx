"use client";

import { useState } from "react";
import { cn } from "cn";
import { initials } from "@/lib/format";

type AvatarProps = {
  src?: string | null;
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizes = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-[13px]",
  lg: "size-14 text-[18px]",
  xl: "size-20 text-[24px]",
};

export function Avatar({ src, name, className, size = "md" }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eaf2ec] font-semibold text-[#31594d] dark:bg-accent dark:text-accent-foreground",
        sizes[size],
        className,
      )}
      aria-hidden={!name}
    >
      {showImage && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="size-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
