type ArtVariant = "chat" | "journey" | "heart";

const palettes: Record<
  ArtVariant,
  { bg: string; arch: string; circle: string }
> = {
  chat: { bg: "#eaf1e8", arch: "#dcece5", circle: "#bbd7cb" },
  journey: { bg: "#f1eee6", arch: "#e9e0d4", circle: "#ffffff" },
  heart: { bg: "#e9eeeb", arch: "#eff6f2", circle: "#dcece5" },
};

export function serviceArtMeta(name: string): {
  variant: ArtVariant;
  category: string;
} {
  const lower = name.toLowerCase();
  const variant: ArtVariant =
    lower.includes("pasangan") || lower.includes("relasi")
      ? "heart"
      : lower.includes("stres") || lower.includes("singkat")
        ? "journey"
        : "chat";
  const category =
    variant === "heart"
      ? "Tumbuh bersama"
      : variant === "journey"
        ? "Temukan keseimbangan"
        : "Untuk dirimu";
  return { variant, category };
}

export function ServiceArt({
  variant,
  category,
  compact = false,
}: {
  variant: ArtVariant;
  category?: string;
  compact?: boolean;
}) {
  const palette = palettes[variant];

  return (
    <div
      className={
        compact
          ? "relative h-[100px] overflow-hidden rounded-[10px]"
          : "relative h-[146px] overflow-hidden rounded-t-[14px]"
      }
    >
      <svg
        viewBox="0 0 383.3 146"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        className="absolute inset-0 size-full"
      >
        <rect width="383.3" height="146" fill={palette.bg} />
        <rect
          x="85.8"
          width="211.7"
          height="146"
          rx="21.9"
          fill={palette.arch}
        />
        <circle cx="191.65" cy="76.65" r="53.84" fill={palette.circle} />
        <circle cx="261.95" cy="41.05" r="3.65" fill="#c7a77a" />

        {variant === "chat" ? (
          <g transform="translate(157 58.4)">
            <path
              d="M 10.95 0 L 65.7 0 L 65.7 34.675 C 65.7 41.975 62.05 45.625 54.75 45.625 L 36.5 45.625 L 16.425 59.3125 L 16.425 45.625 L 10.95 45.625 C 3.65 45.625 0 41.975 0 34.675 L 0 10.95 C 0 3.65 3.65 0 10.95 0 Z"
              fill="#ffffff"
              stroke="#31594d"
              strokeWidth="2"
            />
            <circle cx="17.35" cy="23.74" r="2.74" fill="#31594d" />
            <circle cx="31.95" cy="23.74" r="2.74" fill="#31594d" />
            <circle cx="46.55" cy="23.74" r="2.74" fill="#31594d" />
          </g>
        ) : null}

        {variant === "journey" ? (
          <g
            transform="translate(157 62.5)"
            fill="none"
            stroke="#31594d"
            strokeWidth="3.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 0 31.4813 C 9.7333 13.8396 21.2917 13.8396 34.675 31.4813 C 48.0583 49.1229 59.6167 49.1229 69.35 31.4813" />
            <path d="M 6.3875 45.1688 C 16.1208 31.7854 25.55 31.4813 34.675 44.2563 C 43.8 57.0313 52.925 56.7271 62.05 43.3438" />
            <path d="M 18.25 11.4063 C 29.2 -3.8021 40.15 -3.8021 51.1 11.4063" />
          </g>
        ) : null}

        {variant === "heart" ? (
          <g transform="translate(159.7 60.4)">
            <path
              d="M 32.8712 49.9951 L 5.4962 23.5326 C -10.9288 7.1076 12.7962 -12.0549 32.8712 9.8451 C 52.9462 -12.0549 76.6712 7.1076 60.2462 23.5326 L 32.8712 49.9951 Z"
              fill="#ffffff"
              stroke="#31594d"
              strokeWidth="2.7375"
              strokeLinejoin="round"
            />
            <path
              d="M 0 6.3875 L 8.2125 14.6 L 21.9 0"
              transform="translate(21.9 18.1)"
              fill="none"
              stroke="#52796a"
              strokeWidth="2.7375"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ) : null}

        {variant === "journey" ? (
          <circle cx="191.7" cy="64.8" r="8.21" fill="#c7a77a" />
        ) : null}
      </svg>

      {!compact && category ? (
        <span className="absolute bottom-[13px] left-5 inline-flex h-[26px] items-center rounded-[4px] bg-white px-[7px] text-[12px] leading-[19.2px] tracking-[1.2px] text-[#4b6756] uppercase">
          {category}
        </span>
      ) : null}
    </div>
  );
}

export function PublicServiceCard({
  name,
  description,
  durationMinutes,
  methods,
  price,
  index,
  href,
  actionLabel = "Pilih layanan",
}: {
  name: string;
  description: string;
  durationMinutes: number;
  methods: string[];
  price: string;
  index: number;
  href: string;
  actionLabel?: string;
}) {
  const { variant, category } = serviceArtMeta(name);
  const methodLabel = methods
    .map((method) => (method === "chat" ? "Chat" : "Zoom"))
    .join(" / ");

  return (
    <article className="flex flex-col overflow-hidden rounded-[14px] border border-[#e1e7e1] bg-white transition-colors hover:border-[#c4cec5] dark:border-border dark:bg-card">
      <ServiceArt variant={variant} category={category} />

      <div className="flex flex-1 flex-col px-[22px] pt-[22px] pb-[18px]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-sans text-[18px] leading-[28.8px] font-semibold tracking-[-0.3px] text-[#203b33] dark:text-foreground">
            {name}
          </h2>
          <span className="font-heading text-[14px] leading-[1.4] text-[#a0aa9c]">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <p className="mt-[10px] text-[14px] leading-[26.6px] text-[#59645f] dark:text-muted-foreground">
          {description}
        </p>

        <div className="mt-[20px] flex flex-wrap items-center gap-5 text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            {durationMinutes} menit
          </span>
          <span className="inline-flex items-center gap-1.5">
            {methodLabel.includes("Chat") ? (
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                aria-hidden
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="6" width="13" height="12" rx="2" />
                <path d="m15 11 6-4v10l-6-4" />
              </svg>
            )}
            {methodLabel}
          </span>
        </div>

        <div className="mt-[17px] flex-1 border-t border-[#e1e7e1] pt-[15px] dark:border-border">
          <p className="text-[12px] leading-[19.2px] text-[#68746d] dark:text-muted-foreground">
            Per sesi
          </p>
          <p className="mt-1 text-[15px] leading-[24px] font-semibold text-[#203b33] dark:text-foreground">
            {price}
          </p>
        </div>

        <div className="mt-[18px]">
          <a
            href={href}
            className="inline-flex h-[50px] w-full items-center justify-center gap-[22px] rounded-[10px] bg-[#203b33] px-6 text-[13px] leading-[18.2px] font-semibold text-white transition-colors hover:bg-[#31594d] dark:bg-primary dark:hover:bg-primary/90"
          >
            {actionLabel}
            <svg
              viewBox="0 0 24 24"
              aria-hidden
              className="size-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
