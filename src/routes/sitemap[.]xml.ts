import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/practice", changefreq: "daily" },
          { path: "/practice/post", changefreq: "weekly" },
          { path: "/practice/shifts", changefreq: "daily" },
          { path: "/practice/hours", changefreq: "weekly" },
          { path: "/locum", changefreq: "daily" },
          { path: "/locum/find", changefreq: "daily" },
          { path: "/locum/bookings", changefreq: "weekly" },
          { path: "/locum/profile", changefreq: "monthly" },
        ];
        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          entries
            .map(
              (e) =>
                `  <url><loc>${BASE_URL}${e.path}</loc><changefreq>${e.changefreq}</changefreq>${e.priority ? `<priority>${e.priority}</priority>` : ""}</url>`,
            )
            .join("\n") +
          `\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      },
    },
  },
});
