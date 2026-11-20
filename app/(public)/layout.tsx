import { SessionProvider } from "@/components/providers/session-provider";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="flex min-h-svh flex-col">
        <PublicHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <PublicFooter />
      </div>
    </SessionProvider>
  );
}
