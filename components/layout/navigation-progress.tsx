"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type PendingNavigation =
  | { kind: "push"; destination: string }
  | { kind: "history"; from: string };

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function toRouteKey(href: string): string {
  const url = new URL(href, window.location.href);
  return `${normalizePath(url.pathname)}?${url.searchParams.toString()}`;
}

/** Start the top progress bar for programmatic router.push() calls. */
export function startNavigationProgress(destination?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("rehat:navigation-start", { detail: { destination } }),
  );
}

/**
 * Immediate feedback for client-side navigations. Starts on any internal
 * link click or history navigation and stops when the destination renders.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${normalizePath(pathname)}?${searchParams.toString()}`;
  const [pending, setPending] = useState<PendingNavigation | null>(null);

  const navigating =
    pending !== null &&
    (pending.kind === "push"
      ? pending.destination !== routeKey
      : pending.from === routeKey);

  useEffect(() => {
    function isInternalLink(anchor: HTMLAnchorElement): boolean {
      if (anchor.target && anchor.target !== "_self") return false;
      if (anchor.hasAttribute("download")) return false;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return false;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      if (url.pathname.startsWith("/api/")) return false;
      return true;
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor || !isInternalLink(anchor)) return;

      const destination = toRouteKey(anchor.href);
      if (destination === routeKey) return;

      setPending({ kind: "push", destination });
    }

    function onPopState() {
      setPending({ kind: "history", from: routeKey });
    }

    function onStart(event: Event) {
      const destination = (
        event as CustomEvent<{ destination?: string }>
      ).detail?.destination;

      if (destination) {
        setPending({ kind: "push", destination: toRouteKey(destination) });
      } else {
        setPending({ kind: "history", from: routeKey });
      }
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("rehat:navigation-start", onStart);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("rehat:navigation-start", onStart);
    };
  }, [routeKey]);

  useEffect(() => {
    if (!pending) return;

    const timer = window.setTimeout(() => setPending(null), 12_000);
    return () => window.clearTimeout(timer);
  }, [pending]);

  return (
    <div
      role="progressbar"
      aria-label="Memuat halaman"
      aria-hidden={!navigating}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden transition-opacity duration-200 ${
        navigating ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="h-full w-1/4 animate-[navigation-progress_1.1s_ease-in-out_infinite] bg-primary shadow-[0_0_8px_var(--primary)] motion-reduce:animate-none" />
    </div>
  );
}
