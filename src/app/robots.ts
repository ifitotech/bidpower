import type { MetadataRoute } from "next";

// The app is private; only the public information pages may be indexed.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/terms", "/privacy", "/help"], disallow: "/" }] };
}
