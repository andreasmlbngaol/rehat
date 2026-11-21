"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/monitoring/client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { boundary: "app/global-error" });
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#f8faf9",
          color: "#132022",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0f766e",
              fontWeight: 600,
            }}
          >
            REHAT
          </p>
          <h1 style={{ fontSize: 28, margin: "12px 0" }}>
            Aplikasi gagal dimuat
          </h1>
          <p style={{ color: "#526466", fontSize: 14, lineHeight: 1.6 }}>
            Terjadi kesalahan yang tidak terduga. Silakan muat ulang halaman.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              border: 0,
              borderRadius: 8,
              padding: "10px 18px",
              background: "#0f766e",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Muat ulang
          </button>
        </div>
      </body>
    </html>
  );
}
