import type { ReactNode } from "react";
import { LeafLineIcon } from "@/components/ui/figma-icons";

export function AuthShell({
  eyebrow = "Selamat datang di REHAT",
  title,
  description,
  notice,
  children,
  footer,
  spacer = false,
  footerAlign = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  notice?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  spacer?: boolean;
  footerAlign?: "center" | "left";
}) {
  return (
    <div className="flex-1 bg-white dark:bg-background">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-6 pt-10 pb-14 lg:flex-row lg:items-start lg:gap-[100px] lg:px-0 lg:pt-[60px] lg:pb-20">
        <aside className="hidden min-h-[653px] w-[550px] shrink-0 flex-col rounded-[18px] bg-[#eff3eb] px-10 pt-[50px] pb-8 lg:flex dark:bg-card">
          <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#52796a] uppercase">
            Ruang aman, untukmu
          </p>
          <h1 className="mt-[30px] font-heading text-[52px] leading-[55.12px] font-normal tracking-[-1.5px] text-[#203b33] dark:text-foreground">
            Kamu boleh
            <br />
            berhenti sejenak.
            <br />
            <span className="italic text-[#718369] dark:text-primary">
              Lalu mulai lagi.
            </span>
          </h1>
          <p className="mt-[22px] text-[13px] leading-[24.7px] text-[#59645f] dark:text-muted-foreground">
            Tidak harus punya semua jawaban.
            <br />
            Di sini, ceritamu punya tempat.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/auth-illustration.png"
            alt="Ilustrasi perjalanan kecil menuju ruang aman"
            className="mt-[25px] w-full rounded-[18px]"
          />
        </aside>

        <div className={`w-full max-w-[410px] pt-0 lg:pt-[18px] ${spacer ? "lg:pb-[170px]" : ""}`}>
          <p className="text-[12px] leading-[19.2px] font-semibold tracking-[1.8px] text-[#52796a] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-[15px] font-heading text-[32px] leading-[1.15] font-normal tracking-[-0.8px] text-[#203b33] sm:text-[37px] sm:leading-[42.55px] dark:text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-[10px] text-[13px] leading-[20.8px] text-[#59645f] dark:text-muted-foreground">
              {description}
            </p>
          ) : null}

          {notice ? (
            <div className="mt-7 flex items-start gap-3 rounded-[10px] bg-[#eff6f2] p-4 text-[12px] leading-[21px] text-[#435e50] dark:bg-accent dark:text-accent-foreground">
              <LeafLineIcon className="mt-0.5 size-[18px] shrink-0 text-[#52796a]" />
              <div>{notice}</div>
            </div>
          ) : null}

          <div className="mt-5">{children}</div>

          {footer ? (
            <div
              className={`mt-5 text-[12px] leading-[19.2px] text-[#59645f] dark:text-muted-foreground ${
                footerAlign === "left" ? "text-left" : "text-center"
              }`}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
