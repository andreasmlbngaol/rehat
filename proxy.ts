import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

function buildCsp(): string {
  // Nonce tidak dipakai: halaman statis/Partial Prerender dibangun tanpa
  // nonce, sehingga `strict-dynamic` akan memblokir seluruh script-nya.
  // Kebijakan tetap membatasi sumber script ke origin sendiri + Midtrans.
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://*.midtrans.com${
      isProduction ? "" : " 'unsafe-eval'"
    }`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.midtrans.com",
    "frame-src 'self' https://*.midtrans.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ];

  return directives.join("; ");
}

/**
 * Next.js 16 mengganti `middleware.ts` menjadi `proxy.ts`.
 * Fungsi ini me-refresh session Supabase, menambahkan CSP, dan
 * melakukan redirect optimistis. Otorisasi sebenarnya tetap di Route Handler
 * dan layout server-side.
 */
export async function proxy(request: NextRequest) {
  const csp = buildCsp();
  const cspHeader = isProduction
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(cspHeader, csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(cspHeader, csp);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: requestHeaders } });
          response.headers.set(cspHeader, csp);
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/verify-email";
  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/counselor") ||
    pathname.startsWith("/admin");

  function redirectTo(target: string) {
    const url = new URL(target, request.url);
    const redirect = NextResponse.redirect(url);

    for (const header of response.headers.getSetCookie()) {
      redirect.headers.append("set-cookie", header);
    }

    redirect.headers.set(cspHeader, csp);
    return redirect;
  }

  if (user) {
    const verified = Boolean(user.email_confirmed_at);

    if (!verified) {
      if (pathname !== "/verify-email") {
        return redirectTo("/verify-email");
      }
    } else if (isAuthPage) {
      return redirectTo("/dashboard");
    }
  } else if (isDashboard) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );
    return redirectTo(`${loginUrl.pathname}${loginUrl.search}`);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
