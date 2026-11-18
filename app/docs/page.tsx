"use client";

import Script from "next/script";
import "swagger-ui-dist/swagger-ui.css";

declare global {
  interface Window {
    SwaggerUIBundle?: (config: Record<string, unknown>) => unknown;
  }
}

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div id="swagger-ui" />
      <Script
        src="/swagger-ui/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.SwaggerUIBundle?.({
            url: "/api/docs",
            dom_id: "#swagger-ui",
            deepLinking: true,
            docExpansion: "list",
            defaultModelsExpandDepth: -1,
            displayRequestDuration: true,
            filter: true,
            persistAuthorization: true,
          });
        }}
      />
    </main>
  );
}
