import Link from "next/link";
import { Info } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/layout/logo";
import { LeafMark } from "@/components/ui/leaf-mark";

// Dihitung saat modul dimuat, bukan saat render, agar aman untuk prerender.
const COPYRIGHT_YEAR = new Date().getFullYear();

const links = [
  { href: "/", label: "Beranda" },
  { href: "/services", label: "Layanan" },
  { href: "/cara-kerja", label: "Cara Kerja" },
  { href: "/login", label: "Masuk / Daftar" },
];


export function PublicFooter() {
  return (
    <footer className="mt-auto bg-white dark:bg-card">
      <div className="mx-auto w-full max-w-[1200px] px-6 pt-10 lg:px-0 lg:pt-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-0 lg:pb-[35px]">
          <div>
            <Logo compact />
            <p className="mt-[13px] max-w-[160px] text-[12px] leading-[21.6px] text-[#59645f] dark:text-muted-foreground">
              Ruang Emosional untuk
              <br />
              Hidup Aman dan Tenang.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-[30px] gap-y-2 text-[12px] leading-[19.2px] text-[#59645f] lg:h-11 lg:flex-nowrap lg:pt-[3px] dark:text-muted-foreground">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-[#203b33] dark:hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex max-w-[230px] items-start gap-5 text-[#6f8267] dark:text-muted-foreground">
            <p className="font-quote text-[24px] leading-[28.8px]">
              “Pelan-pelan juga
              <br />
              tetap melangkah.”
            </p>
            <LeafMark className="mt-[17px] size-6 shrink-0" />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#e1e7e1] py-5 text-[12px] leading-[19.2px] text-[#68746d] sm:flex-row sm:items-center sm:justify-between dark:border-border dark:text-muted-foreground">
          <p>© {COPYRIGHT_YEAR} REHAT. Seluruh hak dilindungi.</p>
          <p className="flex items-center gap-[6px]">
            <Info className="size-3.5 shrink-0" />
            REHAT tidak menyediakan layanan penanganan krisis atau keadaan darurat.
          </p>
        </div>
      </div>
    </footer>
  );
}
